// command/main/owner.js

import config from '../../config.js';

export default {
    name: 'owner',
    aliases: [],
    category: 'main',
    description: 'Show bot owner contact',

    async execute(ctx) {
        const { sock, chat } = ctx;
        await ctx.react('⏳');
        
        const number = String(config.ownerNumber || '').replace(/\D/g, '');
        const name = config.ownerName || 'Owner';

        if (!number) {
            await ctx.react('❌');
            return '❌ ownerNumber belum diatur di config.js';
        }

        await sock.sendMessage(chat, {
            contacts: {
                displayName: name,
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`
                }]
            }
        });

        await ctx.react('✅');
        return;
    }
};