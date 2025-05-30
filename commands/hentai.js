import axios from "axios";
import { load } from "cheerio";

async function getRandomHentaiPageUrl() {
  const baseUrl = "https://nhentai.net";
  const randomId = Math.floor(Math.random() * 40000) + 1;
  return `${baseUrl}/g/${randomId}/`;
}

async function scrapeHentaiImage(url) {
  const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ = cheerio.load(res.data);
  const img = $("#cover > img").attr("data-src") || $("#cover > img").attr("src");
  if (!img) throw new Error("No image found on page");
  const imageUrl = img.startsWith("http") ? img : `https:${img}`;
  return imageUrl;
}

async function getValidHentai() {
  let tries = 0;
  while (tries < 5) {
    try {
      const url = await getRandomHentaiPageUrl();
      const img = await scrapeHentaiImage(url);
      return { url, img };
    } catch {
      tries++;
    }
  }
  throw new Error("Could not fetch a valid hentai after multiple tries.");
}

export default {
  name: "hentai",
  description: "Send a random hentai image (no API key used)",
  async execute(msg, { sock }) {
    try {
      const { url, img } = await getValidHentai();
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: img },
        caption: `Random hentai from nhentai.net\nLink: ${url}`,
      });
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Failed to fetch hentai image: ${error.message}`,
      });
    }
  },
};
