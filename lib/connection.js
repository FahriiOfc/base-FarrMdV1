// lib/connection.js
// Connection Manager for @chaeulso/baileys

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion
} from '@chaeulso/baileys';

import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import readline from 'readline';

import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

const logger = pino({ level: 'silent' });

// ============================================================
// UTILITY: FORMAT WAKTU REAL TIME
// ============================================================

function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
}

function logWithTime(message) {
    console.log(`${getCurrentTimestamp()} ${message}`);
}

// ============================================================
// CONNECTION MANAGER
// ============================================================

export class ConnectionManager {
    #sock = null;
    #state = null;
    #saveCreds = null;
    #sessionPath = null;
    #isShuttingDown = false;
    #isConnecting = false;
    #reconnectAttempts = 0;
    #totalReconnects = 0;
    #reconnectTimer = null;
    #loginMethod = null;
    #pairingNumber = null;
    #commandHandler = null;
    #startTime = Date.now();
    #messageHandler = null; // SIMPAN REFERENCE LISTENER

    constructor() {
        this.#sessionPath = path.join(PROJECT_ROOT, config.sessionName || 'auth');
        this.#ensureSessionDirectory();
    }

    #ensureSessionDirectory() {
        if (!fs.existsSync(this.#sessionPath)) {
            fs.mkdirSync(this.#sessionPath, { recursive: true });
        }
    }

    #hasSavedSession() {
        return fs.existsSync(path.join(this.#sessionPath, 'creds.json'));
    }

    #normalizePhoneNumber(number) {
        return String(number || '')
            .replace(/\D/g, '')
            .replace(/^0+/, '');
    }

    #ask(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise(resolve => {
            rl.question(question, answer => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }

    async #selectLoginMethod() {
        console.log('');
        console.log('====================================');
        console.log('       FARRMD V1 - CONNECTION');
        console.log('====================================');
        console.log('');
        console.log('[1] Login dengan QR Code');
        console.log('[2] Login dengan Pairing Code');
        console.log('');

        while (true) {
            const choice = await this.#ask('Pilih metode login [1/2]: ');
            if (choice === '1') return 'qr';
            if (choice === '2') return 'pairing';
            console.log('');
            console.log('[SYSTEM] Pilihan tidak valid.');
            console.log('');
        }
    }

    // ============================================================
    // ATTACH MESSAGE HANDLER - FIXED
    // ============================================================

    #attachMessageHandler() {
        if (!this.#sock) return;

        // HAPUS LISTENER LAMA (JIKA ADA)
        if (this.#messageHandler) {
            try {
                this.#sock.ev.off('messages.upsert', this.#messageHandler);
            } catch (e) {
                // Abaikan error
            }
        }

        // BUAT LISTENER BARU
        this.#messageHandler = async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const message of messages) {
                try {
                    await this.#commandHandler?.handleMessage(message);
                } catch (error) {
                    console.error('[HANDLER ERROR]', error.message);
                }
            }
        };

        // PASANG LISTENER
        this.#sock.ev.on('messages.upsert', this.#messageHandler);

        logWithTime('[CONNECTION] Message handler attached to new socket');
    }

    // ============================================================
    // START CONNECTION
    // ============================================================

    async #startConnection() {
        if (this.#isShuttingDown) return;
        if (this.#isConnecting) {
            logWithTime('[SYSTEM] Koneksi sedang berjalan.');
            return;
        }

        this.#isConnecting = true;
        this.#ensureSessionDirectory();

        console.log('');
        console.log('====================================');
        console.log('      STARTING CONNECTION');
        console.log('====================================');
        console.log('');

        const { state, saveCreds } = await useMultiFileAuthState(this.#sessionPath);
        this.#state = state;
        this.#saveCreds = saveCreds;

        const sessionExists = this.#hasSavedSession();

        if (sessionExists) {
            logWithTime('[SESSION] Session tersimpan ditemukan.');
            logWithTime('[SESSION] Menggunakan session lama.');
        } else {
            logWithTime('[SESSION] Session belum ditemukan.');
            logWithTime('[SESSION] Login pertama diperlukan.');
        }

        console.log('');

        let version = null;
        try {
            const result = await fetchLatestBaileysVersion();
            version = result.version;
            logWithTime(`[BAILEYS] Versi: ${version.join('.')}`);
        } catch (error) {
            logWithTime('[BAILEYS] Gagal mengambil versi terbaru.');
        }

        console.log('');

        const socketConfig = {
            auth: state,
            logger,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        };

        if (version) {
            socketConfig.version = version;
        }

        this.#sock = makeWASocket(socketConfig);

        this.#sock.ev.on('creds.update', saveCreds);

        this.#sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !sessionExists && this.#loginMethod === 'qr') {
                console.log('');
                console.log('====================================');
                console.log('             QR CODE');
                console.log('====================================');
                console.log('');

                const qrcode = (await import('qrcode-terminal')).default;
                qrcode.generate(qr, { small: true });

                console.log('');
                console.log('Scan QR menggunakan WhatsApp.');
                console.log('');
            }

            if (connection === 'connecting') {
                logWithTime('[SYSTEM] Menghubungkan ke WhatsApp...');
            }

            if (connection === 'open') {
                this.#isConnecting = false;
                this.#reconnectAttempts = 0;

                const botJid = this.#sock?.user?.id || '';
                if (botJid) {
                    try {
                        const { default: identity } = await import('./identity.js');
                        identity.setBotJid(botJid);
                        logWithTime(`[CONNECTION] Bot JID registered: ${botJid}`);
                    } catch (e) {
                        logWithTime(`[CONNECTION] Failed to set identity: ${e.message}`);
                    }
                }

                global.sock = this.#sock;

                // PASANG ULANG MESSAGE HANDLER
                this.#attachMessageHandler();

                console.log('');
                console.log('====================================');
                console.log('       WHATSAPP CONNECTED');
                console.log('====================================');
                console.log('');
                logWithTime('[SESSION] Session aktif.');
                logWithTime('[SYSTEM] Bot siap menerima pesan.');

                const uptimeSeconds = Math.floor((Date.now() - this.#startTime) / 1000);
                const uptimeMinutes = Math.floor(uptimeSeconds / 60);
                const uptimeHours = Math.floor(uptimeMinutes / 60);
                const uptimeStr = uptimeHours > 0
                    ? `${uptimeHours} jam ${uptimeMinutes % 60} menit`
                    : `${uptimeMinutes} menit`;

                if (this.#totalReconnects === 0) {
                    logWithTime('FIRST START - Bot berjalan sejak awal');
                } else {
                    logWithTime(`RECONNECT #${this.#totalReconnects} - Berhasil reconnect`);
                }
                logWithTime(`Total uptime: ${uptimeStr}`);
                logWithTime(`Terakhir restart: ${getCurrentTimestamp()}`);
                logWithTime(`Total reconnect: ${this.#totalReconnects} kali`);

                console.log('');
                console.log('Test command:');
                console.log(`${config.prefix[0]}ping`);
                console.log(`${config.prefix[0]}owner`);
                console.log(`${config.prefix[0]}runtime`);
                console.log(`${config.prefix[0]}menu`);
                console.log('');
            }

            if (connection === 'close') {
                this.#isConnecting = false;

                if (this.#isShuttingDown) return;

                const error = lastDisconnect?.error;
                const statusCode = new Boom(error)?.output?.statusCode;

                console.log('');
                console.log('====================================');
                console.log('       CONNECTION CLOSED');
                console.log('====================================');
                console.log('');
                logWithTime(`[STATUS CODE] ${statusCode}`);
                logWithTime(`Waktu kejadian: ${getCurrentTimestamp()}`);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('');
                    logWithTime('[SESSION] WhatsApp melakukan logout.');
                    logWithTime('[SESSION] Session lama sudah tidak valid.');
                    logWithTime('[SYSTEM] Hapus folder session/');
                    logWithTime('[SYSTEM] Kemudian jalankan npm start.');
                    console.log('');
                    return;
                }

                if (statusCode === DisconnectReason.connectionReplaced) {
                    logWithTime('[SYSTEM] Koneksi digantikan oleh koneksi lain.');
                    logWithTime('[SYSTEM] Tidak melakukan reconnect.');
                    return;
                }

                if (config.reconnect?.enabled !== true) {
                    logWithTime('[SYSTEM] Reconnect otomatis dinonaktifkan.');
                    return;
                }

                const maxAttempts = Number(config.reconnect?.maxAttempts || 5);
                if (this.#reconnectAttempts >= maxAttempts) {
                    logWithTime(`[RECONNECT] Batas percobaan tercapai (${maxAttempts}).`);
                    return;
                }

                this.#reconnectAttempts++;
                this.#totalReconnects++;
                const delay = Number(config.reconnect?.delay || 5000);

                logWithTime(`[RECONNECT] Percobaan ${this.#reconnectAttempts}/${maxAttempts}`);
                logWithTime(`[RECONNECT] Menunggu ${delay / 1000} detik...`);
                logWithTime(`[RECONNECT] Total reconnect: ${this.#totalReconnects} kali`);

                if (this.#reconnectTimer) {
                    clearTimeout(this.#reconnectTimer);
                }

                this.#reconnectTimer = setTimeout(async () => {
                    this.#reconnectTimer = null;
                    if (this.#isShuttingDown) return;
                    try {
                        await this.#startConnection();
                    } catch (err) {
                        logWithTime(`[RECONNECT ERROR] ${err.message}`);
                    }
                }, delay);
            }
        });

        // ============================================================
        // PAIRING CODE
        // ============================================================

        if (!sessionExists && this.#loginMethod === 'pairing') {
            let phoneNumber = null;

            if (process.env.PAIRING_NUMBER) {
                phoneNumber = this.#normalizePhoneNumber(process.env.PAIRING_NUMBER);
                logWithTime(`[PAIRING] Using env PAIRING_NUMBER: ${phoneNumber}`);
            }

            const args = process.argv.slice(2);
            const pairingIndex = args.indexOf('--pairing');
            if (pairingIndex !== -1 && args[pairingIndex + 1]) {
                phoneNumber = this.#normalizePhoneNumber(args[pairingIndex + 1]);
                logWithTime(`[PAIRING] Using CLI arg: ${phoneNumber}`);
            }

            if (!phoneNumber) {
                if (!this.#pairingNumber) {
                    this.#pairingNumber = this.#normalizePhoneNumber(
                        await this.#ask('Masukkan nomor WhatsApp (contoh 628xxxxxxxxxx): ')
                    );
                }
                phoneNumber = this.#pairingNumber;
            }

            if (!phoneNumber) {
                logWithTime('[PAIRING] Nomor tidak valid.');
                this.#isConnecting = false;
                return;
            }

            try {
                console.log('');
                logWithTime(`[PAIRING] Meminta Pairing Code untuk: ${phoneNumber}`);
                const code = await this.#sock.requestPairingCode(phoneNumber);

                console.log('');
                console.log('====================================');
                console.log('          PAIRING CODE');
                console.log('====================================');
                console.log('');
                console.log(code);
                console.log('');
                console.log('Masukkan kode di WhatsApp > Perangkat Tertaut.');
                console.log('');
            } catch (error) {
                logWithTime(`[PAIRING ERROR] ${error.message}`);
                this.#isConnecting = false;
                return;
            }
        }

        return this.#sock;
    }

    // ============================================================
    // CONNECT (PUBLIC)
    // ============================================================

    async connect() {
        const sessionExists = this.#hasSavedSession();

        if (sessionExists) {
            console.log('');
            console.log('====================================');
            console.log('       SESSION DITEMUKAN');
            console.log('====================================');
            console.log('');
            logWithTime('[SESSION] Session masih tersimpan.');
            logWithTime('[SYSTEM] Langsung menghubungkan ke WhatsApp...');
            console.log('');
            this.#loginMethod = null;
        } else {
            console.log('');
            logWithTime('[SESSION] creds.json tidak ditemukan.');
            logWithTime('[SYSTEM] Login pertama diperlukan.');
            this.#loginMethod = await this.#selectLoginMethod();
        }

        return this.#startConnection();
    }

    getSocket() {
        return this.#sock;
    }

    async shutdown() {
        if (this.#isShuttingDown) return;
        this.#isShuttingDown = true;

        if (this.#reconnectTimer) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = null;
        }

        try {
            if (this.#sock) {
                this.#sock.end(undefined);
            }
        } catch {}

        logWithTime('[SYSTEM] Bot dihentikan dengan aman.');
        process.exit(0);
    }

    setCommandHandler(handler) {
        this.#commandHandler = handler;
    }

    getCommandHandler() {
        return this.#commandHandler;
    }
}

export default ConnectionManager;
