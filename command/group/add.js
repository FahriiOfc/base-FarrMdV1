// command/group/add.js

export default {
    name: 'add',
    aliases: [],
    category: 'group',
    description: 'Add member to group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    async execute(ctx) {
        const { sock, chat, args } = ctx;

        const numbers = args
            .map(v => String(v).replace(/\D/g, ''))
            .map(num => {
                if (num.startsWith('0')) return '62' + num.slice(1);
                return num;
            })
            .filter(num => num.length >= 10);

        if (!numbers.length) {
            return '❌ Masukkan nomor yang valid.\n\nContoh:\n.add 628123456789';
        }

        const targets = numbers.map(num => `${num}@s.whatsapp.net`);

        try {
            const result = await sock.groupParticipantsUpdate(chat, targets, 'add');
            let success = 0;
            let failed = 0;

            if (Array.isArray(result)) {
                for (const item of result) {
                    if (String(item?.status || '') === '200') {
                        success++;
                    } else {
                        failed++;
                    }
                }
            }

            return `➕ *ADD MEMBER*\n\n✅ Berhasil: ${success}\n❌ Gagal: ${failed}`;
        } catch (error) {
            return `❌ Gagal menambahkan member: ${error.message}`;
        }
    }
};