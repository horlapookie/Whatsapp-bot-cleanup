export default {
  name: 'modhelp',
  description: 'Show list of moderator commands (owner & mods only), or get details about a specific mod command',
  onlyMod: true,
  async execute(msg, { sock, args, moderators, isOwner }) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    if (!isOwner && !moderators.includes(senderNumber)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ You do not have permission to use this command.'
      }, { quoted: msg });
      return;
    }

    const commandsInfo = {
      ban: '🚫 $ban @user <reason> - Ban a user with a reason',
      unban: '✅ $unban @user - Remove ban from a user',
      banlist: '📜 $banlist - List all banned users',
      viewonce: '🔓 $viewonce (reply) - Bypass view-once media',
      addmod: '➕ $addmod @user - Add a moderator',
      rmmod: '➖ $rmmod @user - Remove a moderator',
      userinfo: 'ℹ️ $userinfo (reply/tag) - Get user info',
      on: '⚙️ $on <command> - Enable a disabled command (owner only)',
      off: '⛔ $off <command> - Disable a command (owner only)',
      modhelp: '🛠️ $modhelp - Show this help message',
    };

    if (args.length > 0) {
      const cmd = args[0].toLowerCase();
      if (commandsInfo[cmd]) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `🛡️ *Mod Command Info*\n\n${commandsInfo[cmd]}`,
          mentions: [senderJid]
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Unknown mod command: ${args[0]}\nType $modhelp to see all mod commands.`,
          mentions: [senderJid]
        }, { quoted: msg });
      }
      return;
    }

    const modCommandsList = Object.values(commandsInfo).join('\n');

    const helpMessage = `🛡️ *Moderator Commands*\n\n${modCommandsList}\n\n*Only owner and moderators can use these.*`;

    await sock.sendMessage(msg.key.remoteJid, {
      text: helpMessage,
      mentions: [senderJid]
    }, { quoted: msg });
  }
};
