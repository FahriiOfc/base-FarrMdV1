// command/ai/aireset.js

import aiService from '../../ai-modules/lib/aiService.js';

export default {
    name: 'aireset',
    aliases: ['clearai', 'resetai'],
    category: 'ai',
    description: 'Reset memory percakapan AI',

    async execute(ctx) {
        const { sender, reply } = ctx;

        await ctx.react('⏳');

        try {
            const success = await aiService.resetAIMemory(sender);
            
            if (success) {
                await ctx.react('✅');
                return reply('🧹 *Memory AI direset!*\n\nPercakapan sebelumnya sudah dihapus.');
            } else {
                await ctx.react('❌');
                return reply('❌ Gagal mereset memory AI.');
            }
        } catch (error) {
            await ctx.react('❌');
            return reply(`❌ Error: ${error.message}`);
        }
    }
};