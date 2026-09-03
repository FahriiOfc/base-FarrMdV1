// command/beta/testfakequoted.js
// 🧪 BETA: Test Fake Quoted Message

import config from '../../config.js';

export default {
    name: 'testfakequoted',
    aliases: ['tfq', 'fakeq', 'testquoted'],
    category: 'beta',
    description: '🧪 Test fake quoted message',

    async execute(ctx) {
        const { sock, chat, sender, pushName, reply, react } = ctx;
        await react('⏳');

        const botName = config.botName || 'FarrMdV1';
        const ownerName = config.ownerName || 'Owner';

        // ============================================================
        // FAKE QUOTED MESSAGE (PALSU)
        // ============================================================

        const fakeQuotedMessage = {
            conversation: `📋 *${botName} BETA TEST*\n\nIni adalah pesan yang muncul sebagai QUOTED/REPLY palsu.`
        };

        const fakeStanzaId = `fake_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // ============================================================
        // PESAN UTAMA
        // ============================================================

        const text = 
            `🧪 *TEST FAKE QUOTED*\n\n` +
            `Halo ${pushName || 'User'}! 👋\n\n` +
            `Ini adalah contoh pesan dengan *FAKE QUOTED*.\n` +
            `Pesan di atas (yang ada di kotak kutipan) adalah *PALSU*!\n\n` +
            `📌 *Detail:*\n` +
            `• Bot : ${botName}\n` +
            `• Owner : ${ownerName}\n` +
            `• Waktu : ${new Date().toLocaleString('id-ID')}\n\n` +
            `💡 *Tips:*\n` +
            `• Lihat kotak kutipan di atas 👆\n` +
            `• Itu adalah pesan FAKE, bukan reply asli!\n\n` +
            `✅ Fake quoted berhasil!`;

        // ============================================================
        // KIRIM DENGAN FAKE QUOTED + BUTTONS
        // ============================================================

        try {
            await sock.sendMessage(chat, {
                text: text,
                contextInfo: {
                    // 🔥 FAKE QUOTED
                    quotedMessage: fakeQuotedMessage,
                    stanzaId: fakeStanzaId,
                    participant: sender,
                    remoteJid: chat,
                    
                    // FORWARDED FLAG
                    isForwarded: true,
                    forwardingScore: 999,
                    mentionedJid: [sender]
                },
                buttons: [
                    {
                        buttonId: 'beta_test1',
                        buttonText: { displayText: '✅ Test 1' },
                        type: 1
                    },
                    {
                        buttonId: 'beta_test2',
                        buttonText: { displayText: '🧪 Test 2' },
                        type: 1
                    },
                    {
                        buttonId: 'beta_test3',
                        buttonText: { displayText: '🔬 Test 3' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: `🧪 ${botName} BETA - ${new Date().toLocaleTimeString('id-ID')}`
            });

            await react('✅');
            return;

        } catch (error) {
            console.error('[TESTFAKEQUOTED] Error:', error.message);
            await react('❌');
            
            // Fallback: kirim teks biasa
            return (
                `🧪 *TEST FAKE QUOTED*\n\n` +
                `❌ Gagal mengirim fake quoted.\n` +
                `Error: ${error.message}\n\n` +
                `📌 *Pesan Fake Quoted (text):*\n` +
                `"${fakeQuotedMessage.conversation}"`
            );
        }
    }
};