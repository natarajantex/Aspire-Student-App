import Database from 'better-sqlite3';

const db = new Database('e:\\tuition\\app\\Aspire App 2\\aspire.db');

const years = db.prepare('SELECT * FROM AcademicYears ORDER BY AcademicYear DESC').all();
console.log('Years from DB query:', years);
