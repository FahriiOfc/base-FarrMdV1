// command/tools/brat.js

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import media from '../../lib/media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(path.dirname(__dirname), '..', 'temp');

export default {
    name: 'brat',
    aliases: ['bs', 'qc'],
    category: 'tools',
    description: 'Generate brat sticker with text',

    async execute(ctx) {
        const { sock, chat } = ctx;
        console.log('[BRAT] ===== START =====');
        
        let textInput = ctx.text || ctx.args.join(' ') || '';

        if (!textInput && ctx.quoted?.text) {
            textInput = ctx.quoted.text;
        }

        if (!textInput || textInput.trim().length === 0) {
            return (
                '❌ Masukkan teks untuk dibuat sticker brat!\n\n' +
                'Contoh:\n' +
                '.brat halo bos\n' +
                '(reply ke pesan juga bisa)'
            );
        }

        console.log('[BRAT] Text:', textInput);
        await ctx.react('⏳');

        try {
            // ============================================================
            // API 1: zaxiusaja
            // ============================================================
            
            let bratUrl = `https://api.zaxiusaja.xyz/maker/brat?text=${encodeURIComponent(textInput)}`;
            console.log('[BRAT] Fetching API 1:', bratUrl);

            let response;
            let pngBuffer;

            try {
                response = await axios.get(bratUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                console.log('[BRAT] API 1 status:', response.status);
                console.log('[BRAT] API 1 size:', response.data?.length || 0);

                pngBuffer = Buffer.from(response.data);
            } catch (api1Error) {
                console.log('[BRAT] API 1 failed:', api1Error.message);
                
                // ============================================================
                // API 2: botcahx (fallback)
                // ============================================================
                
                console.log('[BRAT] Trying API 2 (fallback)...');
                bratUrl = `https://api.botcahx.live/api/brat?text=${encodeURIComponent(textInput)}&apikey=AdminAPI`;
                
                try {
                    response = await axios.get(bratUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    console.log('[BRAT] API 2 status:', response.status);
                    console.log('[BRAT] API 2 size:', response.data?.length || 0);

                    pngBuffer = Buffer.from(response.data);
                } catch (api2Error) {
                    console.log('[BRAT] API 2 failed:', api2Error.message);
                    
                    // ============================================================
                    // API 3: yanzbotz (fallback 2)
                    // ============================================================
                    
                    console.log('[BRAT] Trying API 3 (fallback 2)...');
                    bratUrl = `https://api.yanzbotz.my.id/api/maker/brat?text=${encodeURIComponent(textInput)}`;
                    
                    try {
                        response = await axios.get(bratUrl, {
                            responseType: 'arraybuffer',
                            timeout: 30000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });

                        console.log('[BRAT] API 3 status:', response.status);
                        console.log('[BRAT] API 3 size:', response.data?.length || 0);

                        pngBuffer = Buffer.from(response.data);
                    } catch (api3Error) {
                        console.log('[BRAT] API 3 failed:', api3Error.message);
                        throw new Error('Semua API brat gagal. Coba lagi nanti.');
                    }
                }
            }

            // ============================================================
            // VALIDASI PNG
            // ============================================================

            if (!pngBuffer || pngBuffer.length < 100) {
                throw new Error('Gambar yang diterima terlalu kecil/rusak.');
            }

            const isPNG = pngBuffer.slice(0, 4).toString('hex') === '89504e47';
            console.log('[BRAT] Is PNG:', isPNG);
            
            if (!isPNG) {
                ensureTempDir();
                const debugPath = path.join(TEMP_DIR, `brat_debug_${Date.now()}.jpg`);
                fs.writeFileSync(debugPath, pngBuffer);
                console.log('[BRAT] Saved debug file:', debugPath);
                
                const isJPEG = pngBuffer.slice(0, 2).toString('hex') === 'ffd8';
                if (!isJPEG) {
                    throw new Error('API mengembalikan format bukan gambar (PNG/JPEG)');
                }
            }

            // ============================================================
            // KONVERSI KE STICKER
            // ============================================================

            console.log('[BRAT] Converting to sticker...');
            const webpBuffer = await media.toSticker(pngBuffer);

            if (!webpBuffer || webpBuffer.length === 0) {
                throw new Error('Gagal mengkonversi ke stiker.');
            }

            console.log('[BRAT] Sticker size:', webpBuffer.length);

            // ============================================================
            // KIRIM STICKER SAJA - TANPA CAPTION/TEXT
            // ============================================================

            await sock.sendMessage(chat, {
                sticker: webpBuffer
            });

            await ctx.react('✅');
            console.log('[BRAT] ===== SUCCESS =====');
            
            // TIDAK ADA RETURN TEXT - HANYA STICKER

        } catch (error) {
            console.error('[BRAT] Error:', error.message);
            console.error('[BRAT] Stack:', error.stack);
            await ctx.react('❌');
            return `🛑 Gagal membuat sticker brat.\n\nError: ${error.message}`;
        }
    }
};

// ============================================================
// HELPER ensureTempDir
// ============================================================

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        console.log('[BRAT] Created temp directory');
    }
}