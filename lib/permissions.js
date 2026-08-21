// lib/permissions.js
// Centralized Permission System

import identity from './identity.js';
import config from '../config.js';

export class PermissionManager {
    #identity;

    constructor() {
        this.#identity = identity;
    }

    // ============================================================
    // OWNER CHECK
    // ============================================================

    async isOwner(jid, sock) {
        return this.#identity.isOwner(jid, sock);
    }

    async isOwnerFromMessage(message, sock) {
        const sender = this.#getSender(message);
        return this.isOwner(sender, sock);
    }

    // ============================================================
    // ADMIN CHECKS
    // ============================================================

    isAdmin(metadata, jid) {
        return this.#identity.isAdmin(metadata, jid);
    }

    isBotAdmin(metadata, sock) {
        const botJid = this.#getBotJid(sock);
        if (!botJid) return false;
        return this.isAdmin(metadata, botJid);
    }

    // ============================================================
    // PERMISSION CHECK FOR COMMANDS
    // ============================================================

    async checkCommandPermissions(ctx, command) {
        const { isGroup, isOwner, isAdmin, isBotAdmin, fromMe, sender } = ctx;

        // LOG UNTUK DEBUG
        console.log('[PERMISSION] Command:', command.name);
        console.log('[PERMISSION] isOwner:', isOwner);
        console.log('[PERMISSION] fromMe:', fromMe);
        console.log('[PERMISSION] sender:', sender);
        console.log('[PERMISSION] ownerOnly:', command.ownerOnly);

        // Owner only commands - PERBAIKAN: fromMe juga dianggap owner
        if (command.ownerOnly && !isOwner && !fromMe) {
            return { allowed: false, reason: '❌ Command ini hanya untuk Owner.' };
        }

        // Jika fromMe true, izinkan semua command (bot sendiri)
        if (fromMe) {
            return { allowed: true };
        }

        // Admin only commands (in groups)
        if (command.adminOnly && !isOwner) {
            if (!isGroup) {
                return { allowed: false, reason: '❌ Command ini hanya dapat digunakan di grup.' };
            }
            if (!isAdmin) {
                return { allowed: false, reason: '❌ Hanya admin grup yang dapat menggunakan command ini.' };
            }
        }

        // Bot admin required
        if (command.botAdmin && !isOwner) {
            if (!isGroup) {
                return { allowed: false, reason: '❌ Command ini hanya dapat digunakan di grup.' };
            }
            if (!isBotAdmin) {
                return { allowed: false, reason: '❌ Bot harus menjadi admin terlebih dahulu.' };
            }
        }

        // Group only
        if (command.groupOnly && !isGroup) {
            return { allowed: false, reason: '❌ Command ini hanya dapat digunakan di grup.' };
        }

        return { allowed: true };
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

        return this.#identity.normalizeJid(sender);
    }

    #getBotJid(sock) {
        if (!sock?.user) return '';
        return this.#identity.normalizeJid(sock.user.id) || sock.user.id || '';
    }

    // ============================================================
    // GET GROUP METADATA
    // ============================================================

    async getGroupMetadata(sock, jid) {
        if (!sock || !jid || !jid.endsWith('@g.us')) {
            return null;
        }
        try {
            return await sock.groupMetadata(jid);
        } catch (error) {
            console.log('[GROUP METADATA ERROR]', error?.message || error);
            return null;
        }
    }

    // ============================================================
    // RESOLVE TARGET
    // ============================================================

    resolveTarget(message) {
        if (!message?.message) return null;

        const content = message.message;
        let contextInfo = null;

        for (const value of Object.values(content)) {
            if (value && typeof value === 'object' && value.contextInfo) {
                contextInfo = value.contextInfo;
                break;
            }
        }

        if (!contextInfo) return null;
        let target = null;

        // 1. Mention
        if (Array.isArray(contextInfo.mentionedJid) && contextInfo.mentionedJid.length) {
            target = contextInfo.mentionedJid[0];
        }

        // 2. Participant (Reply)
        if (!target && contextInfo.participant) {
            target = contextInfo.participant;
        }

        if (target) {
            target = this.#identity.normalizeJid(target);
            if (!target.includes('@')) {
                const cleanNumber = target.replace(/\D/g, '');
                if (cleanNumber.length >= 10) {
                    target = cleanNumber + '@s.whatsapp.net';
                }
            }
            return target;
        }

        return null;
    }
}

export default new PermissionManager();