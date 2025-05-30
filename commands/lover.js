import {
  getUserLoverData,
  updateUserLoverData,
  deleteUserLoverData,
} from "../utils/loverData.js";

const lovers = {
  demon: "😈 Dark Demon",
  nurse: "💉 Naughty Nurse",
  vampire: "🧛 Sexy Vampire",
  maid: "🧽 Dirty Maid",
  neko: "😺 Horny Neko Girl",
  boss: "👩‍💼 Hot Office Boss",
  milf: "🍑 Tempting MILF",
  succubus: "👿 Succubus Queen",
};

const actions = {
  kiss: "💋 Your lips meet in a deep, lingering kiss. Tongues dance slowly as your bodies press close, warmth spreading rapidly...",
  touch: "🤲 Hands explore softly, tracing every curve with intention. Goosebumps rise as fingers glide over bare skin...",
  undress: "👙 Clothes fall away, piece by piece, revealing trembling anticipation. Eyes locked, you slowly strip each other, teasing with every move...",
  spank: "🍑 A firm smack echoes in the room. The sting is sweet, your partner’s gasp fueling your lustful fire...",
  fuck: "🍆 Bodies collide in rhythm, every thrust rough yet intimate. Moans fill the air as you both lose control...",
  moan: "🔊 Whimpers escape between kisses, building into desperate moans. The room vibrates with rising desire...",
  climax: "💦 The moment crashes over you — hot, breathless, trembling. You both shudder as waves of ecstasy roll through your bodies...",
  romance: "🎵 A slow sensual melody plays. Your lover draws you in, whispering sweet filth into your ear while their fingers explore you delicately...",
};
export default {
  name: "lover",
  description: "Start or continue an erotic lover session (solo or with someone).",
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    const partnerMention = mentions[0] || quoted;

    const emojis = {
      kiss: "💋",
      touch: "🤲",
      undress: "👙",
      moan: "🔊",
      climax: "💦",
      spank: "🍑",
      fuck: "🍆",
      romance: "🎵",
    };

    // Global session store
    global.loverSessions = global.loverSessions || {};

    // Helper for session keys
    const pairKey = (a, b) => [a, b].sort().join("_");

    // Handle ending session (for solo or multiplayer)
    if (args[0] === "end") {
      // Find and delete all sessions involving sender
      const keys = Object.keys(global.loverSessions);
      let ended = false;
      for (const key of keys) {
        if (key.includes(sender)) {
          delete global.loverSessions[key];
          ended = true;
        }
      }
      return await sock.sendMessage(from, {
        text: ended
          ? "💔 Lover session ended."
          : "❌ No active lover session found to end.",
      });
    }

    let sessionKey;
    let data;

    // --- Start or resume session ---

    if (partnerMention) {
      // Multiplayer session
      sessionKey = pairKey(sender, partnerMention);
      data = global.loverSessions[sessionKey];

      if (!data) {
        // New multiplayer session
        const chosen = Object.keys(lovers)[Math.floor(Math.random() * Object.keys(lovers).length)];
        global.loverSessions[sessionKey] = {
          users: [sender, partnerMention],
          lover: chosen,
          stage: "kiss",
          history: [],
          mode: "pvp",
        };
        return await sock.sendMessage(from, {
          text: `💕 Erotic lover session started with @${partnerMention.split("@")[0]}!\nYour lover is *${lovers[chosen]}*\nType *$lover* to begin or use actions like: *$lover kiss @user*`,
          mentions: [partnerMention],
        });
      }
    } else if (args[0] && lovers[args[0].toLowerCase()]) {
      // Solo PVE session with chosen lover character
      sessionKey = sender; // unique key per user for solo sessions
      data = global.loverSessions[sessionKey];

      if (!data) {
        const chosen = args[0].toLowerCase();
        global.loverSessions[sessionKey] = {
          users: [sender],
          lover: chosen,
          stage: "kiss",
          history: [],
          mode: "pve",
        };
        return await sock.sendMessage(from, {
          text: `💕 Erotic solo lover session started with *${lovers[chosen]}*!\nType *$lover* to begin or use actions like: *$lover kiss*`,
        });
      }
    } else {
      // Find existing session for sender
      // First try multiplayer sessions
      for (const key in global.loverSessions) {
        if (key.includes(sender)) {
          sessionKey = key;
          data = global.loverSessions[key];
          break;
        }
      }
      // If no multiplayer session, try solo session
      if (!data) {
        data = global.loverSessions[sender];
        sessionKey = sender;
      }
    }

    if (!data) {
      return await sock.sendMessage(from, {
        text: `❌ You have no active lover session.\nStart one by mentioning a user: *$lover @user*\nOr start solo with a lover character: *$lover milf*`,
      });
    }

    // Handle action input
    const inputAction = args[0]?.toLowerCase();
    const validAction = actions[inputAction];

    if (validAction) {
      data.stage = inputAction;
      data.history.push(inputAction);

      const loverName = lovers[data.lover] || "Your Lover";

      let reply = `*${loverName}* ${validAction}`;
      if (inputAction === "romance") reply += `\n🎶 [Audio Playing: soft-moaning.mp3]`;

      return await sock.sendMessage(from, {
        text: reply,
        mentions: data.users,
      });
    }

    // Move to next default stage
    const stages = ["kiss", "touch", "undress", "moan", "climax"];
    const currentIndex = stages.indexOf(data.stage);

    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      // Session finished, delete it
      delete global.loverSessions[sessionKey];
      return await sock.sendMessage(from, {
        text: `💦 The climax ends...\n*Session over.* Type *$lover @user* or *$lover milf* to start again.`,
      });
    }

    const nextStage = stages[currentIndex + 1];
    data.stage = nextStage;
    data.history.push(nextStage);

    const loverName = lovers[data.lover] || "Your Lover";
    const defaultTexts = {
      kiss: `${loverName} leans in and kisses you slowly ${emojis.kiss}`,
      touch: `${loverName} caresses your body gently ${emojis.touch}`,
      undress: `${loverName} starts undressing, teasing you ${emojis.undress}`,
      moan: `${loverName} moans your name softly ${emojis.moan}`,
      climax: `You both reach an explosive climax together ${emojis.climax}🔥`,
    };

    await sock.sendMessage(from, {
      text: `${defaultTexts[nextStage]}\n*Type $lover* to continue or use actions.`,
      mentions: data.users,
    });
  },
};
