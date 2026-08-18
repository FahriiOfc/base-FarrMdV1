// command/group/pin.js

export default {
    name: 'pin',
    aliases: [],
    category: 'group',
    description: 'Pin a message (reply to target)',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    async execute(ctx) {
        const { sock, chat, quoted, args } = ctx;

        await ctx.react('⏳');

        if (!quoted) {
            await ctx.react('❌');
            return '❌ Reply ke pesan yang ingin dipin!';
        }

        // Validasi key
        if (!quoted.key || !quoted.key.id) {
            await ctx.react('❌');
            return '❌ Key pesan tidak valid!';
        }

        let duration = 86400; // default 24h
        const arg = args[0]?.toLowerCase() || '';

        if (arg === '24h' || arg === '1d') {
            duration = 86400;
        } else if (arg === '7d') {
            duration = 604800;
        } else if (arg === '30d') {
            duration = 2592000;
        }

        try {
            // PASTIKAN FORMAT KEY BENAR
            const pinKey = {
                remoteJid: quoted.key.remoteJid || chat,
                id: quoted.key.id,
                fromMe: quoted.key.fromMe || false,
                participant: quoted.key.participant || quoted.sender || chat
            };

            console.log('[PIN] Pinning message:', pinKey);

            await sock.sendMessage(chat, {
                pin: {
                    key: pinKey,
                    type: 1,
                    time: duration
                }
            });

            const durationText = arg || '24h';
            await ctx.react('✅');
            return `📌 *Pesan Disematkan!*\n\n⏱️ Durasi: ${durationText}`;

        } catch (error) {
            console.error('[PIN ERROR]', error.message);
            await ctx.react('❌');
            return `❌ Gagal menyematkan pesan: ${error.message}\n\nPastikan bot adalah admin grup.`;
        }
    }
};