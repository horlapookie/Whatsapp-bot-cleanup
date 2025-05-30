import fs from 'fs';
import path from 'path';

const badJIDs = [
  '2349029070127',
  '2348130032727',
  '2349122222622',
  // add more JIDs as needed (without @s.whatsapp.net)
];

const sessionsDir = './Success'; // Adjust if your sessions folder is elsewhere

function cleanSessions() {
  const files = fs.readdirSync(sessionsDir);

  let deletedCount = 0;
  for (const file of files) {
    for (const jid of badJIDs) {
      if (file.includes(jid)) {
        const fullPath = path.join(sessionsDir, file);
        fs.unlinkSync(fullPath);
        console.log(`Deleted session file: ${fullPath}`);
        deletedCount++;
      }
    }
  }

  if (deletedCount === 0) {
    console.log('No matching session files found to delete.');
  } else {
    console.log(`Deleted ${deletedCount} session file(s).`);
  }
}

cleanSessions();
