export default {
  name: 'help',
  description: '📜 Show all available commands, grouped by category.',
  async execute(msg, { sock }) {
    const helpMessage = `
*🤖 BOT COMMAND MENU*

Type \`$info <command>\` to get more info on any command.

━━━━━━━━━━━━━━━━━━━
*🛠️ Basic Tools*
• \`$ping\` - Check if bot is alive
• \`$uptime\` - Bot running time
• \`$botinfo\` - Bot details
• \`$userinfo\` - Your profile info
• \`$profile\`, \`$setusername\` - Edit/view username
• \`$echo\` - Repeat your message
• \`$log\` - View bot logs
• \`$time\` - Current time

━━━━━━━━━━━━━━━━━━━
*🔐 Admin/Moderation*
• \`$ban\`, \`$unban\`, \`$banlist\`
• \`$kick\`, \`$promote\`, \`$demote\`
• \`$lock\` - Lock group
• \`$warn\`, \`$delete\`, \`$viewonce\`
• \`$addmod\`, \`$rmmod\`, \`$mod\`, \`$modhelp\`

━━━━━━━━━━━━━━━━━━━
*👥 Group Management*
• \`$welcome\` - Welcome toggle
• \`$tagall\` - Mention everyone visibly
• \`$tagallhidden <message>\` - Mention everyone without showing numbers (Admin/Mod only)
  Usage: Reply to a message or type your message after the command.
• \`$anounce\` - Group announcement

━━━━━━━━━━━━━━━━━━━
*🎮 Games & Fun*
• \`$hangman\`, \`$trivia\`, \`$myscore\`
• \`$ask\`, \`$answer\`
• \`$roll\`, \`$reactionhelp\`, \`$reactions\`
• \`$joke\`, \`$insult\`

━━━━━━━━━━━━━━━━━━━
*🎨 Creativity*
• \`$sticker\`, \`$wallpaper\`, \`$screenshot\`
• \`$masterpiece\` - AI art
• \`$quote\`, \`$quoteanime\`

━━━━━━━━━━━━━━━━━━━
*🎵 Music & Media*
• \`$lyrics\` - Song lyrics
• \`$yt\` - YouTube downloader
• \`$tiktok\`, \`$tik\` - TikTok video/audio
• \`$xvideos\`, \`$xget\`, \`$porno\`, \`$fap\`, \`$hentai\`

━━━━━━━━━━━━━━━━━━━
*🔎 Tools & Info*
• \`$translate\`, \`$wikipedia\`
• \`$pinterest\`, \`$igstalk\`

━━━━━━━━━━━━━━━━━━━
*🎬 Latest Movies & Anime*
• \`$latest\`, \`$lts\` - List available latest movie categories
  Usage: \`$latest\` to show categories; \`$latest <actor/actress>\` to search movies by name.

━━━━━━━━━━━━━━━━━━━
*🌤️ Weather & Calculator*
• \`$whether <location>\` or reply to message - Get weather info (extended)
• \`$calc <expression>\` or reply to message - Calculate math expressions (supports advanced math)

━━━━━━━━━━━━━━━━━━━
*⚙️ Utilities & Features*
• \`$enable <feature>\` - Enable togglable features (owner/mod only)
• \`$info <command>\` - Get details of a command
• \`$help\` - Show this menu

━━━━━━━━━━━━━━━━━━━

_Need help with a specific command?_
Type \`$info command-name\` (e.g. \`$info yt\`)

    `.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: helpMessage });
  }
};
