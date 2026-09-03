// lib/identity.js
// Identity Resolution System

import config from '../config.js';
import ownerManager from './ownerManager.js';

// ============================================================
// NORMALIZE JID - PUBLIC FUNCTION
// ============================================================

export function normalizeJid(jid) {
    if (!jid) return '';
    return String(jid)
        .trim()
        .replace(/:\d+(?=@)/, '');
}

// ============================================================
// IDENTITY RESOLVER CLASS
// ============================================================

export class IdentityResolver {
    #ownerNumber = null;
    #botJid = null;

    constructor() {
        this.#ownerNumber = this.#normalizeNumber(config.ownerNumber || '');
        console.log('[IDENTITY] Owner Number (config):', this.#ownerNumber);
        console.log('[IDENTITY] Owner Manager loaded');
    }

    // ============================================================
    // SET BOT JID
    // ============================================================

    setBotJid(botJid) {
        this.#botJid = normalizeJid(botJid);
        console.log('[IDENTITY] Bot JID set:', this.#botJid);
    }

    getBotJid() {
        return this.#botJid;
    }

    // ============================================================
    // NORMALIZATION
    // ============================================================

    normalizeJid(jid) {
        return normalizeJid(jid);
    }

    #normalizeNumber(number) {
        if (!number) return '';
        return String(number)
            .replace(/\D/g, '')
            .replace(/^0+/, '');
    }

    #extractNumber(jid) {
        const normalized = normalizeJid(jid);
        if (!normalized) return '';
        const parts = normalized.split('@');
        return this.#normalizeNumber(parts[0]);
    }

    #getJidType(jid) {
        const normalized = normalizeJid(jid);
        if (!normalized) return 'unknown';
        if (normalized.endsWith('@lid')) return 'lid';
        if (normalized.endsWith('@s.whatsapp.net')) return 'pn';
        if (normalized.endsWith('@g.us')) return 'group';
        return 'unknown';
    }

    // ============================================================
    // RESOLUTION
    // ============================================================

    async resolve(jid, sock) {
        const normalized = normalizeJid(jid);
        if (!normalized) {
            return { jid: '', isOwner: false, type: 'unknown' };
        }

        const type = this.#getJidType(normalized);
        const number = this.#extractNumber(normalized);
        const isBot = normalized === this.#botJid || number === this.#extractNumber(this.#botJid);
        
        // ✅ CEK DARI DATABASE OWNER + FALLBACK KE CONFIG
        const isOwnerFromDB = ownerManager.isOwner(normalized) || ownerManager.isOwner(number);
        const isOwnerFromConfig = number === this.#ownerNumber;
        const isOwner = isOwnerFromDB || isOwnerFromConfig || isBot;

        let resolved = {
            jid: normalized,
            type,
            number,
            isOwner,
            isBot,
            isResolved: false,
            pn: null,
            lid: null
        };

        if (type === 'pn' && sock) {
            try {
                const lid = await this.#pnToLid(normalized, sock);
                if (lid) {
                    resolved.lid = lid;
                    resolved.isResolved = true;
                    const lidNumber = this.#extractNumber(lid);
                    if (ownerManager.isOwner(lidNumber) || lidNumber === this.#ownerNumber || lid === this.#botJid) {
                        resolved.isOwner = true;
                    }
                }
            } catch (e) {}
        }

        if (type === 'lid' && sock) {
            try {
                const pn = await this.#lidToPn(normalized, sock);
                if (pn) {
                    resolved.pn = pn;
                    resolved.isResolved = true;
                    const pnNumber = this.#extractNumber(pn);
                    if (ownerManager.isOwner(pnNumber) || pnNumber === this.#ownerNumber || pn === this.#botJid) {
                        resolved.isOwner = true;
                    }
                }
            } catch (e) {}
        }

        return resolved;
    }

    async resolveFromMessage(message, sock) {
        const sender = this.#getSender(message);
        return this.resolve(sender, sock);
    }

    // ============================================================
    // SENDER EXTRACTION
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

        return normalizeJid(sender);
    }

    // ============================================================
    // PN ↔ LID MAPPING
    // ============================================================

    async #lidToPn(lid, sock) {
        try {
            const mapping = sock?.signalRepository?.lidMapping;
            if (mapping && typeof mapping.getPNForLID === 'function') {
                const pn = await mapping.getPNForLID(lid);
                return normalizeJid(pn);
            }
        } catch (e) {}
        return null;
    }

    async #pnToLid(pn, sock) {
        try {
            const mapping = sock?.signalRepository?.lidMapping;
            if (mapping && typeof mapping.getLIDForPN === 'function') {
                const lid = await mapping.getLIDForPN(pn);
                return normalizeJid(lid);
            }
        } catch (e) {}
        return null;
    }

    // ============================================================
    // PARTICIPANT RESOLUTION
    // ============================================================

    findParticipant(metadata, jid) {
        if (!metadata || !Array.isArray(metadata.participants)) {
            return null;
        }

        const target = normalizeJid(jid);
        if (!target) return null;

        const direct = metadata.participants.find(p => {
            const candidates = [
                p?.id, p?.jid, p?.lid, p?.phoneNumber
            ].map(v => normalizeJid(v)).filter(Boolean);
            return candidates.includes(target);
        });

        if (direct) return direct;

        const targetNumber = this.#extractNumber(target);
        if (!targetNumber) return null;

        const byNumber = metadata.participants.find(p => {
            const candidates = [
                p?.phoneNumber, p?.id, p?.jid, p?.lid
            ];
            return candidates.some(v => this.#extractNumber(v) === targetNumber);
        });

        return byNumber || null;
    }

    isAdmin(metadata, jid) {
        const participant = this.findParticipant(metadata, jid);
        if (!participant) return false;
        return participant.admin === 'admin' || participant.admin === 'superadmin';
    }

    // ============================================================
    // OWNER CHECK
    // ============================================================

    async isOwner(jid, sock) {
        const resolved = await this.resolve(jid, sock);
        return resolved.isOwner;
    }

    getOwnerNumber() {
        return this.#ownerNumber;
    }
}

export default new IdentityResolver();