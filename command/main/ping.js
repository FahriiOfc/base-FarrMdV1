// command/main/ping.js

export default {
    name: 'ping',
    aliases: ['p'],
    category: 'main',
    description: 'Check bot latency',

    async execute(ctx) {
        await ctx.react('⏳');
        
        const start = process.hrtime.bigint();
        const sent = await ctx.send({ text: '🏓 Mengukur ping...' });
        const latency = Number(process.hrtime.bigint() - start) / 1000000;

        let status = '🟢 Excellent';
        if (latency >= 80) status = '🟡 Good';
        if (latency >= 150) status = '🟠 Slow';
        if (latency >= 300) status = '🔴 Very Slow';

        await ctx.send({
            text: `🏓 *Pong!*\n\n⚡ Response : ${latency.toFixed(2)} ms\n📶 Status   : ${status}`,
            edit: sent.key
        });
        
        await ctx.react('✅');
    }
};