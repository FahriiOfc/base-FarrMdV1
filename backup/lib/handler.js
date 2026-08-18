// lib/handler.js
// Message Handler - Full Code with Listcmd & Getcmd Button Support

import config from '../config.js';
import serializer from './serializer.js';
import permissions from './permissions.js';
import settings from './settings.js';
import * as database from './database.js';
import path from 'path';

export class Handler {
    #commandLoader;

    constructor(commandLoader) {
        this.#commandLoader = commandLoader;
    }

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

            const sender = this.#getSender(message);

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
                if (database.isMuted(jid, sender)) {
                    try {
                        await global.sock?.sendMessage(jid, { delete: message.key });
                    } catch (e) {}
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
            // HANDLE INTERACTIVE LIST RESPONSE
            // ============================================================

            const isListResponse = message?.message?.listResponseMessage;
            if (isListResponse) {
                const rowId = isListResponse.singleSelectReply?.selectedRowId || '';
                if (rowId) {
                    console.log('[LIST] Row ID selected:', rowId);
                    
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
                        return;
                    }
                } else {
                    return;
                }
            }

// ============================================================
// HANDLE BUTTON RESPONSE (LISTCMD & GETCMD) - FULL
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
    }

    // ============================================================
    // GETCMD MENU BUTTONS
    // ============================================================

    else if (buttonId === 'getcmd_menu_command') {
        const commandDir = path.join(process.cwd(), 'command');
        let folders = [];
        try {
            const fs = await import('fs/promises');
            const entries = await fs.readdir(commandDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) folders.push(entry.name);
            }
            folders.sort();
        } catch (e) {
            console.log('[GETCMD] Read command/ error:', e.message);
        }

        if (folders.length === 0) {
            await ctx.reply('📁 *command/*\n\nTidak ada folder.');
            await ctx.react('❌');
            return;
        }

        const headerText = `📁 *command/*\n\n📌 Pilih folder:`;
        const buttons = folders.map(folder => ({
            buttonId: `getcmd_cmd_${folder}`,
            buttonText: { displayText: `📂 ${folder}/` },
            type: 1
        }));

        const buttonGroups = [];
        for (let i = 0; i < buttons.length; i += 3) {
            buttonGroups.push(buttons.slice(i, i + 3));
        }

        for (const group of buttonGroups) {
            await sock.sendMessage(jid, {
                text: headerText,
                footer: `📱 Total: ${folders.length} folders`,
                buttons: group,
                headerType: 1
            });
        }

        await ctx.react('✅');
        return;
    } else if (buttonId === 'getcmd_menu_lib') {
        const libDir = path.join(process.cwd(), 'lib');
        let files = [];
        try {
            const fs = await import('fs/promises');
            const entries = await fs.readdir(libDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.js')) files.push(entry.name);
            }
            files.sort();
        } catch (e) {
            console.log('[GETCMD] Read lib/ error:', e.message);
        }

        if (files.length === 0) {
            await ctx.reply('📁 *lib/*\n\nTidak ada file.');
            await ctx.react('❌');
            return;
        }

        const headerText = `📁 *lib/*\n\n📌 Pilih file:`;
        const buttons = files.map(file => ({
            buttonId: `getcmd_lib_${file}`,
            buttonText: { displayText: `📄 ${file}` },
            type: 1
        }));

        const buttonGroups = [];
        for (let i = 0; i < buttons.length; i += 3) {
            buttonGroups.push(buttons.slice(i, i + 3));
        }

        for (const group of buttonGroups) {
            await sock.sendMessage(jid, {
                text: headerText,
                footer: `📱 Total: ${files.length} files`,
                buttons: group,
                headerType: 1
            });
        }

        await ctx.react('✅');
        return;
    }

    // ============================================================
    // GETCMD FOLDER BUTTONS
    // ============================================================

    else if (buttonId.startsWith('getcmd_cmd_')) {
        const folderName = buttonId.replace('getcmd_cmd_', '');
        const fakeText = `.getcmd command/${folderName}/`;
        const parsed = serializer.parseCommand(fakeText, config.prefix);
        if (parsed) {
            ctx.args = parsed.args;
            ctx.text = parsed.text;
            ctx.commandName = parsed.command;
        }
    }

    // ============================================================
    // GETCMD LIB FILE BUTTONS
    // ============================================================

    else if (buttonId.startsWith('getcmd_lib_')) {
        const fileName = buttonId.replace('getcmd_lib_', '');
        const fakeText = `.getcmd lib/${fileName}`;
        const parsed = serializer.parseCommand(fakeText, config.prefix);
        if (parsed) {
            ctx.args = parsed.args;
            ctx.text = parsed.text;
            ctx.commandName = parsed.command;
        }
    }

    // ============================================================
    // GETCMD OUTPUT BUTTONS (TIDAK HAPUS SESSION)
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
        
        // SESSION TETAP ADA - TIDAK DIHAPUS

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
            // PARSE COMMAND (dari text biasa)
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
            // SELF MODE CHECK
            // ============================================================

            const mode = settings.getValue('mode');

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

                if (typeof result === 'string' && result.length > 0) {
                    await ctx.reply(result);
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

    // ============================================================
    // SENDER HELPER
    // ============================================================

    #getSender(message) {
        if (!message) return '';
        const key = message.key || {};
        let sender = '';

        if (key.remoteJid && key.remoteJid.endsWith('@g.us')) {
            sender = key.participantAlt || key.participant || '';
        } else {
            sender = key.remoteJidAlt || key.remoteJid || '';
        }

        return sender;
    }
}

export default Handler;