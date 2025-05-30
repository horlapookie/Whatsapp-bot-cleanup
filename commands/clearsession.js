import fs from 'fs';

export default {
  name: 'clearsession',
  description: 'Delete session folder and logout (owner only)',
  async execute(msg, { sock, isOwner }) {
    const from = msg.key.remoteJid;
    if (!isOwner) {
      return sock.sendMessage(from, { text: 'Permission denied.' });
    }

    try {
      if (fs.existsSync('Success')) {
        fs.rmSync('Success', { recursive: true, force: true });
        await sock.sendMessage(from, { text: 'Session folder deleted. Bot will logout now.' });
        process.exit(0);
      } else {
        await sock.sendMessage(from, { text: 'No session folder found.' });
      }
    } catch (err) {
      await sock.sendMessage(from, { text: `Failed to delete session folder: ${err.message}` });
    }
  }
};
