// command/owner/getcmd.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(path.dirname(__dirname));
const COMMAND_DIR = path.join(PROJECT_ROOT, 'command');
const LIB_DIR = path.join(PROJECT_ROOT, 'lib');

export default {
    name: 'getcmd',
    aliases: [],
    category: 'owner',
    description: 'Get source code with interactive buttons',
    ownerOnly: true,

    async execute(ctx) {
        const { isOwner, sock, chat, args, sender } = ctx;

        if (!isOwner) {
            console.log(`[GETCMD] Blocked non-owner: ${sender}`);
            return;
        }

        const filePath = args.join(' ') || '';

        // ============================================================
        // MENU UTAMA (tanpa argumen)
        // ============================================================

        if (!filePath) {
            await ctx.react('⏳');

            const headerText = 
                `📄 *GETCMD - SOURCE VIEWER*\n\n` +
                `📌 Pilih direktori sumber:`;

            const buttonMessage = {
                text: headerText,
                footer: '📱 FarrMdV1 - Pilih sumber',
                buttons: [
                    {
                        buttonId: 'getcmd_menu_command',
                        buttonText: { displayText: '📁 command/' },
                        type: 1
                    },
                    {
                        buttonId: 'getcmd_menu_lib',
                        buttonText: { displayText: '📁 lib/' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            try {
                await sock.sendMessage(chat, buttonMessage);
                await ctx.react('✅');
                return;
            } catch (error) {
                console.log('[GETCMD] Menu error:', error.message);
                return (
                    `📄 *GETCMD*\n\n` +
                    `.getcmd command/main/ping.js\n` +
                    `.getcmd lib/media.js`
                );
            }
        }

        // ============================================================
        // JIKA ADA ARGUMEN → PROSES FILE
        // ============================================================

        const normalized = path.normalize(filePath);
        const fullPath = path.resolve(PROJECT_ROOT, normalized);

        const isInCommand = fullPath.startsWith(COMMAND_DIR);
        const isInLib = fullPath.startsWith(LIB_DIR);

        if (!isInCommand && !isInLib) {
            return '❌ Path harus di command/ atau lib/';
        }

        if (!fullPath.endsWith('.js')) {
            return '❌ File harus .js';
        }

        try {
            await fs.access(fullPath);
        } catch {
            return `❌ File tidak ditemukan: ${filePath}`;
        }

        let source;
        let fileName;
        let fileSize;

        try {
            source = await fs.readFile(fullPath, 'utf8');
            fileName = path.basename(fullPath);
            fileSize = (source.length / 1024).toFixed(2);
        } catch (error) {
            return `❌ Gagal membaca file: ${error.message}`;
        }

        const relativePath = path.relative(PROJECT_ROOT, fullPath);
        const totalLines = source.split('\n').length;

        // ============================================================
        // SIMPAN SESSION (TIDAK DIHAPUS, EXPIRED 5 MENIT)
        // ============================================================

        const sessionId = `getcmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        global.getcmdSessions = global.getcmdSessions || new Map();

        // Bersihkan session lama (> 5 menit)
        for (const [key, val] of global.getcmdSessions) {
            if (Date.now() - val.created > 300000) {
                global.getcmdSessions.delete(key);
            }
        }

        global.getcmdSessions.set(sessionId, {
            source,
            fileName,
            relativePath,
            fileSize,
            totalLines,
            created: Date.now()
        });

        // ============================================================
        // TAMPILKAN 2 BUTTON: Text dan File (keduanya bisa dipilih)
        // ============================================================

        const headerText = 
            `📄 *GETCMD*\n\n` +
            `📁 ${relativePath}\n` +
            `📊 ${totalLines} lines\n` +
            `📦 ${fileSize} KB\n\n` +
            `📌 Pilih format output (bisa pilih keduanya):`;

        const buttonMessage = {
            text: headerText,
            footer: '📱 FarrMdV1 - Pilih format',
            buttons: [
                {
                    buttonId: `text_${sessionId}`,
                    buttonText: { displayText: '📄 Text' },
                    type: 1
                },
                {
                    buttonId: `file_${sessionId}`,
                    buttonText: { displayText: '📁 File (.js)' },
                    type: 1
                }
            ],
            headerType: 1
        };

        try {
            await sock.sendMessage(chat, buttonMessage);
            await ctx.react('✅');
            return;
        } catch (error) {
            console.log('[GETCMD] Button error:', error.message);
            // FALLBACK
            const maxChars = 3800;
            let text = `📄 *${relativePath}*\n📊 ${totalLines} lines\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            text += source.length > maxChars ? source.slice(0, maxChars - 200) + '\n\n... (terpotong)' : source;
            return text;
        }
    }
};