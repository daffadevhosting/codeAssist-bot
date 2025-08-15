// bot.js
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
  console.log(`🚀 API URL diatur ke: ${API_URL}`); // Cek apakah URL benar
});

// Event: Pesan baru
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // --- MATA-MATA #1 ---
  // Cek apakah bot membaca semua pesan
  console.log(`[Pesan Diterima] dari ${message.author.tag}: "${message.content}"`);

  if (!message.content.startsWith('!generate')) return;

  // --- MATA-MATA #2 ---
  console.log("✅ Perintah '!generate' terdeteksi. Memulai proses...");

  let thinkingMessage; // Definisikan di luar try-catch

  try {
    thinkingMessage = await message.reply('🤖 Menganalisis permintaan Anda...');
    
    // --- MATA-MATA #3 ---
    console.log("✅ Pesan 'Menganalisis' berhasil dikirim. Menghubungi Vercel...");
    
    const userPrompt = message.content.slice('!generate'.length).trim();
    const response = await axios.post(API_URL, {
      messages: [{ role: 'user', content: userPrompt }], // Pastikan mengirim 'messages' array
      template: 'react', // Ganti sesuai kebutuhan
      model: 'gemini-1.5-flash',
      apiKey: GEMINI_API_KEY
    });
    
    // --- MATA-MATA #4 ---
    console.log("✅ Respons dari Vercel diterima:", response.data);

    const { code, reasoning } = response.data;

    if (code) {
      // Pastikan pesan tidak terlalu panjang untuk Discord (batas 2000 karakter)
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
    // --- MATA-MATA #5 (PALING PENTING) ---
    console.error("❌ TERJADI ERROR:", error.message);
    if (error.response) {
      console.error("-> Data Error dari Server:", error.response.data);
    }
    
    if (thinkingMessage) {
        await thinkingMessage.edit('❌ Terjadi kesalahan fatal. Silakan cek log server.');
    } else {
        // Jika bahkan pesan 'thinking' gagal, kirim pesan baru
        await message.reply('❌ Terjadi kesalahan fatal sebelum bisa merespons.');
    }
  }
});

// Start bot
client.login(DISCORD_TOKEN);
