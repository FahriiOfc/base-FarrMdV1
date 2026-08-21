// command/owner/delcmd.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(path.dirname(__dirname));
const COMMAND_DIR = path.join(PROJECT_ROOT, 'command');
const LIB_DIR = path.join(PROJECT_ROOT, 'lib');

export default {
    name: 'delcmd',
    aliases: ['del'],
    category: 'owner',
    description: 'Delete file in command/ or lib/',
    ownerOnly: true,

    async execute(ctx) {
        const { isOwner, sender } = ctx;
        const filePath = ctx.args.join(' ') || '';

        // ============================================================
        // VALIDASI: HANYA OWNER
        // ============================================================

        if (!isOwner) {
            console.log(`[DELCMD] Blocked non-owner: ${sender}`);
            return; // SILENT IGNORE
        }

        if (!filePath) {
            return (
                '❌ Masukkan path file!\n\n' +
                '📌 *Contoh:*\n' +
                '.delcmd command/main/test.js\n' +
                '.delcmd lib/media.js\n\n' +
                '⚠️ *PERINGATAN:* File akan dihapus PERMANEN!'
            );
        }

        // ============================================================
        // VALIDASI PATH
        // ============================================================

        const normalized = path.normalize(filePath);
        const fullPath = path.resolve(PROJECT_ROOT, normalized);

        const isInCommand = fullPath.startsWith(COMMAND_DIR);
        const isInLib = fullPath.startsWith(LIB_DIR);

        if (!isInCommand && !isInLib) {
            return '❌ Path harus berada di dalam command/ atau lib/ directory.';
        }

        if (!fullPath.endsWith('.js')) {
            return '❌ File harus memiliki ekstensi .js.';
        }

        // ============================================================
        // CEK FILE EXISTS
        // ============================================================

        try {
            await fs.access(fullPath);
        } catch {
            return `❌ File tidak ditemukan: ${filePath}`;
        }

        // ============================================================
        // KONFIRMASI (jika file penting)
        // ============================================================

        const fileName = path.basename(fullPath);
        const importantFiles = ['handler.js', 'connection.js', 'identity.js', 'permissions.js', 'serializer.js'];
        
        if (importantFiles.includes(fileName)) {
            return (
                `⚠️ *PERINGATAN!*\n\n` +
                `File ${fileName} adalah file CORE bot.\n` +
                `Menghapusnya akan membuat bot mati.\n\n` +
                `Gunakan .editcmd ${filePath} jika ingin mengubah, bukan menghapus.`
            );
        }

        // ============================================================
        // HAPUS FILE
        // ============================================================

        try {
            const relativePath = path.relative(PROJECT_ROOT, fullPath);
            
            // Jika di command/, unregister dulu
            if (isInCommand) {
                const commandLoader = ctx.commandLoader || global.commandLoader;
                const name = commandLoader?.getCommand?.(path.basename(fullPath, '.js'))?.name;
                if (name) {
                    // Unregister via commandLoader
                    console.log('[DELCMD] Unregistering:', name);
                }
            }

            await fs.unlink(fullPath);
            console.log('[DELCMD] Deleted:', fullPath);
            
            // Reload command jika di command/
            if (isInCommand) {
                const commandLoader = ctx.commandLoader || global.commandLoader;
                if (commandLoader) {
                    await commandLoader.scanCommands();
                }
            }

            return (
                `✅ File berhasil dihapus!\n\n` +
                `📁 ${relativePath}\n\n` +
                `⚠️ File sudah tidak ada di disk.`
            );
        } catch (error) {
            return `❌ Gagal menghapus file: ${error.message}`;
        }
    }
};