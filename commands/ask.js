import axios from "axios";

export default {
  name: "ask",
  description: "Ask a question and get a smart answer (no API key needed)",
  async execute(msg, { sock, args }) {
    if (!args.length)
      return sock.sendMessage(msg.key.remoteJid, {
        text: "Please ask a question.\nExample: *$ask who is the president of Nigeria?*",
      });

    const query = args.join(" ");
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;

    try {
      const res = await axios.get(url);
      const answer =
        res.data.Abstract ||
        res.data.Answer ||
        res.data.Definition ||
        "I couldn't find a good answer for that.";

      await sock.sendMessage(msg.key.remoteJid, {
        text: `*Question:* ${query}\n\n*Answer:* ${answer}`,
      });
    } catch (err) {
      console.error("ASK ERROR:", err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Failed to fetch answer. Please try again later.",
      });
    }
  },
};
