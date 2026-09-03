// command/beta/igtest.js
// Test Instagram Downloader dari coflyn/scrapr

import scrapr from 'scrapr';

export default {
    name: 'igtest',
    aliases: ['igt'],
    category: 'beta',
    description: 'Test Instagram Downloader (scrapr)',
    ownerOnly: false,

    async execute(ctx) {
        const { sock, chat, args, quoted } = ctx;

        let url = args[0] || quoted?.text || '';
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) url = urlMatch[0];

        if (!url || !url.includes('instagram.com')) {
            return (
                '❌ Masukkan URL Instagram!\n\n' +
                '📌 Contoh: .igtest https://www.instagram.com/p/xxx\n' +
                '📌 Support: Reels, Posts, Stories'
            );
        }

        await ctx.react('⏳');

        try {
            console.log('[IGTEST] ===== START =====');
            console.log('[IGTEST] URL:', url);

            // ============================================================
            // FALLBACK CHAIN - 3 METODE
            // ============================================================

            const scrapers = [
                { name: 'downreels', fn: scrapr.instagram.downreels },
                { name: 'indown', fn: scrapr.instagram.indown },
                // { name: 'snapinsta', fn: scrapr.instagram.snapinsta }, // Butuh playwright
            ];

            let result = null;
            let lastError = null;
            let usedScraper = null;

            for (const scraper of scrapers) {
                try {
                    console.log(`[IGTEST] Trying ${scraper.name}...`);
                    const res = await scraper.fn(url);
                    
                    if (res && res.status) {
                        result = res.result;
                        usedScraper = scraper.name;
                        console.log(`[IGTEST] ✅ Success with ${scraper.name}`);
                        break;
                    } else {
                        console.log(`[IGTEST] ❌ ${scraper.name} returned status:`, res?.status);
                        lastError = res?.message || 'Unknown error';
                    }
                } catch (e) {
                    lastError = e.message;
                    console.log(`[IGTEST] ❌ ${scraper.name} error:`, e.message);
                }
            }

            if (!result || !result.downloads || result.downloads.length === 0) {
                await ctx.react('❌');
                return (
                    `❌ Gagal mengunduh.\n\n` +
                    `📌 Scraper terakhir: ${usedScraper || 'none'}\n` +
                    `📌 Error: ${lastError || 'Unknown'}\n\n` +
                    `💡 Coba URL lain atau gunakan .ig (lolhuman)`
                );
            }

            await ctx.react('✅');

            // ============================================================
            // KIRIM MEDIA
            // ============================================================

            const title = result.title || 'Instagram';
            const downloads = result.downloads;

            console.log(`[IGTEST] Found ${downloads.length} media(s)`);

            // Kirim semua media
            for (const media of downloads) {
                const mediaType = media.type || 'image';
                const quality = media.quality || '';
                
                try {
                    if (mediaType === 'video') {
                        await sock.sendMessage(chat, {
                            video: { url: media.url },
                            caption: `📸 *${title}*\n📹 ${quality}\n🔗 ${usedScraper}`
                        });
                    } else {
                        await sock.sendMessage(chat, {
                            image: { url: media.url },
                            caption: `📸 *${title}*\n🔗 ${usedScraper}`
                        });
                    }
                } catch (sendError) {
                    console.log('[IGTEST] Send error:', sendError.message);
                }
            }

            return `✅ Selesai! (${usedScraper})`;

        } catch (error) {
            console.error('[IGTEST] Error:', error.message);
            await ctx.react('❌');
            return `❌ ${error.message || 'Gagal mengunduh'}`;
        }
    }
};