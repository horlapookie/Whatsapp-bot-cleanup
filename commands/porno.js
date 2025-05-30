import axios from "axios";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cheerio = require("cheerio");

export default {
  name: "porno",
  description: "Get NSFW videos from fap.bar. Use $porno or $porno [query]",
  async execute(msg, { sock, args }) {
    const site = "https://fap.bar";
    const search = args.join(" ");
    const url = search ? `${site}/search/${encodeURIComponent(search)}` : site;

    try {
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const $ = cheerio.load(res.data);
      const videoLinks = [];

      $("a.thumb").each((i, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("/video/")) {
          videoLinks.push(`${site}${href}`);
        }
      });

      if (videoLinks.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "No results found.",
        });
      }

      // Pick a random video page
      const videoPage = videoLinks[Math.floor(Math.random() * videoLinks.length)];
      const videoRes = await axios.get(videoPage, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const $$ = cheerio.load(videoRes.data);
      const videoUrl = $$("video source").attr("src");

      if (!videoUrl) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "Failed to fetch video URL.",
        });
      }

      const filename = path.join(tmpdir(), `porno_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(filename);
      const videoStream = await axios.get(videoUrl, { responseType: "stream" });

      videoStream.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await sock.sendMessage(msg.key.remoteJid, {
        video: fs.readFileSync(filename),
        caption: `NSFW from fap.bar\n\n${search ? `Search: ${search}` : "Random video"}`,
      });

      fs.unlinkSync(filename); // delete temp file
    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Error fetching video: ${err.message}`,
      });
    }
  },
};
