// command/downloader/fb.js
// Download Facebook

import { fbdown } from '../../scraper/fbdown.js';

export default {
    name: 'fb',
    aliases: ['fbdl'],
    category: 'downloader',
    description: 'Download Facebook',

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
            url = urlMatch[0];
        }

        if (!url || !url.includes('facebook.com') && !url.includes('fb.watch')) {
            return (
                '❌ Masukkan URL Facebook!\n\n' +
                '📌 Contoh: .fbdl https://fb.watch/xxx'
            );
        }

        await ctx.react('⏳');

        try {
            const result = await fbdown(url);
            
            if (!result?.status) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            const videoUrl = result.HD || result.Normal_video;
            if (!videoUrl) {
                await ctx.react('❌');
                return '❌ Tidak ada video ditemukan.';
            }

            await sock.sendMessage(chat, {
                video: { url: videoUrl },
                caption: `📹 ${result.title || 'Facebook Video'}`
            });

            await ctx.react('✅');
            return;
        } catch (error) {
            console.error('[FBDL] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};