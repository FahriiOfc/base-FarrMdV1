// command/beta/fbtest.js
// Test Facebook Downloader dari coflyn/scrapr

import scrapr from 'scrapr';

export default {
    name: 'fbtest',
    aliases: ['fbt'],
    category: 'beta',
    description: 'Test Facebook Downloader (scrapr)',
    ownerOnly: false,

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) url = urlMatch[0];

        if (!url || !url.includes('facebook.com') && !url.includes('fb.watch')) {
            return (
                '❌ Masukkan URL Facebook!\n\n' +
                '📌 Contoh: .fbtest https://fb.watch/xxx\n' +
                '.fbtest https://www.facebook.com/xxx'
            );
        }

        await ctx.react('⏳');

        try {
            console.log('[FBTEST] ===== START =====');
            console.log('[FBTEST] URL:', url);

            // ============================================================
            // FALLBACK CHAIN - 2 METODE
            // ============================================================

            const scrapers = [
                { name: 'snapsave', fn: scrapr.facebook.snapsave },
                // { name: 'fdown', fn: scrapr.facebook.fdown }, // Butuh puppeteer
            ];

            let result = null;
            let lastError = null;
            let usedScraper = null;

            for (const scraper of scrapers) {
                try {
                    console.log(`[FBTEST] Trying ${scraper.name}...`);
                    const res = await scraper.fn(url);
                    
                    if (res && res.status) {
                        result = res.result;
                        usedScraper = scraper.name;
                        console.log(`[FBTEST] ✅ Success with ${scraper.name}`);
                        break;
                    } else {
                        console.log(`[FBTEST] ❌ ${scraper.name} returned status:`, res?.status);
                        lastError = res?.message || 'Unknown error';
                    }
                } catch (e) {
                    lastError = e.message;
                    console.log(`[FBTEST] ❌ ${scraper.name} error:`, e.message);
                }
            }

            if (!result || !result.downloads || result.downloads.length === 0) {
                await ctx.react('❌');
                return (
                    `❌ Gagal mengunduh.\n\n` +
                    `📌 Scraper terakhir: ${usedScraper || 'none'}\n` +
                    `📌 Error: ${lastError || 'Unknown'}\n\n` +
                    `💡 Coba URL lain atau gunakan .fb (lolhuman)`
                );
            }

            await ctx.react('✅');

            // ============================================================
            // KIRIM MEDIA
            // ============================================================

            const title = result.title || 'Facebook';
            const downloads = result.downloads;

            console.log(`[FBTEST] Found ${downloads.length} media(s)`);

            // Ambil kualitas terbaik (HD > SD)
            const media = downloads.find(d => d.quality?.includes('HD')) || downloads[0];

            if (media.type === 'video') {
                await sock.sendMessage(chat, {
                    video: { url: media.url },
                    caption: `📹 *${title}*\n📊 ${media.quality || ''}\n🔗 ${usedScraper}`
                });
            } else {
                await sock.sendMessage(chat, {
                    image: { url: media.url },
                    caption: `📸 *${title}*\n🔗 ${usedScraper}`
                });
            }

            return `✅ Selesai! (${usedScraper})`;

        } catch (error) {
            console.error('[FBTEST] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};