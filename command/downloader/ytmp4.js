// command/downloader/ytmp4.js

import downloader from '../../lib/downloader.js';

export default {
    name: 'ytmp4',
    aliases: [],
    category: 'downloader',
    description: 'Download video from YouTube',

    async execute(ctx) {
        const { sock, chat, args, text } = ctx;
        let url = text || args.join(' ') || '';

        // Parse arguments
        let directFormat = null;
        let directResolusi = null;
        let urlFound = false;

        for (const arg of args) {
            const lower = arg.toLowerCase().replace(/^\./, '');
            if (['doc', 'dokumen', 'document', 'file'].includes(lower)) {
                directFormat = 'doc';
            }
            if (['video', 'vid', 'film'].includes(lower)) {
                directFormat = 'video';
            }
            if (['144', '144p', '240', '240p', '360', '360p', '480', '480p', '720', '720p', '1080', '1080p'].includes(lower)) {
                directResolusi = lower.replace('p', '');
            }
            if (arg.startsWith('http://') || arg.startsWith('https://')) {
                url = arg;
                urlFound = true;
            }
        }

        if (!urlFound) {
            url = text || '';
        }

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
                '`.ytmp4 <url> [video/doc] [resolusi]`\n\n' +
                'Contoh:\n' +
                '`.ytmp4 https://youtu.be/xxx video 720`'
            );
        }

        await ctx.react('⏳');

        try {
            const resolusi = directResolusi || '360';
            const result = await downloader.ytmp4(url, resolusi);
            
            if (!result) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            const formatType = directFormat || 'video';

            if (formatType === 'doc') {
                await sock.sendMessage(chat, {
                    document: { url: result.download },
                    fileName: `${result.title}.mp4`,
                    mimetype: 'video/mp4',
                    caption: `🎬 *${result.title}*\n⏱️ ${result.duration}\n📊 ${result.quality}`
                });
            } else {
                await sock.sendMessage(chat, {
                    video: { url: result.download },
                    caption: `🎬 *${result.title}*\n⏱️ ${result.duration}\n📊 ${result.quality}`
                });
            }

            await ctx.react('✅');
            return `✅ Selesai! (${result.quality})`;
        } catch (error) {
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};