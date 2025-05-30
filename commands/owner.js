export default {
  name: 'owner',
  description: 'Shows the owner contact(s)',
  async execute(msg, { sock }) {
    const ownerContacts = [
      'https://wa.me/2349122222622', // format with international code and wa.me link
      'https://wa.me/2347049044897'
    ];

    const text = `Bot Owner(s):\n${ownerContacts.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

    await sock.sendMessage(msg.key.remoteJid, { text });
  }
};
