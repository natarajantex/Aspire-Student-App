import Database from 'better-sqlite3';

const db = new Database('aspire.db');
const parents = db.prepare('SELECT * FROM Parents').all();
console.log(parents);
