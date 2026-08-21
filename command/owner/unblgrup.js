// command/owner/unblgrup.js

import database from '../../lib/database.js';

export default {
    name: 'unblgrup',
    aliases: ['unblacklistgrup', 'unblgc'],
    category: 'owner',
    description: 'Remove group from blacklist',
    ownerOnly: true,

    async execute(ctx) {
        await ctx.react('⏳');

        let targetJid = ctx.args[0] || '';

        if (!targetJid && ctx.isGroup) {
            targetJid = ctx.chat;
        }

        if (!targetJid || !targetJid.endsWith('@g.us')) {
            await ctx.react('❌');
            return (
                '❌ Target grup tidak valid!\n\n' +
                '📌 *Cara Penggunaan:*\n' +
                '1. Untuk grup saat ini: Ketik `.unblgrup` langsung di dalam grup target.\n' +
                '2. Untuk grup lain: `.unblgrup 123456789@g.us`'
            );
        }

        if (database.removeBlGrup(targetJid)) {
            await ctx.react('✅');
            return `✅ Grup ${targetJid} berhasil dihapus dari blacklist.\nBot akan merespon kembali.`;
        } else {
            await ctx.react('ℹ️');
            return `ℹ️ Grup ${targetJid} tidak ada di blacklist.`;
        }
    }
};