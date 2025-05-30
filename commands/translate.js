import axios from "axios";

export default {
  name: "translate",
  description: "Translate text to a specified language. Usage: $translate [language] [text]",
  async execute(msg, { sock, args }) {
    const jid = msg.key.remoteJid;

    if (args.length < 2) {
      await sock.sendMessage(jid, { text: "❌ Usage: $translate [language] [text to translate]" }, { quoted: msg });
      return;
    }

    const targetLanguage = args.shift();
    const textToTranslate = args.join(" ");
    const prompt = `Translate the following text to ${targetLanguage}:\n\n${textToTranslate}`;

    try {
      const res = await axios.get(`https://gptx-api.vercel.app/?q=${encodeURIComponent(prompt)}`);
      const translated = res.data?.response || "❌ Could not get a translation.";

      await sock.sendMessage(jid, { text: `🌐 Translation (${targetLanguage}):\n\n${translated}` }, { quoted: msg });
    } catch (err) {
      console.error("Translate error:", err);
      await sock.sendMessage(jid, { text: "❌ An error occurred while translating." }, { quoted: msg });
    }
  },
};
