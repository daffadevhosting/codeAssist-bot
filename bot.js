require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');

const API_URL = `${process.env.API_URL}/api/generate`;
const GEMINI_API_KEY = process.env.BOT_API_KEY_SERVER;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Inisialisasi client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Saat bot siap
client.once(Events.ClientReady, c => {
  console.log(`✅ Bot online sebagai ${c.user.tag}`);
});

// Event: Pesan baru
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!generate')) return;

  const userPrompt = message.content.slice('!generate'.length).trim();
  const thinkingMessage = await message.reply('🤖 Menganalisis permintaan Anda...');

  try {
    const response = await axios.post(API_URL, {
      prompt: userPrompt,
      template: 'react',
      model: 'gemini-1.5-flash',
      apiKey: GEMINI_API_KEY
    });

    const { code, reasoning } = response.data;

    if (code) {
      await thinkingMessage.edit(`\`\`\`jsx\n${code}\n\`\`\`\n**Reasoning:**\n${reasoning}`);
    } else {
      await thinkingMessage.edit('⚠️ Maaf, gagal membuat kode.');
    }

  } catch (error) {
    console.error(error);
    await thinkingMessage.edit('❌ Terjadi kesalahan saat menghubungi AI.');
  }
});

// Start bot
client.login(DISCORD_TOKEN);

