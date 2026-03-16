import Database from 'better-sqlite3';

const db = new Database('aspire.db');
const users = db.prepare('SELECT * FROM Users').all();
console.log(users);
