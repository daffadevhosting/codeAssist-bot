require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const http = require('http'); // 1. Impor modul http bawaan Node.js

// === BAGIAN BARU UNTUK MEMBUAT SERVER WEB MINI ===
// Ini penting agar Railways tidak mematikan bot
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server mini berjalan di port ${PORT} untuk health check.`);
});
// ===============================================

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

  // Log untuk debugging
  console.log(`[Pesan Diterima] dari ${message.author.tag}: "${message.content}"`);

  // Ubah !generate menjadi /generate atau prefix lain jika Anda mau
  if (!message.content.startsWith('!generate')) return;

  console.log("✅ Perintah '!generate' terdeteksi.");

  let thinkingMessage;
  try {
    thinkingMessage = await message.reply('🤖 Menganalisis permintaan Anda...');
    console.log("✅ Pesan 'Menganalisis' berhasil dikirim.");
    
    const userPrompt = message.content.slice('!generate'.length).trim();
    const response = await axios.post(API_URL, {
      messages: [{ role: 'user', content: userPrompt }],
      template: 'react',
      model: 'gemini-1.5-flash',
      apiKey: GEMINI_API_KEY
    });

    console.log("✅ Respons dari Vercel diterima.");

    const { code, reasoning } = response.data;

    if (code) {
      const fullResponse = `\`\`\`jsx\n${code}\n\`\`\`\n**Reasoning:**\n${reasoning}`;
      if (fullResponse.length > 2000) {
        await thinkingMessage.edit('Kode yang dihasilkan terlalu panjang untuk ditampilkan di Discord.');
      } else {
        await thinkingMessage.edit(fullResponse);
      }
    } else {
      await thinkingMessage.edit('⚠️ Maaf, gagal membuat kode.');
    }

  } catch (error) {
    console.error("❌ TERJADI ERROR:", error.message);
    if (error.response) {
      console.error("-> Data Error dari Server:", error.response.data);
    }
    
    if (thinkingMessage) {
        await thinkingMessage.edit('❌ Terjadi kesalahan fatal. Silakan cek log server.');
    } else {
        await message.reply('❌ Terjadi kesalahan fatal sebelum bisa merespons.');
    }
  }
});

// Start bot
client.login(DISCORD_TOKEN);
