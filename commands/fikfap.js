import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

export default {
  name: "fikfap",
  description: "Fetch and download trending videos from fikfap.com with progress messages",
  async execute(msg, { sock }) {
    try {
      await sock.sendMessage(msg.key.remoteJid, { text: "Fetching trending videos from FikFap..." }, { quoted: msg });

      // Fetch trending page
      const res = await axios.get("https://fikfap.com/trending");
      const $ = cheerio.load(res.data);

      // Collect post links starting with /post/
      const postLinks = [];
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("/post/")) {
          postLinks.push(`https://fikfap.com${href}`);
        }
      });

      if (postLinks.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "Sorry, no trending posts found right now.",
        }, { quoted: msg });
        return;
      }

      const limitedPosts = postLinks.slice(0, 2); // max 2 videos

      const tmpDir = path.join("./tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      for (const [idx, link] of limitedPosts.entries()) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Processing video #${idx + 1}...` }, { quoted: msg });

        try {
          const postPage = await axios.get(link);
          const $post = cheerio.load(postPage.data);

          const videoUrl = $post("video source").attr("src");
          if (!videoUrl) {
            await sock.sendMessage(msg.key.remoteJid, { text: `No video found in post #${idx + 1}. Skipping.` }, { quoted: msg });
            continue;
          }

          const ext = path.extname(videoUrl).split("?")[0] || ".mp4";
          const fileName = `fikfap_${Date.now()}_${idx}${ext}`;
          const filePath = path.join(tmpDir, fileName);

          const writer = fs.createWriteStream(filePath);
          const response = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream",
          });

          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          await sock.sendMessage(msg.key.remoteJid, {
            video: { url: filePath },
            caption: `Trending FikFap video #${idx + 1}\n${link}`,
          }, { quoted: msg });

          fs.unlinkSync(filePath);
        } catch (innerErr) {
          console.error(`Failed on post ${link}:`, innerErr.message);
          await sock.sendMessage(msg.key.remoteJid, { text: `Failed to process video #${idx + 1}.` }, { quoted: msg });
        }
      }
    } catch (error) {
      console.error("FikFap command error:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Oops! Could not fetch trending videos from FikFap at this time.",
      }, { quoted: msg });
    }
  },
};
