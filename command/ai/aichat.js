// command/ai/aichat.js

import aiService from '../../ai-modules/lib/aiService.js';

export default {
    name: 'aichat',
    aliases: ['ask', 'tanya'],
    category: 'ai',
    description: 'Tanya sesuatu ke AI',

    async execute(ctx) {
        const { sender, reply, text } = ctx;

        if (!text || text.length === 0) {
            return reply('❌ *Pertanyaan kosong!*\n\nContoh: `.aichat Apa itu kecerdasan buatan?`');
        }

        await ctx.react('⏳');

        try {
            const response = await aiService.chatWithAI(sender, text);
            const maxLength = 4000;
            const finalResponse = response.length > maxLength 
                ? response.substring(0, maxLength) + '\n\n... _(dipotong)_'
                : response;

            await ctx.react('✅');
            return reply(finalResponse);

        } catch (error) {
            await ctx.react('❌');
            return reply(`❌ Error: ${error.message}`);
        }
    }
};