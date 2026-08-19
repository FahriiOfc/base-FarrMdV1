// lib/media.js
// Media Processing - Full Stable with Better Detection

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '..', 'temp');

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
}

function cleanupTempFiles(pattern) {
    try {
        if (!fs.existsSync(TEMP_DIR)) return;
        const files = fs.readdirSync(TEMP_DIR);
        for (const file of files) {
            if (file.includes(pattern)) {
                const filePath = path.join(TEMP_DIR, file);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch (e) {}
                }
            }
        }
    } catch (error) {}
}

// ============================================================
// DETECT FILE TYPE - SUPER ROBUST
// ============================================================

function detectFileTypeSync(buffer) {
    if (!buffer || buffer.length < 4) return null;
    
    const hex = buffer.slice(0, 12).toString('hex').toLowerCase();
    const ascii = buffer.slice(0, 12).toString('ascii');
    
    console.log('[MEDIA] Detect - hex:', hex.slice(0, 16));
    console.log('[MEDIA] Detect - ascii:', ascii);

    // PNG
    if (hex.startsWith('89504e47')) {
        return { ext: 'png', mime: 'image/png' };
    }
    // JPEG
    if (hex.startsWith('ffd8ff')) {
        return { ext: 'jpg', mime: 'image/jpeg' };
    }
    // GIF
    if (hex.startsWith('47494638')) {
        return { ext: 'gif', mime: 'image/gif' };
    }
    // WEBP
    if (hex.startsWith('52494646') && ascii.slice(8, 12) === 'WEBP') {
        return { ext: 'webp', mime: 'image/webp' };
    }
    // BMP
    if (hex.startsWith('424d')) {
        return { ext: 'bmp', mime: 'image/bmp' };
    }
    // MP4
    if (hex.startsWith('000000') && ascii.slice(4, 8) === 'ftyp') {
        return { ext: 'mp4', mime: 'video/mp4' };
    }
    // MP3 (ID3)
    if (hex.startsWith('494433')) {
        return { ext: 'mp3', mime: 'audio/mpeg' };
    }
    // OGG
    if (hex.startsWith('4f676753')) {
        return { ext: 'ogg', mime: 'audio/ogg' };
    }
    // WAV
    if (hex.startsWith('52494646') && ascii.slice(8, 12) === 'WAVE') {
        return { ext: 'wav', mime: 'audio/wav' };
    }
    // M4A / AAC
    if (hex.startsWith('000000') && ascii.slice(4, 8) === 'ftyp') {
        return { ext: 'm4a', mime: 'audio/mp4' };
    }
    
    return null;
}

// ============================================================
// TO STICKER - DENGAN FALLBACK KE JPEG
// ============================================================

export async function toSticker(buffer, options = {}) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `sticker_${timestamp}`);
    const outputFile = `${tempFile}.webp`;
    const cleanupPattern = `sticker_${timestamp}`;

    try {
        console.log('[MEDIA] ===== START toSticker =====');
        console.log('[MEDIA] Buffer size:', buffer?.length || 0);

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        // ============================================================
        // DETEKSI FORMAT
        // ============================================================

        let type = detectFileTypeSync(buffer);
        
        if (!type) {
            console.log('[MEDIA] Format tidak dikenali, coba treat sebagai JPEG...');
            // Coba tulis sebagai JPEG dan konversi
            const inputFile = `${tempFile}.jpg`;
            fs.writeFileSync(inputFile, buffer);
            console.log('[MEDIA] Written as JPG, size:', fs.statSync(inputFile).size);
            
            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-c:v', 'libwebp',
                        '-q:v', '80'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg (fallback):', cmd))
                    .on('end', () => { console.log('[MEDIA] Sticker success (fallback)'); resolve(); })
                    .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                    .run();
            });

            const stickerBuffer = fs.readFileSync(outputFile);
            cleanupTempFiles(cleanupPattern);
            console.log('[MEDIA] Sticker size:', stickerBuffer.length);
            return stickerBuffer;
        }

        console.log('[MEDIA] Detected:', type.ext, type.mime);

        // ============================================================
        // TULIS FILE INPUT
        // ============================================================

        const inputFile = `${tempFile}.${type.ext}`;
        fs.writeFileSync(inputFile, buffer);
        console.log('[MEDIA] Input file size:', fs.statSync(inputFile).size);

        // ============================================================
        // IMAGE → STICKER
        // ============================================================

        if (type.mime.startsWith('image/')) {
            console.log('[MEDIA] Converting image to sticker...');
            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-c:v', 'libwebp',
                        '-q:v', '80'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg (image):', cmd))
                    .on('end', () => { console.log('[MEDIA] Image to sticker success'); resolve(); })
                    .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                    .run();
            });
        }

        // ============================================================
        // VIDEO → STICKER
        // ============================================================

        else if (type.mime.startsWith('video/')) {
            console.log('[MEDIA] Converting video to sticker...');

            let duration = 0;
            try {
                const probe = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(inputFile, (err, metadata) => {
                        if (err) reject(err);
                        else resolve(metadata);
                    });
                });
                duration = probe?.format?.duration || 0;
                console.log('[MEDIA] Video duration:', duration, 'seconds');
            } catch (probeError) {
                console.log('[MEDIA] Cannot probe duration:', probeError.message);
            }

            const maxDuration = 10;
            let inputToUse = inputFile;

            if (duration > maxDuration) {
                console.log(`[MEDIA] Trimming to ${maxDuration}s...`);
                const trimmedFile = `${tempFile}_trimmed.mp4`;
                await new Promise((resolve, reject) => {
                    ffmpeg(inputFile)
                        .outputOptions(['-t', String(maxDuration)])
                        .output(trimmedFile)
                        .on('start', (cmd) => console.log('[MEDIA] Trim:', cmd))
                        .on('end', () => { console.log('[MEDIA] Trim complete'); resolve(); })
                        .on('error', (err) => reject(err))
                        .run();
                });
                inputToUse = trimmedFile;
            }

            await new Promise((resolve, reject) => {
                ffmpeg(inputToUse)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-r', '15',
                        '-c:v', 'libwebp',
                        '-q:v', '80',
                        '-loop', '0',
                        '-an'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg (video):', cmd))
                    .on('end', () => { console.log('[MEDIA] Video to sticker success'); resolve(); })
                    .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                    .run();
            });

            if (inputToUse !== inputFile) {
                try { if (fs.existsSync(inputToUse)) fs.unlinkSync(inputToUse); } catch (e) {}
            }
        } else {
            // FALLBACK: coba sebagai JPEG
            console.log('[MEDIA] Unknown format, trying as JPEG...');
            const jpgFile = `${tempFile}.jpg`;
            fs.writeFileSync(jpgFile, buffer);
            
            await new Promise((resolve, reject) => {
                ffmpeg(jpgFile)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-c:v', 'libwebp',
                        '-q:v', '80'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg (fallback2):', cmd))
                    .on('end', () => { console.log('[MEDIA] Sticker success (fallback2)'); resolve(); })
                    .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                    .run();
            });
        }

        const stickerBuffer = fs.readFileSync(outputFile);
        console.log('[MEDIA] Sticker result size:', stickerBuffer.length);
        cleanupTempFiles(cleanupPattern);
        console.log('[MEDIA] ===== END toSticker =====');
        return stickerBuffer;

    } catch (error) {
        console.error('[MEDIA] Sticker error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

// ============================================================
// FUNGSI LAINNYA (toImage, toVideo, toMP3, toVoiceNote)
// ============================================================

export async function toImage(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `image_${timestamp}`);
    const inputFile = `${tempFile}.webp`;
    const outputFile = `${tempFile}.jpg`;
    const cleanupPattern = `image_${timestamp}`;

    try {
        console.log('[MEDIA] Starting image conversion...');

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        const isWebP = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
                       buffer.slice(8, 12).toString('ascii') === 'WEBP';

        if (!isWebP) {
            cleanupTempFiles(cleanupPattern);
            throw new Error('File bukan WebP yang valid');
        }

        fs.writeFileSync(inputFile, buffer);
        await new Promise((resolve, reject) => {
            ffmpeg(inputFile)
                .output(outputFile)
                .on('start', (cmd) => console.log('[MEDIA] FFmpeg command:', cmd))
                .on('end', () => { console.log('[MEDIA] Image conversion success'); resolve(); })
                .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                .run();
        });

        const imageBuffer = fs.readFileSync(outputFile);
        cleanupTempFiles(cleanupPattern);
        return imageBuffer;

    } catch (error) {
        console.error('[MEDIA] ToImage error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

export async function toVideo(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `video_${timestamp}`);
    const inputFile = `${tempFile}.webp`;
    const outputFile = `${tempFile}.mp4`;
    const cleanupPattern = `video_${timestamp}`;

    try {
        console.log('[MEDIA] Starting video conversion...');

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        const isWebP = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
                       buffer.slice(8, 12).toString('ascii') === 'WEBP';

        if (!isWebP) {
            cleanupTempFiles(cleanupPattern);
            throw new Error('File bukan WebP yang valid');
        }

        const isAnimated = buffer.slice(12, 16).toString('ascii') === 'ANIM';
        console.log('[MEDIA] Animated WebP:', isAnimated);

        fs.writeFileSync(inputFile, buffer);

        try {
            await new Promise((resolve, reject) => {
                const ffmpegCmd = ffmpeg(inputFile)
                    .inputOptions(['-f', 'webp']);

                if (isAnimated) {
                    ffmpegCmd.inputOptions(['-loop', '0']);
                }

                ffmpegCmd
                    .outputOptions([
                        '-c:v', 'libx264',
                        '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart',
                        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg command:', cmd))
                    .on('end', () => { console.log('[MEDIA] Direct conversion success'); resolve(); })
                    .on('error', (err) => { console.log('[MEDIA] Direct conversion failed:', err.message); reject(err); })
                    .run();
            });

            const videoBuffer = fs.readFileSync(outputFile);
            cleanupTempFiles(cleanupPattern);
            return videoBuffer;

        } catch (directError) {
            console.log('[MEDIA] Direct conversion failed:', directError.message);

            try {
                console.log('[MEDIA] Trying fallback: Sharp → PNG → MP4...');
                const sharp = (await import('sharp')).default;
                const pngFile = `${tempFile}.png`;

                await sharp(buffer).png().toFile(pngFile);
                console.log('[MEDIA] Sharp WebP→PNG success');

                await new Promise((resolve, reject) => {
                    ffmpeg(pngFile)
                        .inputOptions(['-loop', '1', '-t', '3'])
                        .outputOptions([
                            '-c:v', 'libx264',
                            '-pix_fmt', 'yuv420p',
                            '-movflags', '+faststart'
                        ])
                        .output(outputFile)
                        .on('start', (cmd) => console.log('[MEDIA] PNG→MP4 command:', cmd))
                        .on('end', () => { console.log('[MEDIA] PNG to MP4 success'); resolve(); })
                        .on('error', (err) => { console.log('[MEDIA] PNG→MP4 failed:', err.message); reject(err); })
                        .run();
                });

                try { if (fs.existsSync(pngFile)) fs.unlinkSync(pngFile); } catch (e) {}

                const videoBuffer = fs.readFileSync(outputFile);
                cleanupTempFiles(cleanupPattern);
                return videoBuffer;

            } catch (fallbackError) {
                console.log('[MEDIA] Fallback failed:', fallbackError.message);
                cleanupTempFiles(cleanupPattern);
                throw new Error('Gagal konversi sticker ke video.');
            }
        }

    } catch (error) {
        console.error('[MEDIA] ToVideo error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

export async function toMP3(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `audio_${timestamp}`);
    const inputFile = `${tempFile}.mp4`;
    const outputFile = `${tempFile}.mp3`;
    const cleanupPattern = `audio_${timestamp}`;

    try {
        console.log('[MEDIA] Starting MP3 conversion...');

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        fs.writeFileSync(inputFile, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputFile)
                .outputOptions([
                    '-vn',
                    '-acodec', 'libmp3lame',
                    '-b:a', '128k'
                ])
                .output(outputFile)
                .on('start', (cmd) => console.log('[MEDIA] FFmpeg command:', cmd))
                .on('end', () => { console.log('[MEDIA] MP3 conversion success'); resolve(); })
                .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                .run();
        });

        const audioBuffer = fs.readFileSync(outputFile);
        cleanupTempFiles(cleanupPattern);
        return audioBuffer;

    } catch (error) {
        console.error('[MEDIA] ToMP3 error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

export async function toVoiceNote(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `vn_${timestamp}`);
    const outputFile = `${tempFile}.ogg`;
    const cleanupPattern = `vn_${timestamp}`;

    try {
        console.log('[MEDIA] Starting voice note conversion...');

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        let detectedExt = 'mp3';
        let isDetected = false;

        try {
            const fileType = (await import('file-type')).default;
            const result = await fileType.fromBuffer(buffer);
            if (result && result.mime.startsWith('audio/')) {
                detectedExt = result.ext;
                isDetected = true;
                console.log('[MEDIA] Detected format:', result.ext, result.mime);
            }
        } catch (e) {
            console.log('[MEDIA] Gagal deteksi format, pakai default mp3');
        }

        if (!isDetected) {
            const type = detectFileTypeSync(buffer);
            if (type && type.mime.startsWith('audio/')) {
                detectedExt = type.ext;
                console.log('[MEDIA] Manual detected:', type.ext);
            }
        }

        const inputFile = `${tempFile}.${detectedExt}`;
        fs.writeFileSync(inputFile, buffer);

        let inputFormat = detectedExt;
        if (detectedExt === 'm4a') inputFormat = 'mp4';
        if (detectedExt === 'aac') inputFormat = 'adts';

        await new Promise((resolve, reject) => {
            const cmd = ffmpeg(inputFile);

            if (inputFormat && !['mp3', 'wav', 'ogg'].includes(inputFormat)) {
                cmd.inputOptions(['-f', inputFormat]);
            }

            cmd
                .outputOptions([
                    '-c:a', 'libopus',
                    '-b:a', '32k',
                    '-ar', '16000',
                    '-ac', '1',
                    '-application', 'lowdelay'
                ])
                .output(outputFile)
                .on('start', (cmdLine) => console.log('[MEDIA] FFmpeg command:', cmdLine))
                .on('end', () => { console.log('[MEDIA] Voice note conversion success'); resolve(); })
                .on('error', (err) => { console.error('[MEDIA] FFmpeg error:', err.message); reject(err); })
                .run();
        });

        if (!fs.existsSync(outputFile)) {
            throw new Error('File output tidak ditemukan');
        }

        const vnBuffer = fs.readFileSync(outputFile);
        console.log('[MEDIA] Voice note size:', vnBuffer.length, 'bytes');

        cleanupTempFiles(cleanupPattern);

        if (vnBuffer.length === 0) {
            throw new Error('Hasil konversi kosong');
        }

        return vnBuffer;

    } catch (error) {
        console.error('[MEDIA] ToVoiceNote error:', error.message);
        cleanupTempFiles(cleanupPattern);
        return buffer;
    }
}

// ============================================================
// EXPORT
// ============================================================

export default {
    toSticker,
    toImage,
    toVideo,
    toMP3,
    toVoiceNote
};