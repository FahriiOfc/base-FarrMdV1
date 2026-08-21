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

export class ConnectionManager {
    #sock = null;
    #state = null;
    #saveCreds = null;
    #sessionPath = null;
    #isShuttingDown = false;
    #isConnecting = false;
    #reconnectAttempts = 0;
    #reconnectTimer = null;
    #loginMethod = null;
    #pairingNumber = null;
    #commandHandler = null;

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

    async #startConnection() {
        if (this.#isShuttingDown) return;
        if (this.#isConnecting) {
            console.log('[SYSTEM] Koneksi sedang berjalan.');
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
            console.log('[SESSION] Session tersimpan ditemukan.');
            console.log('[SESSION] Menggunakan session lama.');
        } else {
            console.log('[SESSION] Session belum ditemukan.');
            console.log('[SESSION] Login pertama diperlukan.');
        }

        console.log('');

        let version = null;
        try {
            const result = await fetchLatestBaileysVersion();
            version = result.version;
            console.log('[BAILEYS] Versi:', version.join('.'));
        } catch (error) {
            console.log('[BAILEYS] Gagal mengambil versi terbaru.');
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
                console.log('[SYSTEM] Menghubungkan ke WhatsApp...');
            }

            if (connection === 'open') {
                this.#isConnecting = false;
                this.#reconnectAttempts = 0;

                // SET BOT JID KE IDENTITY
                const botJid = this.#sock?.user?.id || '';
                if (botJid) {
                    try {
                        const { default: identity } = await import('./identity.js');
                        identity.setBotJid(botJid);
                        console.log('[CONNECTION] Bot JID registered:', botJid);
                    } catch (e) {
                        console.log('[CONNECTION] Failed to set identity:', e.message);
                    }
                }

                console.log('');
                console.log('====================================');
                console.log('       WHATSAPP CONNECTED');
                console.log('====================================');
                console.log('');
                console.log('[SESSION] Session aktif.');
                console.log('[SYSTEM] Bot siap menerima pesan.');
                console.log('');
                console.log('Test command:');
                console.log(`${config.prefix[0]}ping`);
                console.log(`${config.prefix[0]}owner`);
                console.log(`${config.prefix[0]}runtime`);
                console.log(`${config.prefix[0]}menu`);
                console.log('');

                global.sock = this.#sock;
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
                console.log('[STATUS CODE]', statusCode);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('');
                    console.log('[SESSION] WhatsApp melakukan logout.');
                    console.log('[SESSION] Session lama sudah tidak valid.');
                    console.log('[SYSTEM] Hapus folder session/');
                    console.log('[SYSTEM] Kemudian jalankan npm start.');
                    console.log('');
                    return;
                }

                if (statusCode === DisconnectReason.connectionReplaced) {
                    console.log('[SYSTEM] Koneksi digantikan oleh koneksi lain.');
                    console.log('[SYSTEM] Tidak melakukan reconnect.');
                    return;
                }

                if (config.reconnect?.enabled !== true) {
                    console.log('[SYSTEM] Reconnect otomatis dinonaktifkan.');
                    return;
                }

                const maxAttempts = Number(config.reconnect?.maxAttempts || 5);
                if (this.#reconnectAttempts >= maxAttempts) {
                    console.log('[RECONNECT] Batas percobaan tercapai.');
                    return;
                }

                this.#reconnectAttempts++;
                const delay = Number(config.reconnect?.delay || 5000);

                console.log(`[RECONNECT] Percobaan ${this.#reconnectAttempts}/${maxAttempts}`);
                console.log(`[RECONNECT] Menunggu ${delay / 1000} detik...`);

                if (this.#reconnectTimer) {
                    clearTimeout(this.#reconnectTimer);
                }

                this.#reconnectTimer = setTimeout(async () => {
                    this.#reconnectTimer = null;
                    if (this.#isShuttingDown) return;
                    try {
                        await this.#startConnection();
                    } catch (err) {
                        console.error('[RECONNECT ERROR]', err.message);
                    }
                }, delay);
            }
        });

        // ============================================================
        // PAIRING CODE - FIXED
        // ============================================================

        if (!sessionExists && this.#loginMethod === 'pairing') {
            // Cek environment variable
            let phoneNumber = null;
            
            if (process.env.PAIRING_NUMBER) {
                phoneNumber = this.#normalizePhoneNumber(process.env.PAIRING_NUMBER);
                console.log('[PAIRING] Using env PAIRING_NUMBER:', phoneNumber);
            }
            
            // Cek argumen command line
            const args = process.argv.slice(2);
            const pairingIndex = args.indexOf('--pairing');
            if (pairingIndex !== -1 && args[pairingIndex + 1]) {
                phoneNumber = this.#normalizePhoneNumber(args[pairingIndex + 1]);
                console.log('[PAIRING] Using CLI arg:', phoneNumber);
            }
            
            // Jika masih null, minta input manual
            if (!phoneNumber) {
                if (!this.#pairingNumber) {
                    this.#pairingNumber = this.#normalizePhoneNumber(
                        await this.#ask('Masukkan nomor WhatsApp (contoh 628xxxxxxxxxx): ')
                    );
                }
                phoneNumber = this.#pairingNumber;
            }

            if (!phoneNumber) {
                console.log('[PAIRING] Nomor tidak valid.');
                this.#isConnecting = false;
                return;
            }

            try {
                console.log('');
                console.log('[PAIRING] Meminta Pairing Code untuk:', phoneNumber);
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
                console.error('[PAIRING ERROR]', error.message);
                this.#isConnecting = false;
                return;
            }
        }

        return this.#sock;
    }

    async connect() {
        const sessionExists = this.#hasSavedSession();

        if (sessionExists) {
            console.log('');
            console.log('====================================');
            console.log('       SESSION DITEMUKAN');
            console.log('====================================');
            console.log('');
            console.log('[SESSION] Session masih tersimpan.');
            console.log('[SYSTEM] Langsung menghubungkan ke WhatsApp...');
            console.log('');
            this.#loginMethod = null;
        } else {
            console.log('');
            console.log('[SESSION] creds.json tidak ditemukan.');
            console.log('[SYSTEM] Login pertama diperlukan.');
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

        console.log('[SYSTEM] Bot dihentikan dengan aman.');
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