// command/ai/aimode.js

import aiService from '../../ai-modules/lib/aiService.js';

export default {
    name: 'aimode',
    aliases: ['ai', 'aion', 'aioff'],
    category: 'ai',
    description: 'Aktifkan/nonaktifkan mode AI',

    async execute(ctx) {
        const { sender, reply, args } = ctx;

        if (args.length === 0) {
            const isActive = await aiService.isAIModeActive(sender);
            return reply(
                `🤖 *Mode AI*\n\n` +
                `Status: ${isActive ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
                `Gunakan:\n` +
                `.aimode on  - Aktifkan AI\n` +
                `.aimode off - Nonaktifkan AI`
            );
        }

        const action = args[0].toLowerCase();

        if (action === 'on' || action === '1' || action === 'true') {
            await aiService.setAIMode(sender, true);
            return reply('✅ *Mode AI diaktifkan*\n\nSekarang bot akan merespons semua pesanmu dengan AI!');
        }

        if (action === 'off' || action === '0' || action === 'false') {
            await aiService.setAIMode(sender, false);
            return reply('❌ *Mode AI dinonaktifkan*\n\nBot hanya akan merespons command seperti biasa.');
        }

        return reply('❌ Gunakan: `.aimode on` atau `.aimode off`');
    }
};