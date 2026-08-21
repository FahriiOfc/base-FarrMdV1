// lib/media.js
// Media Processing - FIXED (tanpa -f webp)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// ============================================================
// SET FFMPEG PATH
// ============================================================

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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
// DETECT FILE TYPE
// ============================================================

function detectFileTypeSync(buffer) {
    if (!buffer || buffer.length < 4) return null;
    
    const hex = buffer.slice(0, 12).toString('hex').toLowerCase();
    const ascii = buffer.slice(0, 12).toString('ascii');

    if (hex.startsWith('89504e47')) return { ext: 'png', mime: 'image/png' };
    if (hex.startsWith('ffd8ff')) return { ext: 'jpg', mime: 'image/jpeg' };
    if (hex.startsWith('47494638')) return { ext: 'gif', mime: 'image/gif' };
    if (hex.startsWith('52494646') && ascii.slice(8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
    if (hex.startsWith('424d')) return { ext: 'bmp', mime: 'image/bmp' };
    if (hex.startsWith('000000') && ascii.slice(4, 8) === 'ftyp') return { ext: 'mp4', mime: 'video/mp4' };
    if (hex.startsWith('494433')) return { ext: 'mp3', mime: 'audio/mpeg' };
    if (hex.startsWith('4f676753')) return { ext: 'ogg', mime: 'audio/ogg' };
    if (hex.startsWith('52494646') && ascii.slice(8, 12) === 'WAVE') return { ext: 'wav', mime: 'audio/wav' };
    
    return null;
}

// ============================================================
// DETEKSI ANIMATED WEBP
// ============================================================

function isAnimatedWebP(buffer) {
    if (!buffer || buffer.length < 20) return false;
    try {
        const isRiff = buffer.slice(0, 4).toString('ascii') === 'RIFF';
        const isWebp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
        if (!isRiff || !isWebp) return false;
        const hasAnim = buffer.includes(Buffer.from('ANIM'));
        const hasAnmf = buffer.includes(Buffer.from('ANMF'));
        return hasAnim || hasAnmf;
    } catch (e) {
        return false;
    }
}

// ============================================================
// EKSTRAK DURASI DARI ANIM CHUNK
// ============================================================

function extractAnimDuration(buffer) {
    try {
        let animIndex = buffer.indexOf('ANIM');
        if (animIndex === -1) {
            animIndex = buffer.indexOf('ANMF');
            if (animIndex === -1) return null;
            const durationOffset = animIndex + 12;
            if (buffer.length < durationOffset + 2) return null;
            const durMs = buffer.readUInt16LE(durationOffset);
            if (durMs > 0 && durMs < 30000) {
                return durMs / 1000;
            }
            return null;
        }
        const durationOffset = animIndex + 12;
        if (buffer.length < durationOffset + 4) return null;
        const durMs = buffer.readUInt32LE(durationOffset);
        if (durMs > 0 && durMs < 30000) {
            return durMs / 1000;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ============================================================
// TO STICKER
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

        let type = detectFileTypeSync(buffer);
        
        if (!type) {
            console.log('[MEDIA] Format tidak dikenali, coba treat sebagai JPEG...');
            const inputFile = `${tempFile}.jpg`;
            fs.writeFileSync(inputFile, buffer);
            
            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-c:v', 'libwebp',
                        '-q:v', '80'
                    ])
                    .output(outputFile)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .run();
            });

            const stickerBuffer = fs.readFileSync(outputFile);
            cleanupTempFiles(cleanupPattern);
            return stickerBuffer;
        }

        console.log('[MEDIA] Detected:', type.ext, type.mime);

        const inputFile = `${tempFile}.${type.ext}`;
        fs.writeFileSync(inputFile, buffer);

        if (type.mime.startsWith('image/')) {
            await new Promise((resolve, reject) => {
                ffmpeg(inputFile)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',
                        '-c:v', 'libwebp',
                        '-q:v', '80'
                    ])
                    .output(outputFile)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .run();
            });
        } else if (type.mime.startsWith('video/')) {
            let duration = 0;
            try {
                const probe = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(inputFile, (err, metadata) => {
                        if (err) reject(err);
                        else resolve(metadata);
                    });
                });
                duration = probe?.format?.duration || 0;
                console.log('[MEDIA] Video duration:', duration);
            } catch (probeError) {
                console.log('[MEDIA] Cannot probe duration');
            }

            const maxDuration = 10;
            let inputToUse = inputFile;

            if (duration > maxDuration) {
                const trimmedFile = `${tempFile}_trimmed.mp4`;
                await new Promise((resolve, reject) => {
                    ffmpeg(inputFile)
                        .outputOptions(['-t', String(maxDuration)])
                        .output(trimmedFile)
                        .on('end', () => resolve())
                        .on('error', (err) => reject(err))
                        .run();
                });
                inputToUse = trimmedFile;
            }

            await new Promise((resolve, reject) => {
                ffmpeg(inputToUse)
                    .outputOptions([
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15',
                        '-c:v', 'libwebp',
                        '-q:v', '80',
                        '-loop', '0',
                        '-vsync', '0',
                        '-an'
                    ])
                    .output(outputFile)
                    .on('start', (cmd) => console.log('[MEDIA] FFmpeg:', cmd))
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .run();
            });

            if (inputToUse !== inputFile) {
                try { if (fs.existsSync(inputToUse)) fs.unlinkSync(inputToUse); } catch (e) {}
            }
        } else {
            throw new Error('Format tidak didukung');
        }

        const stickerBuffer = fs.readFileSync(outputFile);
        console.log('[MEDIA] Sticker size:', stickerBuffer.length);
        cleanupTempFiles(cleanupPattern);
        return stickerBuffer;

    } catch (error) {
        console.error('[STICKER] Error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

// ============================================================
// TO IMAGE
// ============================================================

export async function toImage(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `image_${timestamp}`);
    const inputFile = `${tempFile}.webp`;
    const outputFile = `${tempFile}.jpg`;
    const cleanupPattern = `image_${timestamp}`;

    try {
        if (!buffer || buffer.length === 0) throw new Error('Buffer kosong');

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
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        const imageBuffer = fs.readFileSync(outputFile);
        cleanupTempFiles(cleanupPattern);
        return imageBuffer;

    } catch (error) {
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

// ============================================================
// TO VIDEO - FIXED (Tanpa -f webp)
// ============================================================

export async function toVideo(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `video_${timestamp}`);
    const inputFile = `${tempFile}.webp`;
    const outputFile = `${tempFile}.mp4`;
    const cleanupPattern = `video_${timestamp}`;

    try {
        console.log('[MEDIA] ===== START toVideo =====');

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong atau tidak valid');
        }

        const isWebP = buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
                       buffer.slice(8, 12).toString('ascii') === 'WEBP';

        if (!isWebP) {
            cleanupTempFiles(cleanupPattern);
            throw new Error('File bukan WebP yang valid');
        }

        const isAnimated = isAnimatedWebP(buffer);
        console.log('[MEDIA] Is animated WebP:', isAnimated);

        let duration = 3;
        let durationSource = 'default';

        if (isAnimated) {
            const animDuration = extractAnimDuration(buffer);
            if (animDuration && animDuration > 0) {
                duration = Math.min(animDuration, 10);
                durationSource = 'ANIM chunk';
                console.log('[MEDIA] Duration from ANIM:', duration, 's');
            }
        }

        if (duration === 3 || !isAnimated) {
            try {
                fs.writeFileSync(inputFile, buffer);
                const probe = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(inputFile, (err, metadata) => {
                        if (err) reject(err);
                        else resolve(metadata);
                    });
                });
                if (probe?.format?.duration && probe.format.duration > 0) {
                    const probeDuration = Math.min(probe.format.duration, 10);
                    if (probeDuration > 0.5) {
                        duration = probeDuration;
                        durationSource = 'ffprobe';
                        console.log('[MEDIA] Duration from ffprobe:', duration, 's');
                    }
                }
            } catch (probeError) {
                console.log('[MEDIA] Probe failed:', probeError.message);
            }
        }

        console.log('[MEDIA] Final duration:', duration, 's (source:', durationSource, ')');

        // ============================================================
        // TULIS FILE INPUT
        // ============================================================

        fs.writeFileSync(inputFile, buffer);
        console.log('[MEDIA] Input file size:', fs.statSync(inputFile).size);

        // ============================================================
        // KONVERSI - TANPA INPUT FORMAT "-f webp"
        // ============================================================

        await new Promise((resolve, reject) => {
            const cmd = ffmpeg(inputFile);

            // HAPUS: .inputOptions(['-f', 'webp']) 
            // Biarkan FFmpeg auto-detect dari ekstensi file .webp

            if (isAnimated) {
                cmd
                    .inputOptions(['-loop', '0'])
                    .outputOptions([
                        '-c:v', 'libx264',
                        '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart',
                        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                        '-vsync', '0'
                    ]);
            } else {
                cmd
                    .inputOptions(['-loop', '1'])
                    .outputOptions([
                        '-c:v', 'libx264',
                        '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart',
                        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                        '-t', '3'
                    ]);
            }

            cmd
                .output(outputFile)
                .on('start', (cmdLine) => {
                    console.log('[MEDIA] FFmpeg:', cmdLine);
                })
                .on('end', () => {
                    console.log('[MEDIA] Video success');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('[MEDIA] FFmpeg error:', err.message);
                    reject(err);
                })
                .run();
        });

        // ============================================================
        // BACA HASIL
        // ============================================================

        if (!fs.existsSync(outputFile)) {
            throw new Error('File output tidak ditemukan');
        }

        const videoBuffer = fs.readFileSync(outputFile);
        console.log('[MEDIA] Video size:', videoBuffer.length, 'bytes');

        cleanupTempFiles(cleanupPattern);
        return videoBuffer;

    } catch (error) {
        console.error('[MEDIA] toVideo error:', error.message);
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

// ============================================================
// TO MP3
// ============================================================

export async function toMP3(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `audio_${timestamp}`);
    const inputFile = `${tempFile}.mp4`;
    const outputFile = `${tempFile}.mp3`;
    const cleanupPattern = `audio_${timestamp}`;

    try {
        if (!buffer || buffer.length === 0) throw new Error('Buffer kosong');

        fs.writeFileSync(inputFile, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputFile)
                .outputOptions(['-vn', '-acodec', 'libmp3lame', '-b:a', '128k'])
                .output(outputFile)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        const audioBuffer = fs.readFileSync(outputFile);
        cleanupTempFiles(cleanupPattern);
        return audioBuffer;

    } catch (error) {
        cleanupTempFiles(cleanupPattern);
        throw error;
    }
}

// ============================================================
// TO VOICE NOTE
// ============================================================

export async function toVoiceNote(buffer) {
    ensureTempDir();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `vn_${timestamp}`);
    const outputFile = `${tempFile}.ogg`;
    const cleanupPattern = `vn_${timestamp}`;

    try {
        if (!buffer || buffer.length === 0) throw new Error('Buffer kosong');

        let detectedExt = 'mp3';
        try {
            const fileType = (await import('file-type')).default;
            const result = await fileType.fromBuffer(buffer);
            if (result && result.mime.startsWith('audio/')) {
                detectedExt = result.ext;
            }
        } catch (e) {
            const type = detectFileTypeSync(buffer);
            if (type && type.mime.startsWith('audio/')) {
                detectedExt = type.ext;
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
                .on('start', (cmdLine) => console.log('[MEDIA] FFmpeg:', cmdLine))
                .on('end', () => { console.log('[MEDIA] Voice note success'); resolve(); })
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
        console.error('[MEDIA] toVoiceNote error:', error.message);
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