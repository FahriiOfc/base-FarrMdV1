// command/group/unpin.js

export default {
    name: 'unpin',
    aliases: [],
    category: 'group',
    description: 'Unpin a message (reply to target)',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    async execute(ctx) {
        const { sock, chat, quoted } = ctx;

        await ctx.react('⏳');

        if (!quoted) {
            await ctx.react('❌');
            return '❌ Reply ke pesan yang ingin dilepas pinnya!';
        }

        if (!quoted.key || !quoted.key.id) {
            await ctx.react('❌');
            return '❌ Key pesan tidak valid!';
        }

        try {
            const pinKey = {
                remoteJid: quoted.key.remoteJid || chat,
                id: quoted.key.id,
                fromMe: quoted.key.fromMe || false,
                participant: quoted.key.participant || quoted.sender || chat
            };

            console.log('[UNPIN] Unpinning message:', pinKey);

            await sock.sendMessage(chat, {
                pin: {
                    key: pinKey,
                    type: 0
                }
            });

            await ctx.react('✅');
            return '📌 *Pesan Dilepas!*\n\nSematkan pesan telah dilepas.';

        } catch (error) {
            console.error('[UNPIN ERROR]', error.message);
            await ctx.react('❌');
            return `❌ Gagal melepas pin: ${error.message}\n\nPastikan bot adalah admin grup.`;
        }
    }
};