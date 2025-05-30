const commandInfos = { hangman: `🎮 Hangman Game

🔹 $hangman start : Start a new game 🔹 Guess letters by typing single alphabets 🔹 $hangman data : Check your wins and losses ⚠️ Limited guesses before you're hanged!`,

ban: `🚫 Ban Command

🔹 $ban @user or reply to ban them 🔹 Only bot owner or admins can use this 🔒 Banned users can't use bot commands`,

unban: `✅ Unban Command

🔹 $unban @user or reply to unban them 🔹 Only bot owner or admins can use this`,

help: `📜 Help Command

🔹 $help : Lists all available commands 🔹 $info <command> : Get info about a command`,

kick: `👢 Kick Command

🔹 $kick @user or reply to remove from group 🔹 Admins or bot owner only`,

anounce: `📢 Announce Command

🔹 $anounce <msg> : Tag all with your announcement 🔹 Admins and bot owner only`,

tagall: `👥 Tagall Command

🔹 $tagall : Tags all group members`,

uptime: `⏱️ Uptime Command

🔹 $uptime : Shows how long the bot has been running`,

warn: `⚠️ Warn Command

🔹 $warn @user or reply to warn 🔹 3 warnings may result in ban`,

warnlist: `📋 Warnlist Command

🔹 $warnlist : Shows all warned users`,

banlist: `📵 Banlist Command

🔹 $banlist : Shows all banned users`,

insult: `😈 Insult Command

🔹 $insult @user : Sends a humorous insult`,

lyrics: `🎵 Lyrics Command

🔹 $lyrics <artist> <song> : Fetches lyrics from Genius`,

profile: `👤 Profile Command

🔹 $profile : View your profile saved in bot`,

joke: `😂 Joke Command

🔹 $joke : Sends a random joke`,

promote: `⭐ Promote Command

🔹 $promote @user : Promote user to admin`,

demote: `🔻 Demote Command

🔹 $demote @user : Demote an admin`,

translate: `🌐 Translate Command

🔹 $translate <lang_code> <text> : Translate to specified language`,

xvideos: `📹 Xvideos Command

🔹 $xvideos <query> : Search and download videos 🔹 Choose quality before downloading`,

sticker: `🎨 Sticker Command

🔹 $sticker : Turn image/video into sticker`,

viewonce: `👁️ View Once Command

🔹 $viewonce : View once media as normal`,

ask: `❓ Ask Command

🔹 $ask <question> : Ask AI-powered question`,

answer: `📝 Answer Command

🔹 $answer <text> : Answer active trivia`,

myscore: `🏅 My Score Command

🔹 $myscore : Shows your trivia stats`,

trivia: `🧠 Trivia Command

🔹 $trivia : Starts a trivia game`,

ping: `🏓 Ping Command

🔹 $ping : Bot response test`,

time: `⏰ Time Command

🔹 $time : Shows current server time`,

welcome: `👋 Welcome Command

🔹 $welcome on/off : Toggle welcome messages`,

lock: `🔒 Lock Command

🔹 $lock : Lock group for non-admins`,

unlock: `🔓 Unlock Command

🔹 $unlock : Unlock group for everyone`,

roll: `🎲 Roll Command

🔹 $roll : Random dice roll`,

screenshot: `📸 Screenshot Command

🔹 $screenshot <url> : Capture website screenshot`,

quote: `💬 Quote Command

🔹 $quote : Sends an inspirational quote`,

delete: `🗑️ Delete Command

🔹 $delete : Delete replied message (bot only)` ,

log: `📑 Log Command

🔹 $log : Shows recent logs`,

yt: `📺 YouTube Command

🔹 $yt <url or search> : Download video/audio from YouTube`,

reactionhelp: `😄 Reaction Help Command

🔹 $reactionhelp : Lists all available reaction keywords with emojis`,

reactions: `🤖 Reactions Toggle Command

🔹 $reactions : Enables or disables automatic group reactions`,

setusername: `✏️ Set Username Command

🔹 $setusername <name> : Sets your display name in the bot`,

userinfo: `ℹ️ User Info Command

🔹 $userinfo : Shows your info like username, ID, warnings`,

echo: `🔁 Echo Command

🔹 $echo <text> : Bot repeats what you say`,

fap: `🔞 Fap Command

🔹 $fap : Sends NSFW content (if enabled)` ,

porno: `🔞 Porno Command

🔹 $porno : Fetch short random TikPornTok video (under 5 mins)`,

pinterest: `📌 Pinterest Command

🔹 $pinterest <query> : Fetch random images from Pinterest`,

tiktok: `🎵 TikTok Command

🔹 $tik audio|video <name or link> : Download TikTok video or audio`,

tik: `🎵 Tik Command (Alias)

🔹 $tik audio|video <name or link> : Download TikTok content`,

xget: `📥 Xget Command

🔹 $xget <link> [quality] : Download Xvideos video 🔹 If no quality provided, options will be shown`,

quoteanime: `✨ Anime Quote Command

🔹 $quoteanime : Sends a random anime quote`,

mod: `🛡️ Moderator List

🔹 $mod : Show current mods`,

addmod: `➕ Add Moderator

🔹 $addmod @user : Grant mod access`,

rmmod: `➖ Remove Moderator

🔹 $rmmod @user : Remove mod access`,

ib: `✨ About Bot Command

🔹 $ib : Shows the bot origin and creator info`,

modhelp: `🛠️ Moderator Help

🔹 $modhelp : Show all mod-only commands`,

masterpiece: `🖼️ Masterpiece Command

🔹 $masterpiece <prompt> : Generate artwork from text`,

wallpaper: `🖼️ Wallpaper Command

🔹 $wallpaper <query> : Get a random wallpaper` };

export default { name: 'info', description: 'Show detailed info about a command', async execute(msg, { sock, args }) { if (!args.length) { await sock.sendMessage(msg.key.remoteJid, { text: '❓ Please provide a command name. Example: $info ban' }, { quoted: msg }); return; }

const cmdName = args[0].toLowerCase();

if (!commandInfos[cmdName]) {
  await sock.sendMessage(
    msg.key.remoteJid,
    {
      text: `❌ No info found for command "${cmdName}". Use $help to see all commands.`,
    },
    { quoted: msg }
  );
  return;
}

await sock.sendMessage(
  msg.key.remoteJid,
  { text: commandInfos[cmdName] },
  { quoted: msg }
);

}, };

