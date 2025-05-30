export default {
  name: "disable",
  description: "Disable a bot feature (owner/mod only)",
  async execute(msg, { sock, args, isOwner, isMod, featureToggles, saveFeatureToggles }) {
    const from = msg.key.remoteJid;
    if (!isOwner && !isMod) {
      return await sock.sendMessage(from, { text: "❌ You are not allowed to use this command." }, { quoted: msg });
    }

    if (args.length === 0) {
      return await sock.sendMessage(from, {
        text: `❌ Please specify a feature to disable.\nAvailable features:\n${Object.keys(featureToggles).join("\n")}`,
      }, { quoted: msg });
    }

    const feature = args[0].toLowerCase();
    if (!(feature in featureToggles)) {
      return await sock.sendMessage(from, {
        text: `❌ Feature "${feature}" not found.\nAvailable features:\n${Object.keys(featureToggles).join("\n")}`,
      }, { quoted: msg });
    }

    featureToggles[feature] = false;
    saveFeatureToggles();
    await sock.sendMessage(from, { text: `✅ Feature "${feature}" has been disabled.` }, { quoted: msg });
  },
};
