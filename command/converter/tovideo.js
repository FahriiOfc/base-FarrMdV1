// command/converter/tovideo.js

import media from '../../lib/media.js';

export default {
    name: 'tovideo',
    aliases: [],
    category: 'converter',
    description: 'Convert sticker to video (animated sticker → video with duration)',

    async execute(ctx) {
        const { sock, chat } = ctx;

        // Ambil media dari pesan
        const mediaBuffer = await ctx.getMediaFromMessage?.();

        if (!mediaBuffer) {
            return (
                '❌ Reply ke sticker yang ingin diubah menjadi video.\n\n' +
                '📌 *Support:*\n' +
                '• Sticker biasa (jadi video 3 detik)\n' +
                '• Sticker gerak/animated (jadi video sesuai durasi)'
            );
        }

        await ctx.react('⏳');

        try {
            const videoBuffer = await media.toVideo(mediaBuffer);
            
            if (!videoBuffer || videoBuffer.length === 0) {
                await ctx.react('❌');
                return '❌ Gagal mengubah sticker ke video.';
            }

            await sock.sendMessage(chat, {
                video: videoBuffer,
                caption: '✅ Berhasil diubah menjadi video'
            });

            await ctx.react('✅');
            return; // Silent success

        } catch (error) {
            console.error('[TOVIDEO] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengubah ke video'}`;
        }
    }
};