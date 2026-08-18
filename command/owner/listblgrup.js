// command/owner/listblgrup.js

import database from '../../lib/database.js';

export default {
    name: 'listblgrup',
    aliases: ['listblacklistgrup', 'listblgc'],
    category: 'owner',
    description: 'List blacklisted groups',
    ownerOnly: true,

    async execute(ctx) {
        await ctx.react('⏳');

        const db = database.getBlGrup();
        if (!db.groups.length) {
            await ctx.react('📋');
            return '📋 Belum ada grup yang diblacklist.';
        }

        const list = db.groups.map((g, i) => `${i + 1}. ${g}`).join('\n');
        await ctx.react('✅');
        return `📋 *Daftar Blacklist Grup (${db.groups.length})*\n\n${list}`;
    }
};