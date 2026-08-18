// lib/serializer.js
// Message Serializer - Normalize Baileys messages to Context

import identity from './identity.js';
import permissions from './permissions.js';

export class Serializer {
    #identity;
    #permissions;

    constructor() {
        this.#identity = identity;
        this.#permissions = permissions;
    }

    async serialize(message, sock) {
        if (!message || !message.key) {
            throw new Error('Invalid message');
        }

        const jid = message.key.remoteJid;
        if (!jid) {
            throw new Error('No remote JID');
        }

        // ============================================================
        // BASIC INFO
        // ============================================================

        const sender = this.#getSender(message);
        const pushName = message.pushName || 'User';
        const isGroup = jid.endsWith('@g.us');
        const fromMe = message.key.fromMe === true;

        // ============================================================
        // OWNER CHECK - DENGAN LOGGING
        // ============================================================

        const isOwner = await this.#permissions.isOwner(sender, sock);
        
        // LOG UNTUK DEBUG
        console.log('[SERIALIZER] Sender:', sender);
        console.log('[SERIALIZER] isOwner:', isOwner);
        console.log('[SERIALIZER] isGroup:', isGroup);
        console.log('[SERIALIZER] fromMe:', fromMe);

        // ============================================================
        // GROUP METADATA
        // ============================================================

        let metadata = null;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            metadata = await this.#permissions.getGroupMetadata(sock, jid);
            if (metadata) {
                isAdmin = this.#permissions.isAdmin(metadata, sender);
                const botJid = this.#getBotJid(sock);
                isBotAdmin = this.#permissions.isAdmin(metadata, botJid);
            }
        }

        // ============================================================
        // MESSAGE CONTENT
        // ============================================================

        const text = this.#getMessageText(message);
        const messageKey = message.key;
        const messageId = messageKey.id;

        // ============================================================
        // QUOTED MESSAGE
        // ============================================================

        let quoted = null;
        let quotedMessage = null;

        const contextInfo = this.#getContextInfo(message);
        if (contextInfo && contextInfo.quotedMessage) {
            quotedMessage = contextInfo.quotedMessage;
            quoted = {
                key: {
                    remoteJid: jid,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant || sender,
                    fromMe: contextInfo.participant ? false : fromMe
                },
                message: quotedMessage,
                sender: contextInfo.participant || sender,
                text: this.#getMessageText({ message: quotedMessage })
            };
        }

        // ============================================================
        // MENTIONS
        // ============================================================

        const mentionedJid = contextInfo?.mentionedJid || [];

        // ============================================================
        // CONTEXT OBJECT
        // ============================================================

        const ctx = {
            // Raw
            sock,
            message,
            messageKey,
            messageId,

            // Identities
            chat: jid,
            sender,
            pushName,
            isGroup,
            fromMe,

            // Permissions
            isOwner,
            isAdmin,
            isBotAdmin,
            metadata,

            // Content
            text,
            args: [],
            command: null,
            commandName: null,

            // Quoted
            quoted,
            quotedMessage,

            // Mentions
            mentionedJid,

            // Command loader reference
            commandLoader: global.commandLoader || null,

            // Helpers
            reply: async (text, options = {}) => {
                return sock.sendMessage(jid, {
                    text: String(text),
                    ...options
                });
            },
            send: async (content, options = {}) => {
                return sock.sendMessage(jid, content, options);
            },
            react: async (emoji) => {
                try {
                    await sock.sendMessage(jid, {
                        react: { text: emoji, key: messageKey }
                    });
                } catch (e) {
                    // Silent fail
                }
            },
            delete: async (targetKey) => {
                try {
                    await sock.sendMessage(jid, { delete: targetKey || messageKey });
                } catch (e) {
                    // Silent fail
                }
            },

            // Resolve target
            resolveTarget: () => {
                return this.#permissions.resolveTarget(message);
            },

            // Identity
            identity: this.#identity,

            // getMediaFromMessage - will be overridden by handler
            getMediaFromMessage: null
        };

        return ctx;
    }

    // ============================================================
    // HELPERS
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

        const normalized = this.#identity.normalizeJid(sender);
        console.log('[SERIALIZER] Raw sender:', sender, '→ Normalized:', normalized);
        return normalized;
    }

    #getBotJid(sock) {
        if (!sock?.user) return '';
        return this.#identity.normalizeJid(sock.user.id) || sock.user.id || '';
    }

    #getMessageText(message) {
        const msg = message?.message;
        if (!msg) return '';

        return (
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.documentMessage?.caption ||
            ''
        ).trim();
    }

    #getContextInfo(message) {
        const content = message?.message || {};
        for (const value of Object.values(content)) {
            if (value && typeof value === 'object' && value.contextInfo) {
                return value.contextInfo;
            }
        }
        return null;
    }

    // ============================================================
    // PARSE COMMAND
    // ============================================================

    parseCommand(text, prefixes) {
        if (!text) return null;

        const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes || '.'];
        const prefix = prefixList.find(v => text.startsWith(v));

        if (!prefix) return null;

        const body = text.slice(prefix.length).trim();
        if (!body) return null;

        const split = body.split(/\s+/);
        const command = split.shift().toLowerCase();

        return {
            prefix,
            command,
            args: split,
            text: split.join(' ')
        };
    }
}

export default new Serializer();