import fs from "fs";
import axios from "axios";
import { tmpdir } from "os";
import path from "path";
import Crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import webp from "node-webpmux";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

function getTempFile(ext) {
  return path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`);
}

async function imageToWebp(media) {
  const input = getTempFile("jpg");
  const output = getTempFile("webp");
  fs.writeFileSync(input, media);

  await new Promise((resolve, reject) => {
    ffmpeg(input)
      .on("end", () => resolve())
      .on("error", reject)
      .addOutputOptions([
        "-vcodec", "libwebp",
        "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
      ])
      .toFormat("webp")
      .save(output);
  });

  const buff = fs.readFileSync(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return buff;
}

async function videoToWebp(media) {
  const input = getTempFile("mp4");
  const output = getTempFile("webp");
  fs.writeFileSync(input, media);

  await new Promise((resolve, reject) => {
    ffmpeg(input)
      .on("end", () => resolve())
      .on("error", reject)
      .addOutputOptions([
        "-vcodec", "libwebp",
        "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
        "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05",
        "-preset", "default", "-an", "-vsync", "0",
      ])
      .toFormat("webp")
      .save(output);
  });

  const buff = fs.readFileSync(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return buff;
}

async function writeExif(webpBuffer, metadata = {}) {
  const input = getTempFile("webp");
  const output = getTempFile("webp");
  fs.writeFileSync(input, webpBuffer);

  const img = new webp.Image();
  await img.load(input);

  const json = {
    "sticker-pack-id": "https://github.com/DikaArdnt/Hisoka-Morou",
    "sticker-pack-name": metadata.packname || "Bot Pack",
    "sticker-pack-publisher": metadata.author || "Bot Author",
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);

  const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
  exifAttr.writeUIntLE(jsonBuff.length, 14, 4);

  const exif = Buffer.concat([exifAttr, jsonBuff]);

  img.exif = exif;
  await img.save(output);

  const finalBuff = fs.readFileSync(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return finalBuff;
}

export default {
  name: "sticker",
  description: "Convert image/video to sticker",
  async execute(msg, { sock, args }) {
    let mediaBuffer, type;

    try {
      // FIXED: get quoted message's actual media content
      const quotedContext = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (quotedContext?.imageMessage) {
        mediaBuffer = await downloadMediaMessage(quotedContext, "buffer", { logger: sock.logger, reuploadRequest: sock.reuploadRequest });
        type = "image";
      } else if (quotedContext?.videoMessage) {
        mediaBuffer = await downloadMediaMessage(quotedContext, "buffer", { logger: sock.logger, reuploadRequest: sock.reuploadRequest });
        type = "video";
      } else if (msg.message?.imageMessage) {
        mediaBuffer = await downloadMediaMessage(msg.message, "buffer", { logger: sock.logger, reuploadRequest: sock.reuploadRequest });
        type = "image";
      } else if (msg.message?.videoMessage) {
        mediaBuffer = await downloadMediaMessage(msg.message, "buffer", { logger: sock.logger, reuploadRequest: sock.reuploadRequest });
        type = "video";
      } else if (args[0]?.startsWith("http")) {
        const res = await axios.get(args[0], { responseType: "arraybuffer" });
        mediaBuffer = Buffer.from(res.data);
        type = args[0].includes(".mp4") ? "video" : "image";
      } else {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "Reply to an image/video or send a valid media URL." },
          { quoted: msg }
        );
      }

      // Parse optional metadata from args: packname|author
      const metaArg = args.find(a => a.includes("|"));
      const metadata = {};
      if (metaArg) {
        const [packname, author] = metaArg.split("|");
        metadata.packname = packname.trim();
        metadata.author = author?.trim() || "";
      }

      let webpData;
      try {
        const rawWebp = type === "image" ? await imageToWebp(mediaBuffer) : await videoToWebp(mediaBuffer);
        webpData = await writeExif(rawWebp, metadata);
      } catch (convertError) {
        console.error("Sticker conversion error:", convertError);
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "Failed to convert to sticker." },
          { quoted: msg }
        );
      }

      await sock.sendMessage(msg.key.remoteJid, { sticker: webpData }, { quoted: msg });
    } catch (error) {
      console.error("Download media error:", error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "Failed to download media. Make sure you replied to a valid image or video." },
        { quoted: msg }
      );
    }
  }
};
