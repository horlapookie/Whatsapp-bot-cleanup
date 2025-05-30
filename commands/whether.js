import fetch from 'node-fetch';

const OPENWEATHER_API_KEY = '2f5aa12f88c6626956c806d8d3ce08c1';

export default {
  name: 'weather',
  description: 'Get current weather and short forecast for a location. Use by typing "$weather location" or reply to a message with location.',
  async execute(msg, { sock, args }) {
    try {
      // Get chat ID and sender
      const chatId = msg.key.remoteJid;

      // Determine location: from args or replied message
      let location = args.join(' ').trim();
      if (!location && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo?.quotedMessage) {
        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        if (quotedMsg.conversation) location = quotedMsg.conversation.trim();
        else if (quotedMsg.extendedTextMessage) location = quotedMsg.extendedTextMessage.text.trim();
      }

      if (!location) {
        await sock.sendMessage(chatId, { text: '❗ Please provide a location by typing "$weather location" or reply to a message containing the location.' }, { quoted: msg });
        return;
      }

      // Call OpenWeather API
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        await sock.sendMessage(chatId, { text: `❌ Could not find weather for "${location}". Please check the location name and try again.` }, { quoted: msg });
        return;
      }

      const data = await res.json();

      // Build weather report message
      const weather = data.weather[0];
      const main = data.main;
      const wind = data.wind;
      const sys = data.sys;
      const country = sys.country;

      const weatherMsg = `
🌍 Weather for *${data.name}, ${country}*:

🌡️ Temperature: ${main.temp} °C (Feels like ${main.feels_like} °C)
🌥️ Condition: ${weather.main} - ${weather.description}
💧 Humidity: ${main.humidity}%
🌬️ Wind Speed: ${wind.speed} m/s
🕒 Sunrise: ${new Date(sys.sunrise * 1000).toLocaleTimeString()}
🌇 Sunset: ${new Date(sys.sunset * 1000).toLocaleTimeString()}
      `.trim();

      await sock.sendMessage(chatId, { text: weatherMsg }, { quoted: msg });
    } catch (err) {
      console.error('Error in weather command:', err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch weather data. Please try again later.' }, { quoted: msg });
    }
  },
};
