import fs from 'fs';
import path from 'path';

const OWNER_NUMBER = '2349122222622'; // your number here

export default {
  name: "masterpiece",
  description: "List all commands (owner only)",
  async execute(msg, { sock, args }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];

    if (senderNumber !== OWNER_NUMBER) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'This command is for the owner only.' }, { quoted: msg });
      return;
    }

    // Load all commands dynamically
    const commandsPath = path.join(process.cwd(), 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const ownerCmds = [];
    const modCmds = [];
    const publicCmds = [];

    for (const file of commandFiles) {
      try {
        const command = await import(path.join(commandsPath, file));
        const cmd = command.default;

        if (cmd.ownerOnly) ownerCmds.push(`$${cmd.name} - ${cmd.description || ''}`);
        else if (cmd.onlyMod) modCmds.push(`$${cmd.name} - ${cmd.description || ''}`);
        else publicCmds.push(`$${cmd.name} - ${cmd.description || ''}`);
      } catch (e) {
        // ignore import errors
      }
    }

    // Manual commands
    const manualOwnerCommands = [
      '$on - Turn bot ON',
      '$off - Turn bot OFF',
      '$addmod <number> - Add moderator',
      '$rmmod <number> - Remove moderator',
      '$masterpiece - Show this command list (owner only)',
    ];

    const manualModCommands = [
      '$welcome on/off - Toggle welcome messages (group only)',
    ];

    const text = 
`OWNER COMMANDS:
${manualOwnerCommands.concat(ownerCmds).join('\n')}

MODERATOR COMMANDS:
${manualModCommands.concat(modCmds).join('\n')}

PUBLIC COMMANDS:
${publicCmds.join('\n')}`;

    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },
};
