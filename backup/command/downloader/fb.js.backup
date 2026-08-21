// command/downloader/fb.js

import downloader from '../../lib/downloader.js';

export default {
    name: 'fb',
    aliases: ['facebook'],
    category: 'downloader',
    description: 'Download Facebook video',

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
                '`.fb <url>` atau `.facebook <url>`\n\n' +
                'Contoh:\n' +
                '`.fb https://www.facebook.com/xxx`'
            );
        }

        await ctx.react('⏳');

        try {
            const result = await downloader.facebook(url);
            
            if (!result) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            await sock.sendMessage(chat, {
                video: { url: result.video },
                caption: `📹 ${result.title || 'Facebook Video'}`
            });

            await ctx.react('✅');
            return '✅ Selesai!';
        } catch (error) {
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};