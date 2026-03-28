import { createClient } from '@insforge/sdk';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(process.env.SQLITE_DB_PATH || 'aspire.db');

const insforge = createClient({
  baseUrl: process.env.VITE_INSFORGE_URL || '',
  anonKey: process.env.VITE_INSFORGE_ANON_KEY || ''
});

async function runSync() {
  console.log('Fetching local data...');
  const students = db.prepare('SELECT * FROM Students').all();
  const parents = db.prepare('SELECT * FROM Parents').all();
  const subjects = db.prepare('SELECT * FROM StudentSubjects').all();

  console.log(`Found ${students.length} students, ${parents.length} parents, ${subjects.length} subject links locally.`);

  console.log('Fetching remote students from InsForge...');
  const { data: remoteStudents, error: stuErr } = await insforge.database.from('Students').select('StudentID');
  if (stuErr) {
    console.error('Failed to fetch remote students:', stuErr);
    return;
  }
  const remoteStudentIds = new Set(remoteStudents.map((s: any) => s.StudentID));

  console.log('Fetching remote parents from InsForge...');
  const { data: remoteParents, error: parErr } = await insforge.database.from('Parents').select('MobileNumber');
  const remoteParentMobiles = new Set((remoteParents || []).map((p: any) => p.MobileNumber));

  console.log('Fetching remote subject links from InsForge...');
  const { data: remoteSubjects, error: subErr } = await insforge.database.from('StudentSubjects').select('StudentID, SubjectID');
  const remoteSubjectKeys = new Set((remoteSubjects || []).map((s: any) => `${s.StudentID}-${s.SubjectID}`));

  let addedStudents = 0;
  for (const s of students as any[]) {
    if (!remoteStudentIds.has(s.StudentID)) {
      console.log(`Pushing missing student: ${s.Name} (${s.StudentID})`);
      const { error } = await insforge.database.from('Students').insert([s]);
      if (error && error.code !== '23505') console.error(`Error pushing student ${s.Name}:`, error);
      else addedStudents++;
    } else {
      // Upsert/update just to be safe if fields changed
      console.log(`Updating existing student: ${s.Name}`);
      await insforge.database.from('Students').update(s).eq('StudentID', s.StudentID);
    }
  }

  let addedParents = 0;
  for (const p of parents as any[]) {
    if (!remoteParentMobiles.has(p.MobileNumber)) {
      console.log(`Pushing missing parent: ${p.ParentName} (${p.MobileNumber})`);
      const { ParentID, ...parentWithoutID } = p; // do not push SQLite sequence ID
      const { error } = await insforge.database.from('Parents').insert([parentWithoutID]);
      if (error && error.code !== '23505') console.error(`Error pushing parent ${p.ParentName}:`, error);
      else addedParents++;
    } else {
      console.log(`Updating existing parent: ${p.ParentName}`);
      const { ParentID, ...parentWithoutID } = p;
      await insforge.database.from('Parents').update(parentWithoutID).eq('MobileNumber', p.MobileNumber);
    }
  }

  let addedSubjects = 0;
  for (const sub of subjects as any[]) {
    const key = `${sub.StudentID}-${sub.SubjectID}`;
    if (!remoteSubjectKeys.has(key)) {
      console.log(`Pushing missing subject link: ${key}`);
      const { error } = await insforge.database.from('StudentSubjects').insert([{
        StudentID: sub.StudentID,
        SubjectID: sub.SubjectID
      }]);
      if (error && error.code !== '23505') console.error(`Error pushing subject link ${key}:`, error);
      else addedSubjects++;
    }
  }

  console.log(`\nSync Summary:`);
  console.log(`Added/synced new students: ${addedStudents}`);
  console.log(`Added/synced new parents: ${addedParents}`);
  console.log(`Added/synced new subject links: ${addedSubjects}`);
  console.log('All local data is now checked and pushed to InsForge.');
}

runSync().catch(console.error);
