// ai-modules/lib/aiHandler.js
// Handler khusus untuk AI

import aiService from './aiService.js';
import AI_CONFIG from './aiConfig.js';
import commandMatcher from './commandMatcher.js';

export class AIHandler {
    constructor() {
        this.aiService = aiService;
        this.config = AI_CONFIG;
        console.log('[AI-HANDLER] ✅ AI Handler initialized');
    }

    // ============================================================
    // CEK APAKAH HARUS DIPROSES OLEH AI
    // ============================================================

    async shouldProcess(ctx) {
        const { sender, jid, text, sock, message } = ctx;

        const safeText = typeof text === 'string' ? text : '';
        if (!safeText || safeText.length === 0) return false;

        if (jid.endsWith('@g.us')) {
            const isBlGrup = await this.#isGroupBlacklisted(jid);
            if (isBlGrup) return false;
        }

        const isBlUser = await this.#isUserBlacklisted(sender);
        if (isBlUser) return false;

        const isCommand = this.#isCommand(safeText);
        if (isCommand) return false;

        const isAIActive = await this.aiService.isAIModeActive(sender);
        if (!isAIActive) return false;

        const isPrivate = !jid.endsWith('@g.us');
        const isMentioned = this.#isMentioned(message, sock);

        return isPrivate || isMentioned;
    }

    // ============================================================
    // PROSES PESAN DENGAN AI
    // ============================================================

    async process(ctx) {
        const { sender, jid, sock, text, message, react } = ctx;

        // ============================================================
        // 🔥 LOG UNTUK DEBUG
        // ============================================================
        console.log('[AI-HANDLER] ===== DEBUG =====');
        console.log('[AI-HANDLER] TEXT TYPE:', typeof text);
        console.log('[AI-HANDLER] TEXT VALUE:', text);
        console.log('[AI-HANDLER] TEXT JSON:', JSON.stringify(text));
        console.log('[AI-HANDLER] =================');

        const safeText = typeof text === 'string' ? text : String(text || '');
        
        console.log('[AI-HANDLER] SAFE TEXT:', safeText);
        console.log('[AI-HANDLER] =================');

        console.log(`[AI-HANDLER] 🤖 Processing from ${sender}`);
        await react?.('🤖');

        try {
            const matched = safeText.length > 0 
                ? await commandMatcher.matchCommand(safeText) 
                : null;

            if (matched) {
                console.log(`[AI-HANDLER] 🎯 Matched command: ${matched.name}`);
                
                const permCheck = await commandMatcher.checkPermissions(ctx, matched);
                if (!permCheck.allowed) {
                    await sock.sendMessage(jid, {
                        text: permCheck.reason,
                        contextInfo: { mentionedJid: [sender] }
                    });
                    await react?.('❌');
                    return true;
                }

                const result = await this.#executeCommand(ctx, matched);
                if (result) {
                    await react?.('✅');
                    return true;
                }
            }

            console.log(`[AI-HANDLER] 💬 Chatting with AI...`);
            const response = await this.aiService.chatWithAI(sender, safeText);

            await sock.sendMessage(jid, {
                text: response,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 0,
                    isForwarded: false
                }
            });

            await react?.('✅');
            return true;

        } catch (error) {
            console.error('[AI-HANDLER] Error:', error.message);
            await react?.('❌');
            
            await sock.sendMessage(jid, {
                text: `❌ *AI Error*\n\n> ${error.message}\n\nCoba lagi nanti ya!`,
                contextInfo: { mentionedJid: [sender] }
            });
            
            return false;
        }
    }

    // ============================================================
    // EXECUTE COMMAND
    // ============================================================

    async #executeCommand(ctx, matched) {
        try {
            const commandLoader = global.commandLoader;
            if (!commandLoader) return false;

            const cmd = commandLoader.getCommand(matched.name);
            if (!cmd) return false;

            const modifiedCtx = {
                ...ctx,
                args: matched.args || [],
                text: matched.args?.join(' ') || '',
                commandName: matched.name,
                command: cmd
            };

            await cmd.execute(modifiedCtx);
            return true;

        } catch (error) {
            console.error('[AI-HANDLER] Command error:', error.message);
            return false;
        }
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    #isCommand(text) {
        const prefixes = this.config.prefixes || ['.', '!', '#'];
        return prefixes.some(p => text.trim().startsWith(p));
    }

    #isMentioned(message, sock) {
        try {
            const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
            if (!contextInfo) return false;
            
            const mentionedJid = contextInfo.mentionedJid || [];
            const botJid = sock?.user?.id || '';
            
            return mentionedJid.some(jid => jid === botJid || jid.includes(botJid.split(':')[0]));
        } catch (e) {
            return false;
        }
    }

    async #isGroupBlacklisted(jid) {
        try {
            const { isBlGrup } = await import('../../lib/database.js');
            return isBlGrup(jid);
        } catch (e) {
            return false;
        }
    }

    async #isUserBlacklisted(jid) {
        try {
            const { isBlUser } = await import('../../lib/database.js');
            return isBlUser(jid);
        } catch (e) {
            return false;
        }
    }
}

export default new AIHandler();