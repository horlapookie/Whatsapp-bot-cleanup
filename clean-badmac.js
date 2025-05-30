import fs from 'fs/promises';
import path from 'path';

async function cleanBadMac() {
  const folder = './Success';
  const files = await fs.readdir(folder);

  for (const file of files) {
    const filePath = path.join(folder, file);
    if (!file.endsWith('.json')) continue;

    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      let modified = false;

      // Recursively clean any bad JID
      function clean(obj) {
        if (typeof obj !== 'object' || obj === null) return;

        for (const key of Object.keys(obj)) {
          if (/@s\.whatsapp\.net$/.test(key)) {
            console.log(`Found and removed: ${key}`);
            delete obj[key];
            modified = true;
          } else {
            clean(obj[key]);
          }
        }
      }

      clean(data);

      if (modified) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`Cleaned bad JIDs from ${file}`);
      }
    } catch (e) {
      console.log(`Skipping non-JSON or unreadable file: ${file}`);
    }
  }
}

console.log('Starting cleanup...');
cleanBadMac().catch(console.error);
