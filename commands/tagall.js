export default {
  name: "tagall",
  description: "Tags all group members by role. Usage: $tagall [owner|admins|members|hidden] <msg>",
  async execute(msg, { sock, args, isGroup, sender }) {
    const from = msg.key.remoteJid;

    if (!isGroup) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups." });
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata?.participants || [];

      const admins = participants.filter(p => p.admin !== null).map(p => p.id);
      const realOwner = metadata.owner || null;
      const members = participants
        .filter(p => p.id !== realOwner && !admins.includes(p.id))
        .map(p => p.id);

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText = quoted?.conversation ||
                         quoted?.extendedTextMessage?.text ||
                         quoted?.imageMessage?.caption ||
                         quoted?.videoMessage?.caption;

      const ownerEmojis = ["👑", "🎩", "⭐"];
      const adminEmojis = ["🛡️", "⚔️", "🔰", "🦸‍♂️"];
      const memberEmojis = ["🙋", "🙂", "🤗", "👤", "🧑"];
      const randomEmoji = arr => arr[Math.floor(Math.random() * arr.length)];

      const roleArg = args[0]?.toLowerCase();

      // Handle hidden tag
      if (roleArg === "hidden") {
        const announcement = args.slice(1).join(" ").trim() || quotedText;
        if (!announcement) {
          return await sock.sendMessage(from, {
            text: "❌ Usage:\n$tagall hidden <message>\nOr reply to a message and type $tagall hidden",
          });
        }

        const mentionAll = [...new Set(participants.map(p => p.id))];
        if (!mentionAll.includes(sender)) mentionAll.push(sender);

        return await sock.sendMessage(from, {
          text: `📢 *${announcement}*\n\n_Tagged by: @${sender.split("@")[0]}_`,
          mentions: mentionAll,
        });
      }

      if (roleArg && !["owner", "admins", "members"].includes(roleArg)) {
        return await sock.sendMessage(from, {
          text: "❌ Invalid role. Use one of: owner, admins, members, hidden.",
        });
      }

      const sections = [];
      const mentions = [];

      if (!roleArg || roleArg === "owner") {
        if (realOwner) {
          const emoji = randomEmoji(ownerEmojis);
          const tag = `@${realOwner.split("@")[0]}`;
          sections.push(`${emoji} *Owner:*\n${emoji} ${tag}`);
          mentions.push(realOwner);
        }
      }

      if (!roleArg || roleArg === "admins") {
        if (admins.length > 0) {
          const tagged = admins.map(id => `${randomEmoji(adminEmojis)} @${id.split("@")[0]}`);
          sections.push(`🛡️ *Admins:*\n${tagged.join("\n")}`);
          mentions.push(...admins);
        }
      }

      if (!roleArg || roleArg === "members") {
        if (members.length > 0) {
          const tagged = members.map(id => `${randomEmoji(memberEmojis)} @${id.split("@")[0]}`);
          sections.push(`🙋 *Members:*\n${tagged.join("\n")}`);
          mentions.push(...members);
        }
      }

      if (sections.length === 0) {
        return await sock.sendMessage(from, { text: "❌ No members found or invalid role specified." });
      }

      const finalText = `*👥 Group Tag (${roleArg || "all"})*\n\n${sections.join("\n\n")}`;
      await sock.sendMessage(from, {
        text: finalText,
        mentions,
      });

    } catch (err) {
      console.error("❌ tagall error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to tag members. Error occurred." });
    }
  },
};
