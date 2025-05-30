import axios from "axios";

export default {
  name: "screenshot",
  description: "Sends the profile picture of the sender or quoted user.",
  async execute(msg, { sock }) {
    try {
      const jid = msg.key.remoteJid;
      let targetJid = jid;

      if (jid.endsWith("@g.us")) {
        targetJid = msg.message?.extendedTextMessage?.contextInfo?.participant || msg.key.participant;
      }

      console.log("Target JID:", targetJid);

      const url = await sock.profilePictureUrl(targetJid, "image").catch(() => null);

      console.log("Profile Picture URL:", url);

      if (!url) {
        return await sock.sendMessage(jid, { text: "⚠️ No profile picture found." }, { quoted: msg });
      }

      let response;
      try {
        response = await axios.get(url, { responseType: "arraybuffer" });
      } catch (axiosError) {
        console.error("Axios fetch error:", axiosError);
        return await sock.sendMessage(jid, { text: "⚠️ Failed to fetch profile picture." }, { quoted: msg });
      }

      const buffer = Buffer.from(response.data);

      await sock.sendMessage(jid, {
        image: buffer,
        caption: "📸 Profile picture fetched successfully!",
      }, { quoted: msg });

    } catch (err) {
      console.error("General error:", err);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${err.message}` }, { quoted: msg });
    }
  },
};
