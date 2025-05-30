import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

export default {
  name: 'xget',
  description: 'Download video from Xvideos link',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a valid Xvideos link.\n\nExample: $xget https://www.xvideos.com/video.ohkpvcf24f6/title-here'
        }, { quoted: msg });
      }

      const link = args[0];

      if (!/^https:\/\/(www\.)?xvideos\.com\/video\.?\w+/i.test(link)) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Invalid Xvideos link format.'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ Fetching video page, please wait...'
      }, { quoted: msg });

      const res = await fetch(link);
      if (!res.ok) throw new Error('Failed to fetch video page.');

      const html = await res.text();
      const $ = cheerio.load(html);

      let videoUrl = $('video > source').attr('src') || $('#html5video_base source').attr('src');

      // Fallback: search .mp4 URLs inside <script> tags
      if (!videoUrl) {
        const scripts = $('script').toArray().map(el => $(el).html()).filter(Boolean);
        for (const script of scripts) {
          const matches = script.match(/https?:\/\/[^"']+\.mp4/gi);
          if (matches && matches.length > 0) {
            videoUrl = matches[0];
            break;
          }
        }
      }

      if (!videoUrl) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Failed to extract video URL.'
        }, { quoted: msg });
      }

      const title = $('h2.page-title').text().trim() || 'xvideos_download';

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ Downloading video, please wait...'
      }, { quoted: msg });

      const fileRes = await fetch(videoUrl);
      if (!fileRes.ok) throw new Error('Failed to download video file.');

      const buffer = await fileRes.buffer();

      const cleanTitle = title.replace(/[^\w\s]/gi, '').slice(0, 30);
      const filename = path.join(tmpdir(), `${cleanTitle}.mp4`);

      await writeFile(filename, buffer);

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: filename },
        caption: `🔞 *${title}*\nDownloaded from: ${link}`
      }, { quoted: msg });

    } catch (err) {
      console.error('[xget] Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to download the video.'
      }, { quoted: msg });
    }
  }
};
