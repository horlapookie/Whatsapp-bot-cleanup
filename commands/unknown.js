export default {
  name: 'unknown',
  description: 'Handles unknown or empty commands',
  async execute(msg, { sock, command, PREFIX }) {
    const remoteJid = msg.key.remoteJid;
    const displayCmd = command && command.trim() !== '' ? command : '(no command given)';
    await sock.sendMessage(remoteJid, {
      text: `❓ Unknown command: *${displayCmd}*\n\nUse *${PREFIX}help* to see the list of available commands.\nMake sure commands start with *${PREFIX}* prefix.`,
    }, { quoted: msg });
  }
};
