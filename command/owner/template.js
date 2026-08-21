// command/owner/template.js
// TEMPLATE COMMAND - Copy file ini untuk membuat command baru
// Letakkan di folder yang sesuai:
// - command/main/     untuk command publik
// - command/owner/    untuk command owner only
// - command/group/    untuk command grup
// - command/converter/ untuk converter
// - command/downloader/ untuk downloader
// - command/tools/    untuk tools

// ============================================================
// 1. IMPORT MODULES YANG DIBUTUHKAN
// ============================================================

// Import bawaan Node.js
import fs from 'fs/promises';
import path from 'path';

// Import dari lib project
import database from '../../lib/database.js';
import settings from '../../lib/settings.js';
import permissions from '../../lib/permissions.js';
import { normalizeJid } from '../../lib/identity.js';

// Import dari package eksternal (jika perlu)
// import axios from 'axios';

// ============================================================
// 2. EKSPORT CONFIGURATION COMMAND
// ============================================================

export default {
    // ============================================================
    // 2a. INFORMASI DASAR COMMAND
    // ============================================================

    // NAMA COMMAND (wajib) - yang diketik user setelah prefix
    name: 'template',
    
    // ALIAS (opsional) - nama lain yang bisa dipakai
    aliases: ['tpl', 'temp'],
    
    // KATEGORI (wajib) - untuk grouping di menu
    category: 'owner', // main | owner | group | converter | downloader | tools
    
    // DESKRIPSI (wajib) - untuk ditampilkan di menu
    description: 'Template command untuk membuat fitur baru',
    
    // ============================================================
    // 2b. PERMISSION FLAGS (semua opsional, default false)
    // ============================================================

    // HANYA OWNER YANG BISA PAKAI
    ownerOnly: true,
    
    // HANYA ADMIN GRUP YANG BISA PAKAI (otomatis owner juga bisa)
    adminOnly: false,
    
    // BOT HARUS JADI ADMIN GRUP (otomatis owner juga bisa)
    botAdmin: false,
    
    // HANYA BISA DIGUNAKAN DI GRUP
    groupOnly: false,

    // ============================================================
    // 3. FUNCTION EXECUTE (WAJIB)
    // ============================================================
    
    // ctx = context object yang berisi semua data pesan dan helper
    async execute(ctx) {
        // ============================================================
        // 3a. DESTRUCTURING CONTEXT
        // ============================================================
        
        const {
            // === SOCKET & MESSAGE ===
            sock,           // Socket WhatsApp (untuk sendMessage)
            message,        // Raw message dari Baileys
            messageKey,     // Key pesan (untuk reply/react)
            messageId,      // ID pesan
            
            // === IDENTITAS ===
            chat,           // JID chat (grup atau private)
            sender,         // JID pengirim
            pushName,       // Nama pengirim
            isGroup,        // Boolean: true jika di grup
            fromMe,         // Boolean: true jika dari bot sendiri
            
            // === PERMISSION ===
            isOwner,        // Boolean: true jika owner
            isAdmin,        // Boolean: true jika admin grup
            isBotAdmin,     // Boolean: true jika bot admin grup
            metadata,       // Data grup (participants, dll) - null jika bukan grup
            
            // === CONTENT ===
            text,           // Full teks setelah command
            args,           // Array argumen (split by space)
            command,        // Object command yang sedang dijalankan
            commandName,    // Nama command yang dipanggil
            
            // === QUOTED MESSAGE ===
            quoted,         // Object pesan yang di-reply (null jika tidak ada)
            quotedMessage,  // Raw quoted message
            mentionedJid,   // Array JID yang di-tag
            
            // === HELPERS ===
            reply,          // Fungsi: reply(text) → kirim balasan
            send,           // Fungsi: send(content, options) → kirim custom
            react,          // Fungsi: react(emoji) → reaksi ke pesan
            removeMessage,  // Fungsi: removeMessage(key) → hapus pesan (ganti dari 'delete')
            resolveTarget,  // Fungsi: resolveTarget() → dapatkan JID target (reply/tag)
            identity,       // Identity resolver
            getMediaFromMessage // Fungsi: ambil media dari pesan
        } = ctx;

        // ============================================================
        // 3b. VALIDASI AWAL (jika diperlukan)
        // ============================================================

        // Contoh: cek jika tidak ada argumen
        if (args.length === 0) {
            await react('❌');
            return '❌ Masukkan argumen!\n\n📌 Contoh: .template halo';
        }

        // Contoh: cek jika reply tidak ada
        if (!quoted) {
            await react('❌');
            return '❌ Reply ke pesan yang ingin diproses!';
        }

        // ============================================================
        // 3c. PROSES LOGIC COMMAND
        // ============================================================

        // React loading
        await react('⏳');

        try {
            // --- Contoh: ambil argumen ---
            const arg1 = args[0] || '';
            const arg2 = args.slice(1).join(' ') || '';

            console.log(`[TEMPLATE] Argumen: ${arg1}, ${arg2}`);

            // --- Contoh: proses database ---
            // const data = database.readJSON('path/to/file.json', { default: {} });

            // --- Contoh: kirim pesan ---
            // await sock.sendMessage(chat, { text: 'Pesan balasan' });

            // --- Contoh: kirim dengan mentions ---
            // await sock.sendMessage(chat, {
            //     text: `Halo @${sender.split('@')[0]}`,
            //     mentions: [sender]
            // });

            // --- Contoh: kirim sticker ---
            // await sock.sendMessage(chat, { sticker: stickerBuffer });

            // --- Contoh: kirim gambar ---
            // await sock.sendMessage(chat, {
            //     image: { url: 'https://example.com/image.jpg' },
            //     caption: 'Caption gambar'
            // });

            // --- Contoh: kirim file ---
            // await sock.sendMessage(chat, {
            //     document: Buffer.from('Hello World', 'utf8'),
            //     fileName: 'file.txt',
            //     mimetype: 'text/plain'
            // });

            // --- Contoh: kirim button ---
            // await sock.sendMessage(chat, {
            //     text: 'Pilih salah satu:',
            //     footer: 'Footer button',
            //     buttons: [
            //         { buttonId: 'btn_yes', buttonText: { displayText: '✅ Ya' }, type: 1 },
            //         { buttonId: 'btn_no', buttonText: { displayText: '❌ Tidak' }, type: 1 }
            //     ]
            // });

            // --- Contoh: kirim list ---
            // await sock.sendMessage(chat, {
            //     text: 'Pilih dari daftar:',
            //     title: '📋 Menu Pilihan',
            //     footer: 'Footer list',
            //     buttonText: '📋 Buka Daftar',
            //     sections: [
            //         {
            //             title: 'Kategori 1',
            //             rows: [
            //                 { title: 'Pilihan 1', rowId: 'opt1', description: 'Deskripsi 1' },
            //                 { title: 'Pilihan 2', rowId: 'opt2', description: 'Deskripsi 2' }
            //             ]
            //         }
            //     ]
            // });

            // ============================================================
            // 3d. KIRIM RESPON
            // ============================================================

            // React sukses
            await react('✅');
            
            // Return string untuk dikirim sebagai reply text
            return `✅ Template command berhasil dijalankan!\n\n📌 Argumen: ${arg1}\n📌 Teks: ${arg2}`;

        } catch (error) {
            // ============================================================
            // 3e. ERROR HANDLING
            // ============================================================

            console.error('[TEMPLATE] Error:', error.message);
            console.error('[TEMPLATE] Stack:', error.stack);
            
            await react('❌');
            return `❌ Terjadi kesalahan: ${error.message}`;
        }
    }
};

// ============================================================
// 4. CATATAN PENGGUNAAN
// ============================================================

/*
CARA PAKAI TEMPLATE INI:

1. Copy file ini ke lokasi yang diinginkan:
   - command/main/nama_fitur.js      → command publik
   - command/owner/nama_fitur.js     → command owner only
   - command/group/nama_fitur.js     → command grup
   - command/converter/nama_fitur.js → converter
   - command/downloader/nama_fitur.js → downloader
   - command/tools/nama_fitur.js     → tools

2. Ubah konfigurasi di bagian 2:
   - name: 'nama_command'        ← nama yang diketik user
   - aliases: ['alias1', 'alias2'] ← nama alternatif
   - category: 'kategori'        ← main/owner/group/converter/downloader/tools
   - description: 'Deskripsi'    ← muncul di menu
   - ownerOnly: true/false       ← hanya owner?
   - adminOnly: true/false       ← hanya admin grup?
   - botAdmin: true/false        ← butuh bot admin?
   - groupOnly: true/false       ← hanya di grup?

3. Tulis logic di bagian 3c (PROSES LOGIC COMMAND)

4. Gunakan helper yang tersedia:
   - ctx.reply('teks')           → kirim balasan text
   - ctx.react('✅')             → reaksi ke pesan
   - ctx.send({...})             → kirim custom message
   - ctx.args[0]                 → ambil argumen pertama
   - ctx.quoted                  → cek apakah ada reply
   - ctx.resolveTarget()         → dapatkan target (reply/tag)
   - ctx.sock.sendMessage(...)   → kirim pesan apapun

5. Test command:
   .nama_command argumen1 argumen2
*/

// ============================================================
// 5. CONTOH IMPLEMENTASI (Uncomment untuk test)
// ============================================================

/*
// Contoh command sederhana: .hello
export default {
    name: 'hello',
    aliases: ['halo'],
    category: 'main',
    description: 'Sapa bot',
    ownerOnly: false,
    adminOnly: false,
    botAdmin: false,
    groupOnly: false,

    async execute(ctx) {
        const { sender, pushName } = ctx;
        await ctx.react('👋');
        return `Halo ${pushName || sender}! Selamat datang di FarrMdV1!`;
    }
};
*/

/*
// Contoh command dengan argumen: .echo halo dunia
export default {
    name: 'echo',
    aliases: ['balas'],
    category: 'main',
    description: 'Mengulang pesan yang dikirim',
    ownerOnly: false,

    async execute(ctx) {
        const { args } = ctx;
        if (args.length === 0) {
            await ctx.react('❌');
            return '❌ Masukkan teks yang ingin diulang!';
        }
        await ctx.react('🔊');
        return args.join(' ');
    }
};
*/

/*
// Contoh command dengan reply: .balas (reply ke pesan)
export default {
    name: 'balas',
    aliases: ['reply'],
    category: 'main',
    description: 'Balas pesan yang di-reply',
    ownerOnly: false,

    async execute(ctx) {
        const { quoted } = ctx;
        if (!quoted) {
            await ctx.react('❌');
            return '❌ Reply ke pesan yang ingin dibalas!';
        }
        await ctx.react('✅');
        return `Balasan untuk: ${quoted.text || 'Pesan tanpa teks'}`;
    }
};
*/