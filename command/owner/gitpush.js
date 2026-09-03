// command/owner/gitpush.js
// 🤖 Auto update & push ke GitHub (edit message + akurat)

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default {
    name: 'gitpush',
    aliases: ['update', 'push', 'gitsync'],
    category: 'owner',
    description: '🤖 Auto update & push ke GitHub',
    ownerOnly: true,

    async execute(ctx) {
        const { args, react, send } = ctx;

        // Ambil pesan commit (opsional)
        let commitMessage = args.length > 0
            ? args.join(' ')
            : `Auto update: ${new Date().toLocaleString('id-ID')}`;

        await react('⏳');

        // Kirim pesan awal (akan di-edit terus)
        const sent = await send({
            text: `🤖 *GitHub Auto Push*\n━━━━━━━━━━━━━━━━━━━━\n\n⏳ Memulai proses...`
        });

        // Waktu mulai (akurat)
        const start = process.hrtime.bigint();

        try {
            // ============================================================
            // STEP 1: Cek status git
            // ============================================================

            let output = `🤖 *GitHub Auto Push*\n━━━━━━━━━━━━━━━━━━━━\n\n`;

            const { stdout: statusOut } = await execAsync('git status --porcelain', {
                cwd: process.cwd()
            });

            if (!statusOut.trim()) {
                output += `✅ *Tidak ada perubahan*\n\n📌 Semua file sudah sinkron dengan GitHub.`;
                await send({ text: output, edit: sent.key });
                await react('✅');
                return;
            }

            // ============================================================
            // STEP 2: Git add .
            // ============================================================

            output += `📦 *Step 1/4:* Menambahkan semua file...\n`;
            await send({ text: output, edit: sent.key });

            await execAsync('git add .', { cwd: process.cwd() });

            // ============================================================
            // STEP 3: Git commit
            // ============================================================

            output += `📦 *Step 2/4:* Commit perubahan...\n`;
            output += `📝 *Pesan:* ${commitMessage}\n`;
            await send({ text: output, edit: sent.key });

            await execAsync(`git commit -m "${commitMessage}"`, {
                cwd: process.cwd()
            });

            // ============================================================
            // STEP 4: Git push
            // ============================================================

            output += `📦 *Step 3/4:* Push ke GitHub...\n`;
            await send({ text: output, edit: sent.key });

            const { stdout, stderr } = await execAsync('git push origin main', {
                cwd: process.cwd(),
                timeout: 60000
            });

            // ============================================================
            // STEP 5: Selesai
            // ============================================================

            const elapsed = Number(process.hrtime.bigint() - start) / 1000000000;

            output += `📦 *Step 4/4:* Selesai!\n`;
            output += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            output += `✅ *Push berhasil!*\n\n`;

            // Tampilkan ringkasan perubahan
            const changedFiles = statusOut.split('\n').filter(f => f.trim());
            output += `📄 *File berubah:*\n`;
            for (const file of changedFiles.slice(0, 10)) {
                const status = file.substring(0, 2).trim();
                const filename = file.substring(3);
                const emoji = status === 'M' ? '✏️' : status === 'A' ? '➕' : status === 'D' ? '➖' : '📄';
                output += `  ${emoji} ${filename}\n`;
            }
            if (changedFiles.length > 10) {
                output += `  ... dan ${changedFiles.length - 10} file lainnya\n`;
            }

            output += `\n📝 *Commit:* ${commitMessage}\n`;
            output += `⏱️ *Waktu:* ${elapsed.toFixed(2)}s\n`;
            output += `🔗 *Repo:* https://github.com/FahriiOfc/base-FarrMdV1`;

            if (stderr && !stderr.includes('warning')) {
                output += `\n\n⚠️ *Stderr:*\n${stderr}`;
            }

            await send({ text: output, edit: sent.key });
            await react('✅');

        } catch (error) {
            console.error('[GITPUSH] Error:', error.message);

            let output = `🤖 *GitHub Auto Push*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            output += `❌ *Error:* ${error.message}\n\n`;

            if (error.stderr) {
                output += `📤 *Detail:*\n\`\`\`\n${error.stderr}\n\`\`\``;
            }

            if (error.message.includes('not a git repository')) {
                output += `\n\n💡 *Solusi:* Pastikan kamu di direktori project Git.`;
            } else if (error.message.includes('Permission denied')) {
                output += `\n\n💡 *Solusi:* Cek SSH key: \`ssh -T git@github.com\``;
            } else if (error.message.includes('fatal:')) {
                output += `\n\n💡 *Solusi:* Periksa pesan error di atas.`;
            }

            await send({ text: output, edit: sent.key });
            await react('❌');
        }
    }
};