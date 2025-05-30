import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default {
  name: 'xvideos-search',
  description: 'Search Xvideos content',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: '❌ Please provide a search query.\n\nExample: $xvideos-search lana rhoades',
          },
          { quoted: msg }
        );
      }

      const query = args.join(' ');
      const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;

      const res = await fetch(searchUrl);
      if (!res.ok) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: '❌ Failed to fetch results from Xvideos.' },
          { quoted: msg }
        );
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const results = [];

      const thumbBlocks = $('.mozaique .thumb-block').slice(0, 10);
      let count = 1;

      for (let i = 0; i < thumbBlocks.length; i++) {
        const el = thumbBlocks[i];
        const aTag = $(el).find('p.title a');
        const href = aTag.attr('href');
        const title = aTag.text().trim();
        const duration = $(el).find('.duration').text().trim();
        const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

        if (!href || !title || !thumb) continue;

        const fullUrl = `https://www.xvideos.com${href}`;

        // Extract ID
        const idMatch = href.match(/(?:video(\d+)|video\.([a-z0-9]+))\//i);
        const videoId = idMatch ? (idMatch[1] || idMatch[2]) : 'Unknown';

        const text = `#${count} 🔖 ID: ${videoId} 🏮 Thumbnail: ${thumb} ⏳ Duration: ${duration} 🔗 URL: ${fullUrl}`;
        results.push(text);
        count++;
      }

      if (results.length === 0) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: '❌ No results found.' },
          { quoted: msg }
        );
      }

      const message = `🔍 *Search Results for:* _${query}_\n\n${results.join('\n\n')}`;
      await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
    } catch (err) {
      console.error('[xvideos-search] Error:', err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ An error occurred while searching.' },
        { quoted: msg }
      );
    }
  },
};
