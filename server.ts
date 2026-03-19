import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(process.env.SQLITE_DB_PATH || 'aspire.db');

const insforge = createClient({
  baseUrl: process.env.VITE_INSFORGE_URL || '',
  anonKey: process.env.VITE_INSFORGE_ANON_KEY || ''
});

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS Classes (
    ClassID TEXT PRIMARY KEY,
    ClassName TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Subjects (
    SubjectID TEXT PRIMARY KEY,
    ClassID TEXT NOT NULL,
    SubjectName TEXT NOT NULL,
    FOREIGN KEY (ClassID) REFERENCES Classes(ClassID)
  );

  CREATE TABLE IF NOT EXISTS Students (
    StudentID TEXT PRIMARY KEY,
    RollNumber TEXT,
    Name TEXT NOT NULL,
    AcademicYear TEXT,
    ClassID TEXT NOT NULL,
    ParentName TEXT,
    ParentWhatsAppNumber TEXT,
    EnrollmentDate TEXT,
    FOREIGN KEY (ClassID) REFERENCES Classes(ClassID)
  );

  CREATE TABLE IF NOT EXISTS StudentSubjects (
    RecordID INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentID TEXT NOT NULL,
    SubjectID TEXT NOT NULL,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
  );

  CREATE TABLE IF NOT EXISTS SubjectSchedule (
    ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassID TEXT NOT NULL,
    SubjectID TEXT NOT NULL,
    DayOfWeek TEXT NOT NULL,
    Time TEXT NOT NULL,
    FOREIGN KEY (ClassID) REFERENCES Classes(ClassID),
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
  );

  CREATE TABLE IF NOT EXISTS Attendance (
    AttendanceID INTEGER PRIMARY KEY AUTOINCREMENT,
    Date TEXT NOT NULL,
    StudentID TEXT NOT NULL,
    SubjectID TEXT NOT NULL,
    Status TEXT NOT NULL,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
  );

  CREATE TABLE IF NOT EXISTS Tests (
    TestID INTEGER PRIMARY KEY AUTOINCREMENT,
    Date TEXT NOT NULL,
    StudentID TEXT NOT NULL,
    SubjectID TEXT NOT NULL,
    MarksObtained REAL NOT NULL,
    TotalMarks REAL NOT NULL,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
  );

  CREATE TABLE IF NOT EXISTS AcademicYears (
    AcademicYearID TEXT PRIMARY KEY,
    AcademicYear TEXT NOT NULL,
    Status TEXT DEFAULT 'Inactive'
  );

  CREATE TABLE IF NOT EXISTS InstituteDetails (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    InstituteName TEXT,
    InstituteAddress TEXT,
    ContactNumber TEXT,
    WhatsAppGroupLink TEXT
  );

  CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Role TEXT NOT NULL DEFAULT 'Staff',
    Status TEXT NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS Parents (
    ParentID INTEGER PRIMARY KEY AUTOINCREMENT,
    ParentName TEXT NOT NULL,
    MobileNumber TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    StudentID TEXT NOT NULL,
    Status TEXT NOT NULL DEFAULT 'Active',
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
  );
`);

// Add new columns to tables if they don't exist
const addColumn = (table: string, columnDef: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
  } catch (e) {}
};

addColumn('Classes', 'Status TEXT DEFAULT \'Active\'');
addColumn('Subjects', 'Status TEXT DEFAULT \'Active\'');
addColumn('Students', 'RollNumber TEXT');
addColumn('Students', 'AcademicYear TEXT');
addColumn('Students', 'EnrollmentDate TEXT');
addColumn('Students', 'Photo TEXT');
addColumn('Students', 'StudentStatus TEXT DEFAULT \'Active\'');
addColumn('Tests', 'IsAbsent INTEGER DEFAULT 0');
addColumn('Tests', 'Chapter TEXT');

// Seed Data
const seedData = () => {
  const classCount = db.prepare('SELECT COUNT(*) as count FROM Classes').get() as { count: number };
  if (classCount.count === 0) {
    const insertClass = db.prepare('INSERT INTO Classes (ClassID, ClassName) VALUES (?, ?)');
    insertClass.run('C10', 'Class 10');
    insertClass.run('C12', 'Class 12');

    const insertSubject = db.prepare('INSERT INTO Subjects (SubjectID, ClassID, SubjectName) VALUES (?, ?, ?)');
    insertSubject.run('M10', 'C10', 'Maths');
    insertSubject.run('S10', 'C10', 'Science');
    insertSubject.run('SO10', 'C10', 'Social');
    insertSubject.run('P12', 'C12', 'Physics');
    insertSubject.run('M12', 'C12', 'Maths');
    insertSubject.run('C12', 'C12', 'Chemistry');

    const insertStudent = db.prepare('INSERT INTO Students (StudentID, RollNumber, Name, AcademicYear, ClassID, ParentName, ParentWhatsAppNumber, EnrollmentDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertStudent.run('ST001', '25A1001', 'Arun', '2025-2026', 'C10', 'Ramesh', '919876543210', '2025-06-01');
    insertStudent.run('ST002', '25A1002', 'Priya', '2025-2026', 'C10', 'Suresh', '919876543211', '2025-06-02');
    insertStudent.run('ST003', '25A1003', 'Karthik', '2025-2026', 'C12', 'Mahesh', '919876543212', '2025-06-03');

    const insertStudentSubject = db.prepare('INSERT INTO StudentSubjects (StudentID, SubjectID) VALUES (?, ?)');
    insertStudentSubject.run('ST001', 'M10');
    insertStudentSubject.run('ST001', 'S10');
    insertStudentSubject.run('ST002', 'M10');
    insertStudentSubject.run('ST002', 'SO10');
    insertStudentSubject.run('ST003', 'P12');
    insertStudentSubject.run('ST003', 'M12');
    insertStudentSubject.run('ST003', 'C12');

    const insertSchedule = db.prepare('INSERT INTO SubjectSchedule (ClassID, SubjectID, DayOfWeek, Time) VALUES (?, ?, ?, ?)');
    insertSchedule.run('C10', 'M10', 'Monday', '5 PM');
    insertSchedule.run('C10', 'SO10', 'Tuesday', '5 PM');
    insertSchedule.run('C10', 'S10', 'Wednesday', '5 PM');
    insertSchedule.run('C12', 'P12', 'Monday', '6 PM');
    insertSchedule.run('C12', 'M12', 'Tuesday', '6 PM');
    insertSchedule.run('C12', 'C12', 'Thursday', '6 PM');
  }

  const yearCount = db.prepare('SELECT COUNT(*) as count FROM AcademicYears').get() as { count: number };
  if (yearCount.count === 0) {
    const insertYear = db.prepare('INSERT INTO AcademicYears (AcademicYearID, AcademicYear, Status) VALUES (?, ?, ?)');
    insertYear.run('AY2526', '2025-2026', 'Active');
    insertYear.run('AY2627', '2026-2027', 'Inactive');
  }

  const instCount = db.prepare('SELECT COUNT(*) as count FROM InstituteDetails').get() as { count: number };
  if (instCount.count === 0) {
    const insertInst = db.prepare('INSERT INTO InstituteDetails (InstituteName, InstituteAddress, ContactNumber, WhatsAppGroupLink) VALUES (?, ?, ?, ?)');
    insertInst.run('Aspire Academics', '123 Education Lane, Knowledge City', '+91 9876543210', 'https://chat.whatsapp.com/example');
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO Users (Name, Email, Password, Role, Status) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('Admin User', 'admin@aspire.com', 'password123', 'Staff', 'Active');
  }

  const parentCount = db.prepare('SELECT COUNT(*) as count FROM Parents').get() as { count: number };
  if (parentCount.count === 0) {
    const insertParent = db.prepare('INSERT INTO Parents (ParentName, MobileNumber, Password, StudentID, Status) VALUES (?, ?, ?, ?, ?)');
    insertParent.run('Ramesh', '919876543210', '543210', 'ST001', 'Active');
    insertParent.run('Suresh', '919876543211', '543211', 'ST002', 'Active');
    insertParent.run('Mahesh', '919876543212', '543212', 'ST003', 'Active');
  }
};

seedData();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/login/staff', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM Users WHERE Email = ? AND Password = ? AND Status = ?').get(email, password, 'Active') as any;
    if (user) {
      return res.json({ token: 'dummy-staff-token', user: { id: user.UserID, name: user.Name, role: 'admin' } });
    }
    
    // Fallback: check if they accidentally used the staff login for a parent account
    const cleanMobile = email ? email.replace(/\D/g, '') : '';
    let parent = null;
    if (cleanMobile.length >= 10) {
      const last10 = cleanMobile.slice(-10);
      parent = db.prepare('SELECT * FROM Parents WHERE MobileNumber LIKE ? AND Status = ?').get(`%${last10}`, 'Active') as any;
    } else {
      parent = db.prepare('SELECT * FROM Parents WHERE MobileNumber = ? AND Status = ?').get(cleanMobile, 'Active') as any;
    }
    
    if (parent) {
      const expectedPassword = parent.MobileNumber.replace(/\D/g, '').slice(-6);
      if (password === expectedPassword) {
        return res.json({ token: 'dummy-parent-token', user: { id: parent.ParentID, name: parent.ParentName, role: 'parent', studentId: parent.StudentID } });
      }
    }
    
    res.status(401).json({ error: 'Invalid credentials or account disabled' });
  });

  app.post('/api/auth/login/parent', (req, res) => {
    console.log('Parent login attempt:', req.body);
    const { mobileNumber, password } = req.body;
    const cleanMobile = mobileNumber ? mobileNumber.replace(/\D/g, '') : '';
    
    let parent = null;
    if (cleanMobile.length >= 10) {
      const last10 = cleanMobile.slice(-10);
      parent = db.prepare('SELECT * FROM Parents WHERE MobileNumber LIKE ? AND Status = ?').get(`%${last10}`, 'Active') as any;
    } else {
      parent = db.prepare('SELECT * FROM Parents WHERE MobileNumber = ? AND Status = ?').get(cleanMobile, 'Active') as any;
    }
    
    console.log('Found parent:', parent);
    if (parent) {
      const expectedPassword = parent.MobileNumber.replace(/\D/g, '').slice(-6);
      if (password === expectedPassword) {
        return res.json({ token: 'dummy-parent-token', user: { id: parent.ParentID, name: parent.ParentName, role: 'parent', studentId: parent.StudentID } });
      }
    }
    
    // Fallback: check if they accidentally used the parent login for a staff account
    const user = db.prepare('SELECT * FROM Users WHERE Email = ? AND Password = ? AND Status = ?').get(mobileNumber, password, 'Active') as any;
    if (user) {
      return res.json({ token: 'dummy-staff-token', user: { id: user.UserID, name: user.Name, role: 'admin' } });
    }
    
    res.status(401).json({ error: 'Invalid credentials or account disabled' });
  });

  // Parent Management Routes
  app.get('/api/parents', (req, res) => {
    const parents = db.prepare(`
      SELECT p.*, s.Name as StudentName, s.RollNumber
      FROM Parents p
      LEFT JOIN Students s ON p.StudentID = s.StudentID
    `).all();
    res.json(parents);
  });

  app.post('/api/parents', (req, res) => {
    const { parentName, mobileNumber, password, studentId } = req.body;
    try {
      const insert = db.prepare('INSERT INTO Parents (ParentName, MobileNumber, Password, StudentID) VALUES (?, ?, ?, ?)');
      insert.run(parentName, mobileNumber, password, studentId);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: 'Failed to create parent account' });
    }
  });

  app.put('/api/parents/:id', (req, res) => {
    const { parentName, mobileNumber, password, studentId, status } = req.body;
    try {
      const update = db.prepare('UPDATE Parents SET ParentName = ?, MobileNumber = ?, Password = ?, StudentID = ?, Status = ? WHERE ParentID = ?');
      update.run(parentName, mobileNumber, password, studentId, status, req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: 'Failed to update parent account' });
    }
  });

  // API Routes
  app.get('/api/dashboard', (req, res) => {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM Students').get() as { count: number };
    
    const classWiseStudents = db.prepare(`
      SELECT c.ClassName, COUNT(s.StudentID) as count
      FROM Classes c
      LEFT JOIN Students s ON c.ClassID = s.ClassID
      GROUP BY c.ClassID, c.ClassName
      ORDER BY c.ClassName
    `).all();
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    const todayClasses = db.prepare(`
      SELECT s.SubjectName, c.ClassName, sch.Time, sch.SubjectID
      FROM SubjectSchedule sch
      JOIN Subjects s ON sch.SubjectID = s.SubjectID
      JOIN Classes c ON sch.ClassID = c.ClassID
      WHERE sch.DayOfWeek = ?
    `).all(today);

    res.json({
      totalStudents: totalStudents.count,
      classWiseStudents,
      todayClasses,
      today
    });
  });

  app.get('/api/students', (req, res) => {
    const students = db.prepare(`
      SELECT st.*, c.ClassName, 
             GROUP_CONCAT(s.SubjectName, ', ') as EnrolledSubjects,
             GROUP_CONCAT(s.SubjectID, ',') as EnrolledSubjectIDs,
             COALESCE(st.StudentStatus, 'Active') as StudentStatus
      FROM Students st
      JOIN Classes c ON st.ClassID = c.ClassID
      LEFT JOIN StudentSubjects ss ON st.StudentID = ss.StudentID
      LEFT JOIN Subjects s ON ss.SubjectID = s.SubjectID
      GROUP BY st.StudentID
    `).all();
    res.json(students);
  });

  app.get('/api/generate-roll-number', (req, res) => {
    const { academicYear, classId } = req.query;
    if (!academicYear || !classId) {
      return res.status(400).json({ error: 'Missing academicYear or classId' });
    }

    try {
      const yearStr = String(academicYear);
      const match = yearStr.match(/^(\d{4})/);
      const year = match ? match[1] : yearStr;
      const yy = year.slice(-2);

      const classRecord = db.prepare('SELECT ClassName FROM Classes WHERE ClassID = ?').get(classId) as { ClassName: string } | undefined;
      const cc = classRecord ? classRecord.ClassName.replace(/\D/g, '') : String(classId).replace(/\D/g, '');

      const prefix = `${yy}A${cc}`;

      const highestStudent = db.prepare(`
        SELECT RollNumber FROM Students
        WHERE AcademicYear = ? AND ClassID = ? AND RollNumber LIKE ?
        ORDER BY LENGTH(RollNumber) DESC, RollNumber DESC LIMIT 1
      `).get(academicYear, classId, `${prefix}%`) as { RollNumber: string } | undefined;

      let nextSequence = 1;
      if (highestStudent && highestStudent.RollNumber) {
        const currentSeqStr = highestStudent.RollNumber.slice(prefix.length);
        const currentSeq = parseInt(currentSeqStr, 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }

      const rr = nextSequence.toString().padStart(2, '0');
      const rollNumber = `${prefix}${rr}`;

      res.json({ rollNumber });
    } catch (error) {
      console.error('Error generating roll number:', error);
      res.status(500).json({ error: 'Failed to generate roll number' });
    }
  });

  app.post('/api/students', async (req, res) => {
    const { name, academicYear, classId, parentName, parentWhatsApp, enrollmentDate, subjects, photo, rollNumber } = req.body;
    
    if (!name || !academicYear || !classId || !enrollmentDate || !rollNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Generate StudentID
      const studentId = `ST${Date.now()}`;

      const insertStudent = db.prepare(`
        INSERT INTO Students (StudentID, RollNumber, Name, AcademicYear, ClassID, ParentName, ParentWhatsAppNumber, EnrollmentDate, Photo, StudentStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
      `);
      
      insertStudent.run(studentId, rollNumber, name, academicYear, classId, parentName, parentWhatsApp, enrollmentDate, photo || null);

      // --- InsForge Insertion ---
      await insforge.database.from('Students').insert([{
        StudentID: studentId,
        RollNumber: rollNumber,
        Name: name,
        AcademicYear: academicYear,
        ClassID: classId,
        ParentName: parentName,
        ParentWhatsAppNumber: parentWhatsApp,
        EnrollmentDate: enrollmentDate,
        Photo: photo || null,
        StudentStatus: 'Active'
      }]);
      // ------------------------

      // Insert selected subjects
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        const insertSubject = db.prepare('INSERT INTO StudentSubjects (StudentID, SubjectID) VALUES (?, ?)');
        const insertMany = db.transaction((subs) => {
          for (const sub of subs) {
            insertSubject.run(studentId, sub);
          }
        });
        insertMany(subjects);
        
        // Also insert subjects to InsForge
        const subjectInserts = subjects.map(sub => ({
          StudentID: studentId,
          SubjectID: sub
        }));
        await insforge.database.from('StudentSubjects').insert(subjectInserts);
      }

      // Automatically create a parent account
      if (parentWhatsApp) {
        const cleanMobile = parentWhatsApp.replace(/\D/g, '');
        if (cleanMobile.length >= 6) {
          const defaultPassword = cleanMobile.slice(-6);
          try {
            const insertParent = db.prepare('INSERT INTO Parents (ParentName, MobileNumber, Password, StudentID, Status) VALUES (?, ?, ?, ?, ?)');
            insertParent.run(parentName || 'Parent', cleanMobile, defaultPassword, studentId, 'Active');
            
            // Sync to InsForge Parents Table
            await insforge.database.from('Parents').insert([{
              ParentName: parentName || 'Parent',
              MobileNumber: cleanMobile,
              Password: defaultPassword,
              StudentID: studentId,
              Status: 'Active'
            }]);
          } catch (parentErr) {
            console.error('Failed to create parent account automatically:', parentErr);
          }
        }
      }

      res.status(201).json({ success: true, studentId, rollNumber });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  app.put('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const { name, classId, parentName, parentWhatsApp, subjects, studentStatus, rollNumber, photo } = req.body;
    
    if (!name || !classId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      if (rollNumber) {
        const updateStudent = db.prepare(`
          UPDATE Students 
          SET Name = ?, ClassID = ?, ParentName = ?, ParentWhatsAppNumber = ?, StudentStatus = ?, RollNumber = ?
          WHERE StudentID = ?
        `);
        updateStudent.run(name, classId, parentName, parentWhatsApp, studentStatus || 'Active', rollNumber, id);
      } else {
        const updateStudent = db.prepare(`
          UPDATE Students 
          SET Name = ?, ClassID = ?, ParentName = ?, ParentWhatsAppNumber = ?, StudentStatus = ?
          WHERE StudentID = ?
        `);
        updateStudent.run(name, classId, parentName, parentWhatsApp, studentStatus || 'Active', id);
      }

      if (photo !== undefined) {
        const updatePhoto = db.prepare(`
          UPDATE Students
          SET Photo = ?
          WHERE StudentID = ?
        `);
        updatePhoto.run(photo, id);
      }

      // Update subjects
      if (subjects && Array.isArray(subjects)) {
        db.prepare('DELETE FROM StudentSubjects WHERE StudentID = ?').run(id);
        
        if (subjects.length > 0) {
          const insertSubject = db.prepare('INSERT INTO StudentSubjects (StudentID, SubjectID) VALUES (?, ?)');
          const insertMany = db.transaction((subs) => {
            for (const sub of subs) {
              insertSubject.run(id, sub);
            }
          });
          insertMany(subjects);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ error: 'Failed to update student' });
    }
  });

  app.get('/api/classes', (req, res) => {
    const classes = db.prepare(`SELECT * FROM Classes`).all();
    res.json(classes);
  });

  app.get('/api/subjects', (req, res) => {
    const subjects = db.prepare(`
      SELECT s.*, c.ClassName 
      FROM Subjects s
      JOIN Classes c ON s.ClassID = c.ClassID
    `).all();
    res.json(subjects);
  });

  app.get('/api/attendance/students', (req, res) => {
    const { subjectId, date } = req.query;
    if (!subjectId || !date) return res.status(400).json({ error: 'Missing parameters' });

    const students = db.prepare(`
      SELECT st.StudentID, st.Name, a.Status
      FROM Students st
      JOIN StudentSubjects ss ON st.StudentID = ss.StudentID
      LEFT JOIN Attendance a ON st.StudentID = a.StudentID AND a.SubjectID = ? AND a.Date = ?
      WHERE ss.SubjectID = ? AND (st.StudentStatus = 'Active' OR st.StudentStatus IS NULL)
    `).all(subjectId, date, subjectId);
    
    res.json(students);
  });

  app.post('/api/attendance', (req, res) => {
    const { date, subjectId, attendanceData } = req.body;
    // attendanceData is an array of { studentId, status }
    
    // SQLite doesn't have ON CONFLICT without UNIQUE constraint, let's just delete and insert
    const deleteExisting = db.prepare('DELETE FROM Attendance WHERE Date = ? AND SubjectID = ? AND StudentID = ?');
    const insert = db.prepare('INSERT INTO Attendance (Date, StudentID, SubjectID, Status) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction((data) => {
      for (const record of data) {
        deleteExisting.run(date, subjectId, record.studentId);
        insert.run(date, record.studentId, subjectId, record.status);
      }
    });

    try {
      transaction(attendanceData);
      res.json({ success: true });
    } catch (err) {
      console.error('Error saving attendance:', err);
      res.status(500).json({ error: 'Failed to save attendance' });
    }
  });

  app.get('/api/tests/students', (req, res) => {
    const { subjectId, date } = req.query;
    if (!subjectId || !date) return res.status(400).json({ error: 'Missing parameters' });

    const students = db.prepare(`
      SELECT st.StudentID, st.Name, t.MarksObtained, t.TotalMarks, t.IsAbsent, t.Chapter
      FROM Students st
      JOIN StudentSubjects ss ON st.StudentID = ss.StudentID
      LEFT JOIN Tests t ON st.StudentID = t.StudentID AND t.SubjectID = ? AND t.Date = ?
      WHERE ss.SubjectID = ? AND (st.StudentStatus = 'Active' OR st.StudentStatus IS NULL)
    `).all(subjectId, date, subjectId);
    
    res.json(students);
  });

  app.post('/api/tests', (req, res) => {
    const { date, subjectId, globalTotalMarks, chapter, testData } = req.body;
    // testData is an array of { studentId, marksObtained, isAbsent }
    
    const deleteExisting = db.prepare('DELETE FROM Tests WHERE Date = ? AND SubjectID = ? AND StudentID = ?');
    const insert = db.prepare('INSERT INTO Tests (Date, StudentID, SubjectID, MarksObtained, TotalMarks, IsAbsent, Chapter) VALUES (?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction((data) => {
      for (const record of data) {
        deleteExisting.run(date, subjectId, record.studentId);
        if (record.isAbsent || (record.marksObtained !== null && record.marksObtained !== '')) {
           insert.run(date, record.studentId, subjectId, record.isAbsent ? 0 : record.marksObtained, globalTotalMarks || 100, record.isAbsent ? 1 : 0, chapter || null);
        }
      }
    });

    try {
      transaction(testData);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save test marks' });
    }
  });

  app.get('/api/reports/student/:id', (req, res) => {
    const studentId = req.params.id;
    
    const attendance = db.prepare(`
      SELECT s.SubjectName, 
             COUNT(a.AttendanceID) as TotalClasses,
             SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) as PresentClasses
      FROM StudentSubjects ss
      JOIN Subjects s ON ss.SubjectID = s.SubjectID
      LEFT JOIN Attendance a ON ss.SubjectID = a.SubjectID AND ss.StudentID = a.StudentID
      WHERE ss.StudentID = ?
      GROUP BY s.SubjectID
    `).all(studentId);

    const tests = db.prepare(`
      SELECT s.SubjectName, AVG(t.MarksObtained * 100.0 / t.TotalMarks) as AveragePercentage
      FROM StudentSubjects ss
      JOIN Subjects s ON ss.SubjectID = s.SubjectID
      LEFT JOIN Tests t ON ss.SubjectID = t.SubjectID AND ss.StudentID = t.StudentID
      WHERE ss.StudentID = ?
      GROUP BY s.SubjectID
    `).all(studentId);

    const recentTests = db.prepare(`
      SELECT t.Date, s.SubjectName, t.MarksObtained, t.TotalMarks, t.IsAbsent, t.Chapter
      FROM Tests t
      JOIN Subjects s ON t.SubjectID = s.SubjectID
      WHERE t.StudentID = ?
      ORDER BY t.Date DESC
      LIMIT 5
    `).all(studentId);

    const recentAttendance = db.prepare(`
      SELECT a.Date, s.SubjectName, a.Status
      FROM Attendance a
      JOIN Subjects s ON a.SubjectID = s.SubjectID
      WHERE a.StudentID = ?
      ORDER BY a.Date DESC
      LIMIT 5
    `).all(studentId);

    const allAttendance = db.prepare(`
      SELECT a.Date, s.SubjectName, a.Status
      FROM Attendance a
      JOIN Subjects s ON a.SubjectID = s.SubjectID
      WHERE a.StudentID = ?
      ORDER BY a.Date DESC
    `).all(studentId);

    res.json({ attendance, tests, recentTests, recentAttendance, allAttendance });
  });

  app.get('/api/reports/class-attendance', (req, res) => {
    const { academicYear, classId, subjectId, date } = req.query;
    if (!academicYear || !classId || !subjectId || !date) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const report = db.prepare(`
      SELECT st.Name, a.Status
      FROM Students st
      JOIN StudentSubjects ss ON st.StudentID = ss.StudentID
      LEFT JOIN Attendance a ON st.StudentID = a.StudentID AND a.SubjectID = ? AND a.Date = ?
      WHERE st.AcademicYear = ? AND st.ClassID = ? AND ss.SubjectID = ? AND (st.StudentStatus = 'Active' OR st.StudentStatus IS NULL)
      ORDER BY st.Name ASC
    `).all(subjectId, date, academicYear, classId, subjectId);

    res.json(report);
  });

  app.get('/api/reports/class-tests', (req, res) => {
    const { academicYear, classId, subjectId, date } = req.query;
    if (!academicYear || !classId || !subjectId || !date) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const report = db.prepare(`
      SELECT st.Name, t.MarksObtained, t.TotalMarks, t.IsAbsent, t.Chapter
      FROM Students st
      JOIN StudentSubjects ss ON st.StudentID = ss.StudentID
      LEFT JOIN Tests t ON st.StudentID = t.StudentID AND t.SubjectID = ? AND t.Date = ?
      WHERE st.AcademicYear = ? AND st.ClassID = ? AND ss.SubjectID = ? AND (st.StudentStatus = 'Active' OR st.StudentStatus IS NULL)
      ORDER BY t.MarksObtained DESC, st.Name ASC
    `).all(subjectId, date, academicYear, classId, subjectId);

    res.json(report);
  });

  // Settings Endpoints
  app.get('/api/academic-years', (req, res) => {
    res.json(db.prepare('SELECT * FROM AcademicYears ORDER BY AcademicYear DESC').all());
  });

  app.post('/api/academic-years', (req, res) => {
    const { academicYear, status } = req.body;
    const id = `AY${Date.now()}`;
    if (status === 'Active') {
      db.prepare('UPDATE AcademicYears SET Status = \'Inactive\'').run();
    }
    db.prepare('INSERT INTO AcademicYears (AcademicYearID, AcademicYear, Status) VALUES (?, ?, ?)').run(id, academicYear, status || 'Inactive');
    res.json({ success: true });
  });

  app.put('/api/academic-years/:id', (req, res) => {
    const { academicYear, status } = req.body;
    if (status === 'Active') {
      db.prepare('UPDATE AcademicYears SET Status = \'Inactive\'').run();
    }
    db.prepare('UPDATE AcademicYears SET AcademicYear = ?, Status = ? WHERE AcademicYearID = ?').run(academicYear, status, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/classes', (req, res) => {
    const { className, status } = req.body;
    const id = `C${Date.now()}`;
    db.prepare('INSERT INTO Classes (ClassID, ClassName, Status) VALUES (?, ?, ?)').run(id, className, status || 'Active');
    res.json({ success: true });
  });

  app.put('/api/classes/:id', (req, res) => {
    const { className, status } = req.body;
    db.prepare('UPDATE Classes SET ClassName = ?, Status = ? WHERE ClassID = ?').run(className, status, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/subjects', (req, res) => {
    const { classId, subjectName, status } = req.body;
    const id = `S${Date.now()}`;
    db.prepare('INSERT INTO Subjects (SubjectID, ClassID, SubjectName, Status) VALUES (?, ?, ?, ?)').run(id, classId, subjectName, status || 'Active');
    res.json({ success: true });
  });

  app.put('/api/subjects/:id', (req, res) => {
    const { classId, subjectName, status } = req.body;
    db.prepare('UPDATE Subjects SET ClassID = ?, SubjectName = ?, Status = ? WHERE SubjectID = ?').run(classId, subjectName, status, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/schedules', (req, res) => {
    const schedules = db.prepare(`
      SELECT sch.*, c.ClassName, s.SubjectName
      FROM SubjectSchedule sch
      JOIN Classes c ON sch.ClassID = c.ClassID
      JOIN Subjects s ON sch.SubjectID = s.SubjectID
      ORDER BY 
        CASE sch.DayOfWeek
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END, sch.Time
    `).all();
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const { classId, subjectId, dayOfWeek, time } = req.body;
    db.prepare('INSERT INTO SubjectSchedule (ClassID, SubjectID, DayOfWeek, Time) VALUES (?, ?, ?, ?)').run(classId, subjectId, dayOfWeek, time);
    res.json({ success: true });
  });

  app.put('/api/schedules/:id', (req, res) => {
    const { classId, subjectId, dayOfWeek, time } = req.body;
    db.prepare('UPDATE SubjectSchedule SET ClassID = ?, SubjectID = ?, DayOfWeek = ?, Time = ? WHERE ScheduleID = ?').run(classId, subjectId, dayOfWeek, time, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/schedules/:id', (req, res) => {
    db.prepare('DELETE FROM SubjectSchedule WHERE ScheduleID = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/institute', (req, res) => {
    const details = db.prepare('SELECT * FROM InstituteDetails LIMIT 1').get();
    res.json(details || {});
  });

  app.put('/api/institute', (req, res) => {
    const { instituteName, instituteAddress, contactNumber, whatsAppGroupLink } = req.body;
    const count = db.prepare('SELECT COUNT(*) as count FROM InstituteDetails').get() as { count: number };
    if (count.count === 0) {
      db.prepare('INSERT INTO InstituteDetails (InstituteName, InstituteAddress, ContactNumber, WhatsAppGroupLink) VALUES (?, ?, ?, ?)').run(instituteName, instituteAddress, contactNumber, whatsAppGroupLink);
    } else {
      db.prepare('UPDATE InstituteDetails SET InstituteName = ?, InstituteAddress = ?, ContactNumber = ?, WhatsAppGroupLink = ?').run(instituteName, instituteAddress, contactNumber, whatsAppGroupLink);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
