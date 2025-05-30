// utils/loverData.js
import fs from 'fs';
const dbPath = './loverSessions.json';

function loadDB() {
if (!fs.existsSync(dbPath)) return {};
return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function getUserLoverData(id) {
const db = loadDB();
return db[id];
}

export function updateUserLoverData(id, data) {
const db = loadDB();
db[id] = { ...(db[id] || {}), ...data };
saveDB(db);
}

export function deleteUserLoverData(id) {
const db = loadDB();
delete db[id];
saveDB(db);
}

