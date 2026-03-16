import Database from 'better-sqlite3';
const db = new Database('aspire.db');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Tests'").get();
console.log(schema);
