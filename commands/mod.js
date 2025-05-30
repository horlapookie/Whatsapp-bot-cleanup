export default {
  name: 'mods',
  description: 'Show all moderators with bio, link, and online status',
  async execute(msg, { sock, moderators }) {
    const remoteJid = msg.key.remoteJid;

    if (moderators.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ No moderators have been added yet.'
      }, { quoted: msg });
    }

    let text = '🛡️ *Moderators List*\n\n';

    for (const mod of moderators) {
      const jid = `${mod}@s.whatsapp.net`;

      // Fetch online status
      let status = '⚪ *Offline*';
      try {
        const presence = sock.presences?.[jid];
        if (presence?.lastKnownPresence === 'available' || presence?.presence === 'online') {
          status = '🟢 *Online*';
        }
      } catch {}

      // Fetch bio or name
      let about = '';
      try {
        const profile = await sock.fetchStatus(jid);
        if (profile?.status) about = profile.status;
      } catch {}

      text += `*• +${mod}*\n`;
      text += `${status}\n`;
      if (about) text += `📝 _${about}_\n`;
      text += `🔗 https://wa.me/${mod}\n\n`;
    }

    await sock.sendMessage(remoteJid, {
      text: text.trim()
    }, { quoted: msg });
  }
};
