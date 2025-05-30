import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

async function getQualityUrls(url) {
  console.log(`[xget] Fetching page for URL: ${url}`);

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    },
  });

  const $ = cheerio.load(html);
  const scripts = $("script");
  const qualityMap = {};

  scripts.each((_, el) => {
    const content = $(el).html();
    if (content) {
      // Fix regexes to correctly extract URLs (adjust according to actual page source)
      const hd = content.match(/setVideoUrlHigh'([^']+)'/);
      if (hd) {
        qualityMap.hd = hd[1];
        console.log(`[xget] Found HD URL: ${hd[1]}`);
      }
      const high = content.match(/setVideoUrl'([^']+)'/);
      if (high) {
        qualityMap.high = high[1];
        console.log(`[xget] Found HIGH URL: ${high[1]}`);
      }
      const low = content.match(/setVideoUrlLow'([^']+)'/);
      if (low) {
        qualityMap.low = low[1];
        console.log(`[xget] Found LOW URL: ${low[1]}`);
      }
    }
  });

  // Fallback: check <video> tag src attribute
  if (Object.keys(qualityMap).length === 0) {
    const videoTagSrc = $("video").attr("src");
    if (videoTagSrc) {
      qualityMap.default = videoTagSrc;
      console.log(`[xget] Found default video URL from <video>: ${videoTagSrc}`);
    } else {
      console.log("[xget] No video URLs found on the page.");
    }
  }

  return qualityMap;
}

async function downloadVideoByUrl(sock, msg, videoUrl, qualityLabel) {
  try {
    console.log(`[xget] Starting download for quality: ${qualityLabel}, URL: ${videoUrl}`);

    const tmpDir = "/data/data/com.termux/files/usr/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const fileName = `${qualityLabel}_${path.basename(new URL(videoUrl).pathname) || "video.mp4"}`;
    const filePath = path.join(tmpDir, fileName);

    let progressMsg;
    try {
      progressMsg = await sock.sendMessage(
        msg.key.remoteJid,
        { text: `⬇️ Downloading ${qualityLabel.toUpperCase()}...\nProgress: 0%` },
        { quoted: msg }
      );
    } catch (e) {
      console.error(`[xget] Failed to send initial progress message: ${e.message}`);
    }

    const { data, headers } = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
    });

    const totalLength = parseInt(headers["content-length"], 10);
    let downloaded = 0;
    let lastPercent = 0;

    const writer = fs.createWriteStream(filePath);
    data.on("data", async (chunk) => {
      downloaded += chunk.length;
      const percent = Math.floor((downloaded / totalLength) * 100);
      if (percent >= lastPercent + 10 || percent === 100) {
        lastPercent = percent;
        console.log(`[xget] Download progress: ${percent}%`);
        try {
          if (progressMsg) {
            await sock.sendMessage(
              msg.key.remoteJid,
              { text: `⬇️ Downloading ${qualityLabel.toUpperCase()}...\nProgress: ${percent}%` },
              { quoted: progressMsg }
            );
          }
        } catch (e) {
          console.error(`[xget] Failed to update progress: ${e.message}`);
        }
      }
    });

    data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const buffer = fs.readFileSync(filePath);
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        video: buffer,
        caption: `✅ ${qualityLabel.toUpperCase()} download complete.`,
        mimetype: "video/mp4",
      },
      { quoted: msg }
    );

    fs.unlinkSync(filePath);
    console.log(`[xget] Download and send complete for ${qualityLabel}`);
  } catch (err) {
    console.error("[xget] Download error:", err);
    try {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error downloading video: ${err.message}` },
        { quoted: msg }
      );
    } catch {}
  }
}

export default {
  name: "xget",
  description: "Download Xvideos video with quality selector and logging",
  async execute(msg, { sock, args }) {
    try {
      console.log("[xget] Command started");

      if (!args.length) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              "❌ Please provide an Xvideos link.\nExample:\n$xget https://www.xvideos.com/video...",
          },
          { quoted: msg }
        );
      }

      if (args[0].includes("|")) {
        // User already selected quality and URL
        const [quality, url] = args[0].split("|");
        console.log(`[xget] User selected quality: ${quality} for URL: ${url}`);

        const qualities = await getQualityUrls(url);
        if (!qualities[quality]) {
          console.log(`[xget] Quality ${quality} not found in extracted qualities`);
          return await sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ Quality "${quality}" not found.` },
            { quoted: msg }
          );
        }
        await downloadVideoByUrl(sock, msg, qualities[quality], quality);
        return;
      }

      // First step: extract qualities and ask user to select
      const url = args[0];
      console.log(`[xget] Received download request for: ${url}`);

      const qualities = await getQualityUrls(url);
      const availableQualities = Object.keys(qualities);

      if (availableQualities.length === 0) {
        console.log("[xget] No qualities extracted, sending error message");
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Could not extract any video quality from this link." },
          { quoted: msg }
        );
      }

      if (availableQualities.length === 1) {
        console.log("[xget] Only one quality found, starting download directly");
        await downloadVideoByUrl(sock, msg, qualities[availableQualities[0]], availableQualities[0]);
        return;
      }

      // Multiple qualities — send buttons to select
      console.log(`[xget] Multiple qualities found: ${availableQualities.join(", ")}, sending buttons`);

      const buttons = availableQualities.map((q) => ({
        buttonId: `xget ${q}|${url}`, // User sends this when clicking
        buttonText: { displayText: q.toUpperCase() },
        type: 1,
      }));

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: "Select the quality you want to download:",
          buttons,
          headerType: 1,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("[xget] Command error:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Unexpected error: ${err.message}` },
        { quoted: msg }
      );
    }
  },
};
