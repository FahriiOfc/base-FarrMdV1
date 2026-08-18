// command/downloader/ig.js

import downloader from '../../lib/downloader.js';

export default {
    name: 'ig',
    aliases: ['instagram'],
    category: 'downloader',
    description: 'Download Instagram content',

    async execute(ctx) {
        const { sock, chat } = ctx;
        let url = ctx.text || ctx.args.join(' ') || '';

        if (!url && ctx.quoted?.text) {
            url = ctx.quoted.text;
        }

        if (url) {
            const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
            if (urlMatch) {
                url = urlMatch[0];
            }
        }

        if (!url) {
            return (
                '❌ Masukkan URL!\n\n' +
                '📥 *Cara penggunaan:*\n' +
                '`.ig <url>` atau `.instagram <url>`\n\n' +
                'Contoh:\n' +
                '`.ig https://www.instagram.com/p/xxx`'
            );
        }

        await ctx.react('⏳');

        try {
            const result = await downloader.instagram(url);
            
            if (!result) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            if (result.type === 'video') {
                await sock.sendMessage(chat, {
                    video: { url: result.media },
                    caption: `📸 ${result.caption || 'Instagram'}`
                });
            } else {
                await sock.sendMessage(chat, {
                    image: { url: result.media },
                    caption: `📸 ${result.caption || 'Instagram'}`
                });
            }

            await ctx.react('✅');
            return '✅ Selesai!';
        } catch (error) {
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};