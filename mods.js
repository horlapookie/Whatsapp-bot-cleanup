export default {
  name: "mods",
  description: "List all moderators of the bot.",
  async execute(msg, { sock, moderators }) {
    const remoteJid = msg.key.remoteJid;

    if (!moderators.length) {
      await sock.sendMessage(remoteJid, { text: "No moderators have been added yet." }, { quoted: msg });
      return;
    }

    const list = moderators.map((mod, i) =>
      `${i + 1}. ${mod.name} - wa.me/${mod.number}`
    ).join('\n');

    await sock.sendMessage(remoteJid, {
      text: `🛡️ *Moderators List:*\n\n${list}`
    }, { quoted: msg });
  }
};
