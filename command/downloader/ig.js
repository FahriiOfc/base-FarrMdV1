// command/downloader/ig.js
// Download Instagram

import instagramDownloader from '../../scraper/ig.js';

export default {
    name: 'ig',
    aliases: ['igdl'],
    category: 'downloader',
    description: 'Download Instagram',

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
            url = urlMatch[0];
        }

        if (!url || !url.includes('instagram.com')) {
            return (
                '❌ Masukkan URL Instagram!\n\n' +
                '📌 Contoh: .igdl https://www.instagram.com/p/xxx'
            );
        }

        await ctx.react('⏳');

        try {
            const result = await instagramDownloader(url);
            
            if (!result?.media || result.media.length === 0) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            await ctx.react('✅');

            for (const media of result.media) {
                if (media.type === 'video') {
                    await sock.sendMessage(chat, {
                        video: { url: media.url },
                        caption: `📸 ${result.username || 'Instagram'}`
                    });
                } else {
                    await sock.sendMessage(chat, {
                        image: { url: media.url },
                        caption: `📸 ${result.username || 'Instagram'}`
                    });
                }
            }

            return;
        } catch (error) {
            console.error('[IGDL] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};