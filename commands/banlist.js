import fs from 'fs';
import path from 'path';

const OWNER_NUMBER = '9122222622'; // Replace with your WhatsApp number

export default {
  name: 'banlist',
  description: 'View all banned numbers',
  onlyMod: true,
  async execute(msg, { sock }) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    if (senderNumber !== OWNER_NUMBER) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Only the bot owner can use this command.'
      }, { quoted: msg });
      return;
    }

    const bannedPath = path.join(process.cwd(), 'banned.json');
    let banned = fs.existsSync(bannedPath) ? JSON.parse(fs.readFileSync(bannedPath)) : {};

    const users = Object.entries(banned);

    if (users.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '✅ No users are currently banned.'
      }, { quoted: msg });
      return;
    }

    const list = users.map(([num, info], i) => {
      const reason = info?.reason || 'No reason';
      const by = info?.by || 'Unknown';
      const time = info?.time ? new Date(info.time).toLocaleString() : 'Unknown time';
      return `${i + 1}. wa.me/${num}\n   ┗ Reason: ${reason}\n   ┗ By: @${by}\n   ┗ At: ${time}`;
    }).join('\n\n');

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🚫 *Banned Users List:*\n\n${list}`,
      mentions: users.map(([_, info]) => `${info.by}@s.whatsapp.net`).filter(Boolean)
    }, { quoted: msg });
  }
};
