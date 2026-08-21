// command/downloader/ytmp3.js

import downloader from '../../lib/downloader.js';

export default {
    name: 'ytmp3',
    aliases: [],
    category: 'downloader',
    description: 'Download audio from YouTube',

    async execute(ctx) {
        const { sock, chat } = ctx;
        let url = ctx.text || ctx.args.join(' ') || '';

        // Try to get URL from quoted message
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
                '`.ytmp3 <url>`\n\n' +
                'Contoh:\n' +
                '`.ytmp3 https://youtu.be/xxx`'
            );
        }

        await ctx.react('⏳');

        try {
            const result = await downloader.ytmp3(url);
            
            if (!result) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            await sock.sendMessage(chat, {
                audio: result.buffer || { url: result.download },
                mimetype: 'audio/mpeg',
                fileName: `${result.title}.mp3`
            });

            await ctx.react('✅');
            return `✅ *${result.title}*\n⏱️ ${result.duration}`;
        } catch (error) {
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};