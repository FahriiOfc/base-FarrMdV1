// command/beta/dlbtest.js
// Test All-in-One Downloader dari coflyn/scrapr

import scrapr from 'scrapr';

export default {
    name: 'dlbtest',
    aliases: ['dlt'],
    category: 'beta',
    description: 'Test All-in-One Downloader (scrapr)',
    ownerOnly: false,

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) url = urlMatch[0];

        if (!url) {
            return (
                '❌ Masukkan URL!\n\n' +
                '📌 Support:\n' +
                '• Instagram (.igtest)\n' +
                '• Facebook (.fbtest)\n' +
                '• TikTok (.tttest)\n' +
                '• YouTube (.yttest)\n' +
                '• Twitter (.twtest)\n' +
                '• Spotify (.sptest)\n\n' +
                '💡 Atau gunakan .dlbeta untuk auto-detect'
            );
        }

        await ctx.react('⏳');

        try {
            // ============================================================
            // AUTO DETECT PLATFORM
            // ============================================================

            let platform = null;
            let scraperFn = null;
            let scraperName = '';

            if (url.includes('instagram.com')) {
                platform = 'Instagram';
                scraperFn = scrapr.instagram.downreels;
                scraperName = 'downreels';
            } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
                platform = 'Facebook';
                scraperFn = scrapr.facebook.snapsave;
                scraperName = 'snapsave';
            } else if (url.includes('tiktok.com')) {
                platform = 'TikTok';
                scraperFn = scrapr.tiktok.tiktokio;
                scraperName = 'tiktokio';
            } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                platform = 'YouTube';
                scraperFn = scrapr.youtube.ytmp3;
                scraperName = 'ytmp3';
            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                platform = 'Twitter';
                scraperFn = scrapr.twitter.tweeload;
                scraperName = 'tweeload';
            } else if (url.includes('spotify.com')) {
                platform = 'Spotify';
                scraperFn = scrapr.spotify.spotmate;
                scraperName = 'spotmate';
            } else if (url.includes('music.apple.com')) {
                platform = 'Apple Music';
                scraperFn = scrapr.applemusic.aplmate;
                scraperName = 'aplmate';
            } else {
                await ctx.react('❌');
                return '❌ Platform tidak didukung!';
            }

            console.log(`[DLBTEST] Platform: ${platform} (${scraperName})`);

            const res = await scraperFn(url);
            
            if (!res || !res.status || !res.result || !res.result.downloads) {
                await ctx.react('❌');
                return `❌ Gagal mengunduh dari ${platform}`;
            }

            await ctx.react('✅');

            const result = res.result;
            const downloads = result.downloads;
            const title = result.title || platform;

            // Kirim media pertama
            const media = downloads[0];
            const mediaType = media.type || 'video';

            if (mediaType === 'video') {
                await sock.sendMessage(chat, {
                    video: { url: media.url },
                    caption: `📥 *${title}*\n📱 ${platform}\n🔗 ${scraperName}`
                });
            } else if (mediaType === 'audio') {
                await sock.sendMessage(chat, {
                    audio: { url: media.url },
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`
                });
            } else {
                await sock.sendMessage(chat, {
                    image: { url: media.url },
                    caption: `📥 *${title}*\n📱 ${platform}\n🔗 ${scraperName}`
                });
            }

            return `✅ Selesai! (${platform} - ${scraperName})`;

        } catch (error) {
            console.error('[DLBTEST] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};