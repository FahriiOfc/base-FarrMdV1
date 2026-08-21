// command/main/menu.js

import config from '../../config.js';
import settings from '../../lib/settings.js';

function getTimeGreeting() {
    const hour = Number(
        new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            hour12: false
        }).format(new Date())
    );
    if (hour >= 4 && hour < 11) return { emoji: '🌅', text: 'Selamat pagi' };
    if (hour >= 11 && hour < 15) return { emoji: '☀️', text: 'Selamat siang' };
    if (hour >= 15 && hour < 18) return { emoji: '🌇', text: 'Selamat sore' };
    return { emoji: '🌙', text: 'Selamat malam' };
}

function formatDate() {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date());
}

function formatTime() {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date());
}

function formatRuntime(seconds) {
    seconds = Math.floor(Number(seconds) || 0);
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    const result = [];
    if (days) result.push(`${days}d`);
    if (hours) result.push(`${hours}h`);
    if (minutes) result.push(`${minutes}m`);
    result.push(`${seconds}s`);
    return result.join(', ');
}

export default {
    name: 'menu',
    aliases: ['help', '?'],
    category: 'main',
    description: 'Show main menu',

    async execute(ctx) {
        const { sock, chat, sender, pushName, isGroup } = ctx;
        const greeting = getTimeGreeting();
        const modeText = settings.getValue('mode') === 'self' ? '🔐 Self Mode' : '🌐 Public Mode';

        await ctx.react('⏳');

        const headerText = 
            `${greeting.emoji} *${greeting.text}, ${pushName || 'User'}!*\n\n` +
            `👤 User : ${pushName || 'User'}\n` +
            `🤖 Mode : ${modeText}\n` +
            `📅 ${formatDate()}\n` +
            `⏰ ${formatTime()} WIB\n` +
            `⏱️ ${formatRuntime(process.uptime())}`;

        // ============================================================
        // INTERACTIVE BUTTON LIST - SUPPORT GRUP & PRIVATE
        // ============================================================

        try {
            // Gunakan interactiveMessage dengan buttons
            const interactiveMessage = {
                text: `${headerText}\n\n📋 *Pilih Menu di Bawah:*`,
                footer: '📱 FarrMdV1 - Klik tombol di bawah',
                title: '🤖 FARRMD V1 MENU',
                buttonText: '📋 Pilih Menu',
                sections: [
                    {
                        title: '📖 Silahkan Pilih Menu',
                        rows: [
                            {
                                title: '📋 Menu Utama',
                                rowId: '.mainmenu',
                                description: 'Command utama bot'
                            },
                            {
                                title: '📋 Semua Menu',
                                rowId: '.allmenu',
                                description: 'Lihat semua command'
                            },
                            {
                                title: '👑 Owner Menu',
                                rowId: '.ownermenu',
                                description: 'Command khusus owner'
                            },
                            {
                                title: '📥 Downloader Menu',
                                rowId: '.downloadmenu',
                                description: 'YT, TikTok, IG, FB, GitHub'
                            },
                            {
                                title: '🖼️ Sticker Menu',
                                rowId: '.stickermenu',
                                description: 'Sticker & Converter'
                            },
                            {
                                title: '👥 Group Menu',
                                rowId: '.groupmenu',
                                description: 'Command grup'
                            },
                            {
                                title: '🛠️ Tools Menu',
                                rowId: '.toolsmenu',
                                description: 'Brat, SSWeb & lainnya'
                            }
                        ]
                    }
                ]
            };

            await sock.sendMessage(chat, interactiveMessage);
            await ctx.react('✅');
            return;

        } catch (error) {
            console.log('[MENU] Interactive error:', error.message);
            
            // ============================================================
            // FALLBACK: Text dengan numbered list
            // ============================================================
            
            const fallbackText =
                `${headerText}\n\n` +
                '╭━━━〔 📖 SILAHKAN PILIH 〕━━━╮\n' +
                '┃\n' +
                '┃ 1️⃣ .mainmenu - Main Menu\n' +
                '┃ 2️⃣ .allmenu - All Menu\n' +
                '┃ 3️⃣ .ownermenu - Owner Menu\n' +
                '┃ 4️⃣ .downloadmenu - Downloader Menu\n' +
                '┃ 5️⃣ .stickermenu - Sticker Menu\n' +
                '┃ 6️⃣ .groupmenu - Group Menu\n' +
                '┃ 7️⃣ .toolsmenu - Tools Menu\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
                '💡 Ketik salah satu command di atas';

            await ctx.reply(fallbackText);
            await ctx.react('✅');
        }
    }
};