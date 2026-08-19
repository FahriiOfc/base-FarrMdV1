// command/group/kick.js

export default {
    name: 'kick',
    aliases: [],
    category: 'group',
    description: 'Remove member from group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    async execute(ctx) {
        const { sock, chat } = ctx;
        const target = ctx.resolveTarget();

        if (!target) {
            return '❌ Reply atau tag member yang ingin dikeluarkan.';
        }

        const botJid = sock?.user?.id || '';
        if (target === botJid) {
            return '❌ Tidak bisa mengeluarkan bot sendiri.';
        }

        const isTargetOwner = await ctx.identity?.isOwner(target, sock) || false;
        if (isTargetOwner) {
            return '❌ Tidak bisa mengeluarkan owner bot.';
        }

        await sock.groupParticipantsUpdate(chat, [target], 'remove');
        return `🦶 @${target.split('@')[0]} telah dikeluarkan dari grup.`;
    }
};