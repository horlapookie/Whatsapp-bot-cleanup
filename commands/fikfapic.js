export default {
  name: "fikfapic",
  description: "Get adult images from FikFap using a search term",
  async execute(msg, { sock, args, isMod, from, sender }) {
    if (!args.length) {
      return sock.sendMessage(from, { text: 'Usage: $fikfapic <search term>' });
    }

    const query = args.join(" ");
    const apiUrl = `https://api.lolhuman.xyz/api/fikfap/search?apikey=GataDios&query=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(apiUrl);
      const json = await res.json();

      if (!json.result || json.result.length === 0) {
        return sock.sendMessage(from, { text: 'No results found.' });
      }

      // Filter image-only results (no videos)
      const images = json.result.filter(item => item.url_image && !item.url_video).slice(0, 5);

      if (images.length === 0) {
        return sock.sendMessage(from, { text: 'No images found for that search.' });
      }

      for (const item of images) {
        await sock.sendMessage(from, {
          image: { url: item.url_image },
          caption: `Title: ${item.title}\nAuthor: ${item.author}`,
        });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { text: 'Failed to fetch FikFap images.' });
    }
  },
};
