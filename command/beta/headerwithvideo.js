// command/beta/headerwithvideo.js
// 🧪 BETA: Header dengan Thumbnail + Video Pembuka

import config from '../../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'headerwithvideo',
    aliases: ['hwv', 'videobeta', 'vb'],
    category: 'beta',
    description: '🧪 Header dengan Thumbnail + Video Pembuka',

    async execute(ctx) {
        const { sock, chat, sender, pushName, react } = ctx;
        await react('⏳');

        const botName = config.botName || 'FarrMdV1';
        const ownerName = config.ownerName || 'Owner';
        const ownerNumber = config.ownerNumber || '6285893028915';

        // ============================================================
        // 1. DOWNLOAD VIDEO PEMBUKA (dari URL)
        // ============================================================

        // Gunakan video pendek dari internet (misal: intro bot)
        const videoUrl = 'https://example.com/intro-video.mp4'; // Ganti dengan URL video-mu

        let videoBuffer = null;
        let thumbnailBuffer = null;

        try {
            // Download video
            const response = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            videoBuffer = Buffer.from(response.data);

            // Generate thumbnail dari video (ambil frame pertama)
            // Atau pakai thumbnail static
            const thumbnailPath = path.join(process.cwd(), 'assets', 'thumbnail.jpg');
            if (fs.existsSync(thumbnailPath)) {
                thumbnailBuffer = fs.readFileSync(thumbnailPath);
            } else {
                // Fallback: buat thumbnail dari video frame pertama (pakai sharp)
                // Atau pakai gambar default
                const defaultThumbPath = path.join(process.cwd(), 'assets', 'default.jpg');
                if (fs.existsSync(defaultThumbPath)) {
                    thumbnailBuffer = fs.readFileSync(defaultThumbPath);
                }
            }
        } catch (error) {
            console.log('[HEADERWITHVIDEO] Video download error:', error.message);
            // Lanjut tanpa video
        }

        // ============================================================
        // 2. FAKE QUOTED DENGAN THUMBNAIL + VIDEO
        // ============================================================

        // Format header text
        const formattedNumber = ownerNumber.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '+$1 $2/$3-$4');
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const runtimeStr = `${hours}h ${minutes}m ${seconds}s`;
        const totalCommands = global.commandLoader?.getCommands().size || 0;

        // ============================================================
        // 3. FAKE QUOTED DENGAN VIDEO MESSAGE (UNTUK THUMBNAIL)
        // ============================================================

        let quotedMessage;

        if (videoBuffer && thumbnailBuffer) {
            // Kirim fake quoted sebagai video dengan thumbnail
            quotedMessage = {
                videoMessage: {
                    url: 'https://example.com/video.mp4', // URL dummy
                    mimetype: 'video/mp4',
                    caption: 
                        `~ ${ownerName}\n` +
                        `${formattedNumber}\n\n` +
                        `Diteruskan\n` +
                        `${botName}.me\n\n` +
                        `WhatsApp 🟢 · Status\n` +
                        `${totalCommands} item\n` +
                        `${botName}\n` +
                        `Runtime ${runtimeStr}\n\n` +
                        `HD`,
                    thumbnail: thumbnailBuffer, // 🔥 INI YANG MUNCUL DI HEADER
                    fileLength: videoBuffer.length.toString(),
                    seconds: Math.floor(videoBuffer.length / 1000) || 5
                }
            };
        } else {
            // Fallback: text only
            quotedMessage = {
                conversation: 
                    `~ ${ownerName}\n` +
                    `${formattedNumber}\n\n` +
                    `Diteruskan\n` +
                    `${botName}.me\n\n` +
                    `WhatsApp 🟢 · Status\n` +
                    `${totalCommands} item\n` +
                    `${botName}\n` +
                    `Runtime ${runtimeStr}\n\n` +
                    `HD`
            };
        }

        const fakeStanzaId = `header_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // ============================================================
        // 4. PESAN UTAMA
        // ============================================================

        const text = 
            `Konnichiwa 🌙\n\n` +
            `Hello ${pushName || 'User'}, how are you? I am *${botName}*, nice to see you again. How can I help you today? ✨\n\n` +
            `📋 *INFO USER*\n` +
            `• Nama : ${pushName || 'User'}\n` +
            `• Status : 👤 User\n` +
            `• Limit : ♾️ Unlimited\n\n` +
            `📋 *INFO SYSTEM*\n` +
            `• Nama : ${botName}\n` +
            `• Owner : ${ownerName}\n` +
            `• Versi : 1.0.0\n` +
            `• Fitur : ${totalCommands}\n\n` +
            `📋 *KETERANGAN*\n` +
            `• 👑 = Khusus Owner\n` +
            `• ⭐ = Khusus Premium\n` +
            `• 🔥 = Memakai Limit\n\n` +
            `Silahkan pilih kategori menu melalui tombol Home 📋 di bawah ini.`;

        // ============================================================
        // 5. KIRIM DENGAN FAKE QUOTED + BUTTONS
        // ============================================================

        try {
            await sock.sendMessage(chat, {
                text: text,
                contextInfo: {
                    quotedMessage: quotedMessage,
                    stanzaId: fakeStanzaId,
                    participant: sender,
                    remoteJid: chat,
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363311536505691@newsletter',
                        newsletterName: `${botName} Updates`,
                        serverMessageId: -1
                    },
                    mentionedJid: [sender]
                },
                buttons: [
                    {
                        buttonId: 'menu_home',
                        buttonText: { displayText: '📋 Home' },
                        type: 1
                    },
                    {
                        buttonId: 'menu_donasi',
                        buttonText: { displayText: '💳 Donasi' },
                        type: 1
                    },
                    {
                        buttonId: 'menu_owner',
                        buttonText: { displayText: '👑 Owner' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: `📱 ${botName} - ${new Date().toLocaleTimeString('id-ID')} WIB`
            });

            await react('✅');
            return;

        } catch (error) {
            console.error('[HEADERWITHVIDEO] Error:', error.message);
            await react('❌');
            return `❌ Gagal: ${error.message}`;
        }
    }
};