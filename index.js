// index.js
// FarrMdV1 - Entry Point

import ConnectionManager from './lib/connection.js';
import CommandLoader from './lib/commandLoader.js';
import Handler from './lib/handler.js';
import config from './config.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('');
console.log('====================================');
console.log('       FARRMD V1');
console.log('       ESM ARCHITECTURE');
console.log('====================================');
console.log('');

// ============================================================
// SHUTDOWN HANDLERS
// ============================================================

let connectionManager = null;

async function shutdown(signal) {
    console.log('');
    console.log(`[${signal}] Menghentikan bot...`);
    if (connectionManager) {
        await connectionManager.shutdown();
    }
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ============================================================
// MAIN
// ============================================================

async function main() {
    try {
        // 1. Load commands
        const commandLoader = new CommandLoader();
        await commandLoader.scanCommands();
        const commands = commandLoader.getCommands();

        // Store global reference for dynamic commands
        global.commandLoader = commandLoader;

        console.log(`[SYSTEM] Loaded ${commands.size} commands`);

        // 2. Create handler
        const handler = new Handler(commandLoader);

        // 3. Connect to WhatsApp
        connectionManager = new ConnectionManager();
        const sock = await connectionManager.connect();

        if (!sock) {
            console.error('[FATAL] Failed to connect');
            process.exit(1);
        }

        // 4. Set handler reference
        connectionManager.setCommandHandler(handler);

        // 5. Set global sock
        global.sock = sock;

        // 6. SET BOT JID KE IDENTITY
        const { default: identity } = await import('./lib/identity.js');
        const botJid = sock?.user?.id || '';
        if (botJid) {
            identity.setBotJid(botJid);
            console.log('[INDEX] Bot JID registered:', botJid);
        }

        // 7. Message handler
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const message of messages) {
                try {
                    await handler.handleMessage(message);
                } catch (error) {
                    console.error('[HANDLER ERROR]', error.message);
                }
            }
        });

        // 8. Keep process alive
        console.log('[SYSTEM] Bot is running');

    } catch (error) {
        console.error('[FATAL ERROR]', error);
        process.exit(1);
    }
}

main();