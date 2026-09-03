// command/downloader/ytdl.js
// Download YouTube (MP3/MP4)

import { Youtube } from '../../scraper/ytdl.js';

export default {
    name: 'ytdl',
    aliases: ['yt'],
    category: 'downloader',
    description: 'Download YouTube (MP3/MP4)',

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        let format = 'mp3';

        // Cek argumen kedua untuk format
        if (args.length > 1) {
            const fmt = args[1]?.toLowerCase();
            if (fmt === 'mp4' || fmt === 'video') {
                format = 'mp4';
            }
        }

        // Cari URL di teks
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
            url = urlMatch[0];
        }

        if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
            return (
                '❌ Masukkan URL YouTube!\n\n' +
                '📌 *Contoh:*\n' +
                '.ytdl https://youtu.be/xxx\n' +
                '.ytdl https://youtu.be/xxx mp4'
            );
        }

        await ctx.react('⏳');

        try {
            const yt = new Youtube();
            const result = await yt.download(url, format);

            if (!result?.results?.download) {
                await ctx.react('❌');
                return '❌ Gagal mengunduh. Coba URL lain.';
            }

            const data = result.results;
            const downloadUrl = data.download;

            if (format === 'mp4') {
                await sock.sendMessage(chat, {
                    video: { url: downloadUrl },
                    caption: `🎬 *${data.title || 'YouTube Video'}*`
                });
            } else {
                await sock.sendMessage(chat, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${data.title || 'audio'}.mp3`
                });
            }

            await ctx.react('✅');
//            return `✅ Selesai! ${format.toUpperCase()}`;
            return;
        } catch (error) {
            console.error('[YTDL] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};