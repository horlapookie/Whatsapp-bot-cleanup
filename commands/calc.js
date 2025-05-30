import { create, all } from 'mathjs';

const math = create(all);

// Limit potentially dangerous functions to prevent misuse
math.import({
  import: () => { throw new Error('Function import is disabled'); },
  createUnit: () => { throw new Error('Function createUnit is disabled'); },
  evaluate: () => { throw new Error('Function evaluate is disabled'); },
  parse: () => { throw new Error('Function parse is disabled'); },
  simplify: () => { throw new Error('Function simplify is disabled'); },
  derivative: () => { throw new Error('Function derivative is disabled'); }
}, { override: true });

export default {
  name: 'calc',
  description: 'Calculate math expressions. Use by typing "$calc expression" or reply to a message with an expression.',
  async execute(msg, { sock, args }) {
    try {
      const chatId = msg.key.remoteJid;

      // Get expression from args or from replied message
      let expr = args.join(' ').trim();
      if (!expr && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo?.quotedMessage) {
        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        if (quotedMsg.conversation) expr = quotedMsg.conversation.trim();
        else if (quotedMsg.extendedTextMessage) expr = quotedMsg.extendedTextMessage.text.trim();
      }

      if (!expr) {
        await sock.sendMessage(chatId, { text: '❗ Please provide a math expression by typing "$calc expression" or reply to a message containing an expression.' }, { quoted: msg });
        return;
      }

      // Evaluate expression safely
      let result;
      try {
        result = math.evaluate(expr);
      } catch (evalErr) {
        await sock.sendMessage(chatId, { text: `❌ Invalid expression:\n${evalErr.message}` }, { quoted: msg });
        return;
      }

      await sock.sendMessage(chatId, { text: `🧮 Expression:\n${expr}\n\n✅ Result:\n${result}` }, { quoted: msg });
    } catch (err) {
      console.error('Error in calc command:', err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to evaluate expression. Please try again later.' }, { quoted: msg });
    }
  },
};
