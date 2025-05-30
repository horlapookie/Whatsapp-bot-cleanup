export default {
  name: "ping",
  description: "Replies with pong, confirms bot is alive, and shows response time.",
  async execute(msg, { sock }) {
    const start = Date.now();

    const response = await sock.sendMessage(msg.key.remoteJid, {
      text: "✅ *Bot is alive and working fine...*",
    }, { quoted: msg });

    const elapsed = Date.now() - start;

    await sock.sendMessage(msg.key.remoteJid, {
      text: `⚡ *Response time:* \`${elapsed} ms\``,
      edit: response.key,
    });
  },
};
