// ai-modules/lib/memoryManager.js
// Manajemen Memory AI dengan SQLite

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../database');
const DB_PATH = path.join(DB_DIR, 'ai_memory.db');

// ============================================================
// INISIALISASI DATABASE
// ============================================================

function ensureDatabase() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH);
    
    db.serialize(() => {
        // Tabel untuk menyimpan memory per user
        db.run(`
            CREATE TABLE IF NOT EXISTS ai_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_jid TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Index untuk mempercepat query
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_user_jid 
            ON ai_memory (user_jid, timestamp)
        `);

        // Tabel untuk menyimpan status mode AI per user
        db.run(`
            CREATE TABLE IF NOT EXISTS ai_settings (
                user_jid TEXT PRIMARY KEY,
                ai_mode INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });

    db.close();
}

// ============================================================
// MEMORY OPERATIONS
// ============================================================

function getHistory(userJid, limit = 20) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.all(
            `SELECT role, content FROM ai_memory 
             WHERE user_jid = ? 
             ORDER BY timestamp DESC LIMIT ?`,
            [userJid, limit],
            (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    const history = (rows || []).reverse();
                    resolve(history);
                }
            }
        );
    });
}

function addMessage(userJid, role, content) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.run(
            `INSERT INTO ai_memory (user_jid, role, content) 
             VALUES (?, ?, ?)`,
            [userJid, role, content],
            function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

function clearHistory(userJid) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.run(
            `DELETE FROM ai_memory WHERE user_jid = ?`,
            [userJid],
            function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
    });
}

// ============================================================
// AI SETTINGS OPERATIONS
// ============================================================

function getAIMode(userJid) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.get(
            `SELECT ai_mode FROM ai_settings WHERE user_jid = ?`,
            [userJid],
            (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.ai_mode : 0);
                }
            }
        );
    });
}

function setAIMode(userJid, mode) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.run(
            `INSERT OR REPLACE INTO ai_settings (user_jid, ai_mode, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [userJid, mode ? 1 : 0],
            function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
    });
}

// ============================================================
// EXPORT
// ============================================================

ensureDatabase();

export default {
    getHistory,
    addMessage,
    clearHistory,
    getAIMode,
    setAIMode
};
