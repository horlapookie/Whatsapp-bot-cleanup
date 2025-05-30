export default {
  name: "latest",
  description: "Show latest movies and animations",
  aliases: ["lts"],
  async execute(msg, { sock, args }) {
    const jid = msg.key.remoteJid;
    const name = args.join(" ").toLowerCase();

    if (!name) {
      const helpText = `🎬 *Available Movie Categories:*

1. *$latest donghua* – Latest Chinese animations
2. *$latest nollywood* – Top 10 new Nollywood movies
3. *$latest hollywood* – Top 10 new Hollywood movies
4. *$latest bollywood* – Top 10 new Bollywood movies
5. *$latest <actor/actress>* – Top 10 latest movies by that person

Type a category to get started. Example: *$latest hollywood*`;
      await sock.sendMessage(jid, { text: helpText }, { quoted: msg });
      return;
    }

    let movieList = [];
    const dummyMovies = (prefix) =>
      Array.from({ length: 10 }, (_, i) => `${i + 1}. ${prefix} Movie ${i + 1}`);

    if (["donghua", "dong"].includes(name)) {
      movieList = dummyMovies("Donghua");
    } else if (["nollywood", "nolly"].includes(name)) {
      movieList = dummyMovies("Nollywood");
    } else if (["hollywood", "holly"].includes(name)) {
      movieList = dummyMovies("Hollywood");
    } else if (["bollywood", "bolly"].includes(name)) {
      movieList = dummyMovies("Bollywood");
    } else {
      // Assume user entered an actor/actress name
      const actorName = name
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
      movieList = dummyMovies(`${actorName}'s`);
    }

    const text = `🎞 *Top 10 Latest Movies:*\n\n${movieList.join("\n")}`;
    await sock.sendMessage(jid, { text }, { quoted: msg });
  },
};
