import {
  getUserData,
  startDuel,
  getDuelByUser,
  attack,
  defend,
  forfeitDuel,
  saveAll,
  getLeaderboard,
} from "../duelData.js";

export default {
  name: "duel",
  description: "PvP duel system with elemental moves, animations, forfeit, leaderboard",
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant
      ? msg.key.participant.split("@")[0]
      : msg.key.remoteJid.split("@")[0];

    // Helper to send a reply message
    async function send(text, mentions = []) {
      await sock.sendMessage(
        from,
        { text, mentions },
        { quoted: msg }
      );
    }

    const sub = args[0]?.toLowerCase();

    // Get mentioned user from tag or quoted message
    let mentionedUser = null;
    if (
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0
    ) {
      mentionedUser =
        msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const ctx = msg.message.extendedTextMessage.contextInfo;
      if (ctx.participant) mentionedUser = ctx.participant.split("@")[0];
    }

    // Ensure user data exists
    getUserData(sender);

    // Help message if no argument or "help"
    if (!sub || sub === "help") {
      return send(
        `Duel Commands:
$duel @user - Challenge someone
$duel accept - Accept a duel challenge
$duel reject - Reject a duel challenge
$duel moves - Show your available moves
$duel attack <move> - Attack with a move
$duel defend <move> - Defend with a move
$duel forfeit - Forfeit the duel
$duel leaderboard - Show top duel winners`
      );
    }

    // Challenge someone
    if (
      sub === "challenge" ||
      (!["accept", "reject", "moves", "attack", "defend", "forfeit", "leaderboard"].includes(
        sub
      ) &&
        mentionedUser)
    ) {
      if (!mentionedUser) return send("Please tag or reply to someone to challenge.");
      if (mentionedUser === sender) return send("You can't challenge yourself.");
      if (getDuelByUser(sender)) return send("You already have an active duel.");
      if (getDuelByUser(mentionedUser)) return send("That user is already in a duel.");

      // Start duel (status pending)
      const duelId = startDuel(sender, mentionedUser);
      if (!duelId) return send("Failed to start duel. Try again.");

      return send(
        `Duel challenge sent to @${mentionedUser}. They can accept with $duel accept or reject with $duel reject.`,
        [{ tag: mentionedUser }]
      );
    }

    // Accept duel
    if (sub === "accept") {
      // Find duel where this user is challenged and pending
      const duelEntry = Object.values(getDuelByUser(sender) || {}).find(
        (d) => d.status === "pending" && d.opponent === sender
      );
      if (!duelEntry) return send("You have no pending duel challenges.");

      duelEntry.status = "active";
      duelEntry.turn = duelEntry.challengerId;
      saveAll();

      return send(
        `Duel accepted! @${duelEntry.challengerId} starts first. Use $duel attack <move> or $duel defend <move>.`,
        [{ tag: duelEntry.challengerId }, { tag: sender }]
      );
    }

    // Reject duel
    if (sub === "reject") {
      const duelEntry = Object.values(getDuelByUser(sender) || {}).find(
        (d) => d.status === "pending" && d.opponent === sender
      );
      if (!duelEntry) return send("You have no pending duel challenges.");

      // assuming duels is accessible or you have a deleteDuel function
      // If not, you should provide a function to delete duel by ID:
      // e.g. deleteDuel(duelEntry.id)
      // Here I will assume you have deleteDuel:
      if (typeof deleteDuel === "function") {
        deleteDuel(duelEntry.id);
      } else {
        // If no deleteDuel function, maybe export duels from duelData.js and delete directly
        // or just skip this part if you can't access duels here
      }
      saveAll();

      return send("Duel challenge rejected.");
    }

    // Show moves
    if (sub === "moves") {
      const user = getUserData(sender);
      const moveList = user.moves.map((m) => `${m.name} (${m.type})`).join("\n");
      return send(`Your moves:\n${moveList}`);
    }

    // Attack command
    if (sub === "attack") {
      const moveName = args.slice(1).join(" ");
      if (!moveName) return send("Specify the move name to attack.");

      const result = attack(sender, moveName);
      if (result.error) return send(result.error);

      const { move, damage, hp1, hp2, attacker, defender, winner } = result;

      let response = `*${attacker}* used *${move.name}* and dealt *${damage}* damage!\n`;
      response += `HP - You: ${attacker === sender ? hp1 : hp2}, Opponent: ${
        attacker === sender ? hp2 : hp1
      }\n`;

      if (winner) {
        response += `🎉 *${attacker} wins the duel!* 🎉`;
        // End duel
        if (typeof endDuel === "function") endDuel(attacker);
      } else {
        response += `It's now *${defender}*'s turn.`;
      }
      return send(response, [{ tag: defender }]);
    }

    // Defend command
    if (sub === "defend") {
      const moveName = args.slice(1).join(" ");
      if (!moveName) return send("Specify the move name to defend.");

      const result = defend(sender, moveName);
      if (result.error) return send(result.error);

      const { move, defense, hp1, hp2, attacker, defender } = result;

      let response = `*${attacker}* used *${move.name}* and healed *${defense}* HP!\n`;
      response += `HP - You: ${attacker === sender ? hp1 : hp2}, Opponent: ${
        attacker === sender ? hp2 : hp1
      }\n`;
      response += `It's now *${defender}*'s turn.`;

      return send(response, [{ tag: defender }]);
    }

    // Forfeit command
    if (sub === "forfeit") {
      const winnerId = forfeitDuel(sender);
      if (!winnerId) return send("You are not currently in a duel.");

      await send(`You forfeited the duel. <@${winnerId}> wins!`, [{ tag: winnerId }]);
      return;
    }

    // Leaderboard
    if (sub === "leaderboard") {
      const leaderboard = getLeaderboard();
      const top = Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, wins], i) => `${i + 1}. @${userId} - ${wins} wins`)
        .join("\n");

      return send(`🏆 Duel Leaderboard 🏆\n${top}`, Object.keys(leaderboard).map((u) => ({ tag: u })));
    }

    return send("Unknown subcommand. Use $duel help for command list.");
  },
};
