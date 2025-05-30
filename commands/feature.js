export default {
  name: "features",
  description: "List all toggleable features and their status",
  async execute(msg, { sock, featureToggles }) {
    const from = msg.key.remoteJid;
    const statusList = Object.entries(featureToggles)
      .map(([feature, enabled]) => `${feature}: ${enabled ? "ON" : "OFF"}`)
      .join("\n") || "No features available.";

    await sock.sendMessage(from, { text: `🔧 Feature Toggles:\n${statusList}` }, { quoted: msg });
  },
};
