import Database from 'better-sqlite3';

const db = new Database('e:\\tuition\\app\\Aspire App 2\\aspire.db');
db.prepare("DELETE FROM Students WHERE Name = 'Test Student'").run();
console.log("Deleted test student");
