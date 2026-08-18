// command/converter/tovideo.js

import media from '../../lib/media.js';

export default {
    name: 'tovideo',
    aliases: [],
    category: 'converter',
    description: 'Convert sticker to video',

    async execute(ctx) {
        const { sock, chat } = ctx;

        const mediaBuffer = await ctx.getMediaFromMessage?.();

        if (!mediaBuffer) {
            return '❌ Reply ke sticker yang ingin diubah menjadi video.';
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
            return '✅ Selesai!';
        } catch (error) {
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengubah ke video'}`;
        }
    }
};