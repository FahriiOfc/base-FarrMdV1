// lib/handler.js
// Message Handler - Full Code with Scraper Support

import config from '../config.js';
import serializer from './serializer.js';
import permissions from './permissions.js';
import settings from './settings.js';
import * as database from './database.js';
import path from 'path';
import { normalizeJid } from './identity.js';

export class Handler {
    #commandLoader;

    constructor(commandLoader) {
        this.#commandLoader = commandLoader;
    }

    // ============================================================
    // GET SENDER - PUBLIC METHOD
    // ============================================================

    getSender(message) {
        if (!message) return '';
        const key = message.key || {};
        let sender = '';

        if (key.remoteJid && key.remoteJid.endsWith('@g.us')) {
            sender = key.participantAlt || key.participant || '';
        } else {
            sender = key.remoteJidAlt || key.remoteJid || '';
        }

        return normalizeJid(sender);
    }

    // ============================================================
    // HANDLE MESSAGE
    // ============================================================

    async handleMessage(message) {
        try {
            // ============================================================
            // BASIC CHECKS
            // ============================================================

            if (!message?.message) return;

            const jid = message.key.remoteJid;
            if (!jid) return;

            if (jid === 'status@broadcast') return;

            if (message.key.fromMe && config.selfResponse !== true) return;

            const sender = this.getSender(message);

            // ============================================================
            // BLACKLIST CHECKS
            // ============================================================

            if (database.isBlUser(sender)) {
                console.log(`[BLACKLIST] Blocked user: ${sender}`);
                return;
            }

            if (jid.endsWith('@g.us') && database.isBlGrup(jid)) {
                console.log(`[BLACKLIST] Blocked group: ${jid}`);
                return;
            }

            // ============================================================
            // MUTE CHECK
            // ============================================================

            if (jid.endsWith('@g.us') && !message.key.fromMe) {
                const muteSender = this.getSender(message);
                
                if (database.isMuted(jid, muteSender)) {
                    console.log(`[MUTE] 💀 Menghapus pesan dari ${muteSender} di ${jid}`);
                    
                    const sock = global.sock || message.sock;
                    if (sock) {
                        try {
                            await sock.sendMessage(jid, { delete: message.key });
                            console.log('[MUTE] ✅ Pesan berhasil dihapus');
                        } catch (deleteError) {
                            console.log('[MUTE] ❌ Gagal hapus:', deleteError.message);
                        }
                    }
                    
                    return;
                }
            }

            // ============================================================
            // SERIALIZE MESSAGE
            // ============================================================

            const sock = global.sock || message.sock;
            if (!sock) {
                console.warn('[HANDLER] No socket available');
                return;
            }

            const ctx = await serializer.serialize(message, sock);

            // ============================================================
            // INJECT getMediaFromMessage INTO CONTEXT
            // ============================================================

            ctx.getMediaFromMessage = async () => {
                return this.#getMediaFromMessage(message, sock);
            };

            // ============================================================
            // AUTO READ
            // ============================================================

            const currentSettings = settings.get();
            if (currentSettings.autoread) {
                try {
                    await sock.readMessages([message.key]);
                } catch (e) {}
            }

            // ============================================================
            // AUTO VN
            // ============================================================

            if (currentSettings.autovn) {
                try {
                    await this.#handleAutoVn(ctx);
                } catch (e) {
                    console.log('[AUTOVN] Error:', e.message);
                }
            }

            // ============================================================
            // AUTO TYPING
            // ============================================================

            if (currentSettings.autotyping) {
                try {
                    await sock.sendPresenceUpdate('composing', jid);
                } catch (e) {}
            }

            // ============================================================
            // HANDLE LIST RESPONSE
            // ============================================================

            const isListResponse = message?.message?.listResponseMessage;
            if (isListResponse) {
                const rowId = isListResponse.singleSelectReply?.selectedRowId || '';
                if (rowId) {
                    console.log('[LIST] Row ID selected:', rowId);

                    // GETCMD FOLDER
                    if (rowId.startsWith('getcmd_cmd_')) {
                        const rest = rowId.replace('getcmd_cmd_', '');
                        const lastUnderscore = rest.lastIndexOf('_');
                        
                        if (lastUnderscore === -1) {
                            console.log('[LIST] Invalid rowId format:', rowId);
                            await ctx.reply('❌ Format rowId tidak valid.');
                            await ctx.react('❌');
                            return;
                        }
                        
                        const folder = rest.substring(0, lastUnderscore);
                        const fileName = rest.substring(lastUnderscore + 1);
                        
                        console.log('[LIST] Folder:', folder, 'File:', fileName);
                        
                        if (fileName && fileName !== 'empty') {
                            const fullCommand = `.getcmd command/${folder}/${fileName}.js`;
                            console.log('[LIST] Full command:', fullCommand);
                            
                            const parsed = serializer.parseCommand(fullCommand, config.prefix);
                            if (parsed) {
                                ctx.args = parsed.args;
                                ctx.text = parsed.text;
                                ctx.commandName = parsed.command;
                            } else {
                                console.log('[LIST] Parse failed for:', fullCommand);
                                await ctx.reply(`❌ Gagal memproses: ${fullCommand}`);
                                await ctx.react('❌');
                                return;
                            }
                        } else {
                            await ctx.reply(`📁 *command/${folder}/*\n\nTidak ada file di folder ini.`);
                            await ctx.react('📂');
                            return;
                        }
                    }

                    // GETCMD LIB
                    else if (rowId.startsWith('getcmd_lib_')) {
                        const fileName = rowId.replace('getcmd_lib_', '');
                        console.log('[LIST] Lib file:', fileName);
                        
                        const fullCommand = `.getcmd lib/${fileName}.js`;
                        console.log('[LIST] Full command:', fullCommand);
                        
                        const parsed = serializer.parseCommand(fullCommand, config.prefix);
                        if (parsed) {
                            ctx.args = parsed.args;
                            ctx.text = parsed.text;
                            ctx.commandName = parsed.command;
                        } else {
                            console.log('[LIST] Parse failed for:', fullCommand);
                            await ctx.reply(`❌ Gagal memproses: ${fullCommand}`);
                            await ctx.react('❌');
                            return;
                        }
                    }

                    // GETCMD SCRAPER
                    else if (rowId.startsWith('getcmd_scraper_')) {
                        const fileName = rowId.replace('getcmd_scraper_', '');
                        console.log('[LIST] Scraper file:', fileName);
                        
                        const fullCommand = `.getcmd scraper/${fileName}.js`;
                        console.log('[LIST] Full command:', fullCommand);
                        
                        const parsed = serializer.parseCommand(fullCommand, config.prefix);
                        if (parsed) {
                            ctx.args = parsed.args;
                            ctx.text = parsed.text;
                            ctx.commandName = parsed.command;
                        } else {
                            console.log('[LIST] Parse failed for:', fullCommand);
                            await ctx.reply(`❌ Gagal memproses: ${fullCommand}`);
                            await ctx.react('❌');
                            return;
                        }
                    }

                    // COMMAND LAINNYA
                    else {
                        let cmdName = rowId;
                        if (!cmdName.startsWith('.')) {
                            cmdName = '.' + cmdName;
                        }
                        const parsed = serializer.parseCommand(cmdName, config.prefix);
                        if (parsed) {
                            ctx.args = parsed.args;
                            ctx.text = parsed.text;
                            ctx.commandName = parsed.command;
                        } else {
                            console.log('[LIST] Parse failed for:', cmdName);
                            await ctx.reply(`❌ Command tidak dikenali: ${cmdName}`);
                            await ctx.react('❌');
                            return;
                        }
                    }
                } else {
                    return;
                }
            }

            // ============================================================
            // HANDLE BUTTON RESPONSE
            // ============================================================

            const isButtonResponse = message?.message?.buttonsResponseMessage;
            if (isButtonResponse) {
                const buttonId = isButtonResponse.selectedButtonId || isButtonResponse.selectedDisplayText || '';
                console.log('[BUTTON] Clicked:', buttonId);

                // ============================================================
                // LISTCMD BUTTONS
                // ============================================================

                if (buttonId === 'listcmd_command') {
                    const fakeText = '.listcmd command/';
                    const parsed = serializer.parseCommand(fakeText, config.prefix);
                    if (parsed) {
                        ctx.args = parsed.args;
                        ctx.text = parsed.text;
                        ctx.commandName = parsed.command;
                    }
                } else if (buttonId === 'listcmd_lib') {
                    const fakeText = '.listcmd lib/';
                    const parsed = serializer.parseCommand(fakeText, config.prefix);
                    if (parsed) {
                        ctx.args = parsed.args;
                        ctx.text = parsed.text;
                        ctx.commandName = parsed.command;
                    }
                } else if (buttonId === 'listcmd_backup') {
                    const fakeText = '.listcmd backup/';
                    const parsed = serializer.parseCommand(fakeText, config.prefix);
                    if (parsed) {
                        ctx.args = parsed.args;
                        ctx.text = parsed.text;
                        ctx.commandName = parsed.command;
                    }
                } else if (buttonId === 'listcmd_scraper') {
                    const fakeText = '.listcmd scraper/';
                    const parsed = serializer.parseCommand(fakeText, config.prefix);
                    if (parsed) {
                        ctx.args = parsed.args;
                        ctx.text = parsed.text;
                        ctx.commandName = parsed.command;
                    }
                }

                // ============================================================
                // GETCMD MENU COMMAND
                // ============================================================

                else if (buttonId === 'getcmd_menu_command') {
                    const commandDir = path.join(process.cwd(), 'command');
                    const fs = await import('fs/promises');
                    
                    const entries = await fs.readdir(commandDir, { withFileTypes: true });
                    const folders = [];
                    let totalFiles = 0;
                    
                    for (const entry of entries) {
                        if (entry.isDirectory()) folders.push(entry.name);
                    }
                    folders.sort();

                    if (folders.length === 0) {
                        await ctx.reply('📁 *command/*\n\nTidak ada folder.');
                        await ctx.react('❌');
                        return;
                    }

                    for (const folder of folders) {
                        const folderPath = path.join(commandDir, folder);
                        const files = await fs.readdir(folderPath);
                        const jsFiles = files.filter(f => f.endsWith('.js'));
                        totalFiles += jsFiles.length;
                    }

                    const sections = [];

                    for (const folder of folders) {
                        const folderPath = path.join(commandDir, folder);
                        const files = await fs.readdir(folderPath);
                        const jsFiles = files.filter(f => f.endsWith('.js')).sort();

                        const rows = jsFiles.map(file => {
                            const fileName = file.replace('.js', '');
                            return {
                                title: `📄 ${file}`,
                                rowId: `getcmd_cmd_${folder}_${fileName}`,
                                description: `File di command/${folder}`
                            };
                        });

                        if (rows.length === 0) {
                            rows.push({
                                title: '📂 Kosong',
                                rowId: `getcmd_cmd_${folder}_empty`,
                                description: `Tidak ada file di ${folder}/`
                            });
                        }

                        sections.push({
                            title: `📁 ${folder}/`,
                            rows: rows
                        });
                    }

                    await sock.sendMessage(jid, {
                        text: '📌 *GETCMD - Pilih File*\n\nPilih file yang ingin dilihat source code-nya:',
                        title: '📁 command/',
                        footer: `📱 Total: ${folders.length} folders, ${totalFiles} files`,
                        buttonText: '📋 Buka Daftar',
                        sections: sections
                    });

                    await ctx.react('✅');
                    return;
                }

                // ============================================================
                // GETCMD MENU LIB
                // ============================================================

                else if (buttonId === 'getcmd_menu_lib') {
                    const libDir = path.join(process.cwd(), 'lib');
                    const fs = await import('fs/promises');
                    
                    const entries = await fs.readdir(libDir, { withFileTypes: true });
                    const jsFiles = [];
                    for (const entry of entries) {
                        if (entry.isFile() && entry.name.endsWith('.js')) {
                            jsFiles.push(entry.name);
                        }
                    }
                    jsFiles.sort();

                    if (jsFiles.length === 0) {
                        await ctx.reply('📁 *lib/*\n\nTidak ada file.');
                        await ctx.react('❌');
                        return;
                    }

                    const rows = jsFiles.map(file => {
                        const fileName = file.replace('.js', '');
                        return {
                            title: `📄 ${file}`,
                            rowId: `getcmd_lib_${fileName}`,
                            description: `File library ${file}`
                        };
                    });

                    const sections = [];
                    const maxRowsPerSection = 10;
                    for (let i = 0; i < rows.length; i += maxRowsPerSection) {
                        const chunk = rows.slice(i, i + maxRowsPerSection);
                        sections.push({
                            title: `📁 File ${Math.floor(i / maxRowsPerSection) + 1}`,
                            rows: chunk
                        });
                    }

                    await sock.sendMessage(jid, {
                        text: '📌 *GETCMD - Pilih File*\n\nPilih file di lib/:',
                        title: '📁 lib/',
                        footer: `📱 Total: ${jsFiles.length} files`,
                        buttonText: '📋 Buka Daftar',
                        sections: sections
                    });

                    await ctx.react('✅');
                    return;
                }

                // ============================================================
                // GETCMD MENU SCRAPER
                // ============================================================

                else if (buttonId === 'getcmd_menu_scraper') {
                    const scraperDir = path.join(process.cwd(), 'scraper');
                    const fs = await import('fs/promises');
                    
                    const entries = await fs.readdir(scraperDir, { withFileTypes: true });
                    const jsFiles = [];
                    for (const entry of entries) {
                        if (entry.isFile() && entry.name.endsWith('.js')) {
                            jsFiles.push(entry.name);
                        }
                    }
                    jsFiles.sort();

                    if (jsFiles.length === 0) {
                        await ctx.reply('📁 *scraper/*\n\nTidak ada file.');
                        await ctx.react('❌');
                        return;
                    }

                    const rows = jsFiles.map(file => {
                        const fileName = file.replace('.js', '');
                        return {
                            title: `📄 ${file}`,
                            rowId: `getcmd_scraper_${fileName}`,
                            description: `File scraper ${file}`
                        };
                    });

                    const sections = [];
                    const maxRowsPerSection = 10;
                    for (let i = 0; i < rows.length; i += maxRowsPerSection) {
                        const chunk = rows.slice(i, i + maxRowsPerSection);
                        sections.push({
                            title: `📁 File ${Math.floor(i / maxRowsPerSection) + 1}`,
                            rows: chunk
                        });
                    }

                    await sock.sendMessage(jid, {
                        text: '📌 *GETCMD - Pilih File*\n\nPilih file scraper yang ingin dilihat:',
                        title: '📁 scraper/',
                        footer: `📱 Total: ${jsFiles.length} files`,
                        buttonText: '📋 Buka Daftar',
                        sections: sections
                    });

                    await ctx.react('✅');
                    return;
                }

                // ============================================================
                // GETCMD OUTPUT BUTTONS
                // ============================================================

                else if (buttonId.startsWith('text_') || buttonId.startsWith('file_')) {
                    const sessionId = buttonId.replace('text_', '').replace('file_', '');
                    
                    global.getcmdSessions = global.getcmdSessions || new Map();
                    const session = global.getcmdSessions.get(sessionId);
                    
                    if (!session) {
                        await ctx.reply('⏳ Session expired. Silakan .getcmd ulang.');
                        return;
                    }

                    const { source, fileName, relativePath, fileSize, totalLines } = session;

                    if (buttonId.startsWith('text_')) {
                        const maxChars = 3800;
                        let text = `📄 *${relativePath}*\n📊 ${totalLines} lines\n📦 ${fileSize} KB\n━━━━━━━━━━━━━━━━━━━━\n\n`;
                        if (source.length > maxChars) {
                            text += source.slice(0, maxChars - 200);
                            text += `\n\n... (${source.length - maxChars + 200} karakter terpotong)`;
                        } else {
                            text += source;
                        }
                        await ctx.reply(text);
                        await ctx.react('✅');
                    } else {
                        await sock.sendMessage(jid, {
                            document: Buffer.from(source, 'utf8'),
                            fileName: fileName,
                            mimetype: 'text/javascript',
                            caption: `📄 *${relativePath}*\n📊 ${totalLines} lines\n📦 ${fileSize} KB`
                        });
                        await ctx.react('✅');
                    }
                    return;
                }
            }

            // ============================================================
            // PARSE COMMAND
            // ============================================================

            if (!isListResponse && !isButtonResponse) {
                const text = ctx.text;
                if (!text) return;

                const parsed = serializer.parseCommand(text, config.prefix);
                if (!parsed) return;

                ctx.args = parsed.args;
                ctx.text = parsed.text;
                ctx.commandName = parsed.command;
            }

            // ============================================================
            // SELF MODE CHECK + MUTE CHECK UNTUK COMMAND
            // ============================================================

            const mode = settings.getValue('mode');

            // CEK APAKAH SENDER DI-MUTE
            if (jid.endsWith('@g.us') && !message.key.fromMe) {
                const cmdSender = this.getSender(message);
                if (database.isMuted(jid, cmdSender)) {
                    console.log(`[MUTE] ⛔ Blocked command from muted user: ${cmdSender}`);
                    try {
                        await sock.sendMessage(jid, { delete: message.key });
                    } catch (e) {}
                    return;
                }
            }

            // SELF MODE CHECK
            if (mode === 'self' && !ctx.isOwner && !message.key.fromMe) {
                console.log(`[SELF] Blocked command from ${sender}`);
                return;
            }

            // ============================================================
            // FIND COMMAND
            // ============================================================

            const cmd = this.#commandLoader.getCommand(ctx.commandName);
            if (!cmd) {
                return;
            }

            ctx.command = cmd;
            await ctx.react('⏳');

            // ============================================================
            // PERMISSION CHECK
            // ============================================================

            const permCheck = await permissions.checkCommandPermissions(ctx, cmd);
            if (!permCheck.allowed) {
                await ctx.reply(permCheck.reason);
                await ctx.react('❌');
                return;
            }

            // ============================================================
            // EXECUTE COMMAND
            // ============================================================

            console.log(`[CMD] ${cmd.name} | ${sender}`);

            try {
                const result = await cmd.execute(ctx);

                // String response
                if (typeof result === 'string' && result.length > 0) {
                    await ctx.reply(result);
                }
                
                // Object response
                else if (result && typeof result === 'object') {
                    const text = result.text || result.message || '';
                    const mentions = result.mentions || [];
                    
                    if (text) {
                        await ctx.send({
                            text: text,
                            mentions: mentions
                        });
                    }
                }

            } catch (error) {
                console.error(`[CMD ERROR] ${cmd.name}:`, error.message);
                await ctx.reply(`❌ ${error.message || 'Terjadi kesalahan'}`);
                await ctx.react('❌');
            }

        } catch (error) {
            console.error('[HANDLER ERROR]', error.message);
        }
    }

    // ============================================================
    // AUTO VN HANDLER
    // ============================================================

    async #handleAutoVn(ctx) {
        const { message, sock, chat } = ctx;
        const hasAudio = message?.message?.audioMessage ||
                        message?.message?.documentMessage ||
                        message?.message?.videoMessage;

        if (!hasAudio) return;

        try {
            const media = await import('./media.js');
            const mediaBuffer = await this.#getMediaFromMessage(message, sock);

            if (mediaBuffer && mediaBuffer.length > 0) {
                const vnBuffer = await media.toVoiceNote(mediaBuffer);
                if (vnBuffer && vnBuffer.length > 0) {
                    await sock.sendMessage(chat, {
                        audio: vnBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    });
                    console.log('[AUTOVN] Voice note sent');
                }
            }
        } catch (error) {
            console.log('[AUTOVN] Error:', error.message);
        }
    }

    // ============================================================
    // MEDIA HELPER
    // ============================================================

    async #getMediaFromMessage(message, sock) {
        try {
            const { downloadMediaMessage } = await import('@chaeulso/baileys');
            const content = message?.message || {};
            let contextInfo = null;

            for (const value of Object.values(content)) {
                if (value && typeof value === 'object' && value.contextInfo) {
                    contextInfo = value.contextInfo;
                    break;
                }
            }

            if (contextInfo) {
                const quotedMsg = contextInfo.quotedMessage;
                if (quotedMsg) {
                    const quotedMsgObj = {
                        key: {
                            remoteJid: message.key.remoteJid,
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant || message.key.participant
                        },
                        message: quotedMsg
                    };
                    try {
                        const buffer = await downloadMediaMessage(
                            quotedMsgObj,
                            'buffer',
                            {},
                            { logger: console, reuploadRequest: sock.updateMediaMessage }
                        );
                        if (buffer && buffer.length > 0) return buffer;
                    } catch (e) {}
                }
            }

            const msgTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            let isMedia = false;
            for (const type of msgTypes) {
                if (content[type]) { isMedia = true; break; }
            }

            if (isMedia) {
                try {
                    const buffer = await downloadMediaMessage(
                        message,
                        'buffer',
                        {},
                        { logger: console, reuploadRequest: sock.updateMediaMessage }
                    );
                    if (buffer && buffer.length > 0) return buffer;
                } catch (e) {}
            }

            return null;
        } catch (error) {
            return null;
        }
    }
}

export default Handler;