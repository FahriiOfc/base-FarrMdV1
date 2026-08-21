// command/owner/blgrup.js

import database from '../../lib/database.js';

export default {
    name: 'blgrup',
    aliases: ['blacklistgrup', 'blgc'],
    category: 'owner',
    description: 'Blacklist a group',
    ownerOnly: true,

    async execute(ctx) {
        await ctx.react('⏳');

        // DEBUG: Log sender info
        console.log('[BLGRUP] Sender:', ctx.sender);
        console.log('[BLGRUP] isOwner:', ctx.isOwner);
        console.log('[BLGRUP] isBot:', ctx.isBot);
        console.log('[BLGRUP] fromMe:', ctx.fromMe);

        let targetJid = ctx.args[0] || '';

        if (!targetJid && ctx.isGroup) {
            targetJid = ctx.chat;
        }

        if (!targetJid || !targetJid.endsWith('@g.us')) {
            await ctx.react('❌');
            return (
                '❌ Target grup tidak valid!\n\n' +
                '📌 *Cara Penggunaan:*\n' +
                '1. Untuk grup saat ini: Ketik `.blgrup` langsung di dalam grup target.\n' +
                '2. Untuk grup lain: `.blgrup 123456789@g.us`'
            );
        }

        if (database.addBlGrup(targetJid)) {
            await ctx.react('✅');
            return `⛔ Grup ${targetJid} berhasil ditambahkan ke blacklist.\nBot tidak akan merespon di grup ini.`;
        } else {
            await ctx.react('ℹ️');
            return `ℹ️ Grup ${targetJid} sudah ada di blacklist.`;
        }
    }
};