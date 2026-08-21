// lib/downloader.js
// Downloader Helpers

import axios from 'axios';
import config from '../config.js';

// ============================================================
// YOUTUBE AUDIO
// ============================================================

export async function ytmp3(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();
        const apiKey = config.lolhumanApiKey;

        if (!apiKey) {
            throw new Error('API Key Lolhuman tidak ditemukan di config.js');
        }

        const response = await axios.get(
            `https://api.lolhuman.xyz/api/ytaudio?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
            { timeout: 60000 }
        );

        if (response.data.status !== 200) {
            throw new Error(response.data.message || 'Gagal mendapatkan audio');
        }

        const result = response.data.result;

        let downloadUrl = null;

        if (typeof result.link === 'string') {
            downloadUrl = result.link;
        } else if (typeof result.download === 'string') {
            downloadUrl = result.download;
        } else if (typeof result.url === 'string') {
            downloadUrl = result.url;
        } else if (typeof result.audio === 'string') {
            downloadUrl = result.audio;
        } else if (typeof result.result === 'string') {
            downloadUrl = result.result;
        } else if (Array.isArray(result.link) && result.link.length > 0) {
            downloadUrl = typeof result.link[0] === 'string' ? result.link[0] : null;
        } else if (result.link && typeof result.link === 'object') {
            for (const key of Object.keys(result.link)) {
                if (typeof result.link[key] === 'string' && result.link[key].startsWith('http')) {
                    downloadUrl = result.link[key];
                    break;
                }
            }
        }

        if (!downloadUrl) {
            for (const key of Object.keys(result)) {
                if (typeof result[key] === 'string' && result[key].startsWith('http')) {
                    downloadUrl = result[key];
                    break;
                }
            }
        }

        if (!downloadUrl || typeof downloadUrl !== 'string') {
            throw new Error('URL download tidak ditemukan');
        }

        console.log('[YTMP3] Downloading audio...');

        const audioResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('[YTMP3] Audio downloaded:', audioResponse.data.length);

        let durationFormatted = '0:00';
        const durationRaw = result.duration || '0';

        if (!isNaN(durationRaw)) {
            const seconds = parseInt(durationRaw);
            if (seconds > 0) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                durationFormatted = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        } else if (typeof durationRaw === 'string' && durationRaw.includes(':')) {
            durationFormatted = durationRaw;
        }

        return {
            title: result.title || 'Audio',
            duration: durationFormatted,
            quality: result.quality || '128kbps',
            thumbnail: result.thumbnail || '',
            download: downloadUrl,
            buffer: audioResponse.data
        };

    } catch (error) {
        console.error('[YTMP3 Error]', error.message);
        throw error;
    }
}

// ============================================================
// YOUTUBE VIDEO
// ============================================================

export async function ytmp4(url, quality = '360') {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();

        let qualityParam = '360';
        if (quality === '720' || quality === '720p') qualityParam = '720';
        else if (quality === '480' || quality === '480p') qualityParam = '480';
        else if (quality === '1080' || quality === '1080p') qualityParam = '1080';
        else if (quality === '360' || quality === '360p') qualityParam = '360';
        else if (quality === '240' || quality === '240p') qualityParam = '240';
        else if (quality === '144' || quality === '144p') qualityParam = '144';

        const apiKey = config.lolhumanApiKey;

        if (!apiKey) {
            throw new Error('API Key Lolhuman tidak ditemukan di config.js');
        }

        const response = await axios.get(
            `https://api.lolhuman.xyz/api/ytvideo?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
            { timeout: 60000 }
        );

        if (response.data.status !== 200) {
            throw new Error(response.data.message || 'Gagal mendapatkan video');
        }

        const result = response.data.result;

        let downloadUrl = null;

        if (typeof result.link === 'string') {
            downloadUrl = result.link;
        } else if (typeof result.download === 'string') {
            downloadUrl = result.download;
        } else if (typeof result.url === 'string') {
            downloadUrl = result.url;
        } else if (typeof result.video === 'string') {
            downloadUrl = result.video;
        } else if (typeof result.result === 'string') {
            downloadUrl = result.result;
        } else if (Array.isArray(result.link) && result.link.length > 0) {
            downloadUrl = typeof result.link[0] === 'string' ? result.link[0] : null;
        } else if (result.link && typeof result.link === 'object') {
            for (const key of Object.keys(result.link)) {
                if (typeof result.link[key] === 'string' && result.link[key].startsWith('http')) {
                    downloadUrl = result.link[key];
                    break;
                }
            }
        }

        if (!downloadUrl) {
            for (const key of Object.keys(result)) {
                if (typeof result[key] === 'string' && result[key].startsWith('http')) {
                    downloadUrl = result[key];
                    break;
                }
            }
        }

        if (!downloadUrl || typeof downloadUrl !== 'string') {
            throw new Error('URL download tidak ditemukan');
        }

        let durationFormatted = '0:00';
        let durationRaw = result.duration || result.duration_text || result.length || result.lengthSeconds || result.dur || result.duration_seconds || '0';

        if (typeof durationRaw === 'number' || !isNaN(durationRaw)) {
            const seconds = parseInt(durationRaw);
            if (seconds > 0) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                durationFormatted = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        } else if (typeof durationRaw === 'string') {
            const cleanDuration = durationRaw.replace(/[^0-9:]/g, '');
            if (cleanDuration.includes(':')) {
                const parts = cleanDuration.split(':');
                if (parts.length === 2) {
                    durationFormatted = cleanDuration;
                } else if (parts.length === 3) {
                    const hours = parseInt(parts[0]);
                    const minutes = parseInt(parts[1]);
                    const seconds = parseInt(parts[2]);
                    const totalMinutes = (hours * 60) + minutes;
                    durationFormatted = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
                }
            } else if (!isNaN(cleanDuration) && cleanDuration !== '') {
                const seconds = parseInt(cleanDuration);
                if (seconds > 0) {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    durationFormatted = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                }
            }
        }

        return {
            title: result.title || 'Video',
            duration: durationFormatted,
            quality: result.quality || qualityParam + 'p',
            thumbnail: result.thumbnail || '',
            download: downloadUrl
        };

    } catch (error) {
        console.error('[YTMP4 Error]', error.message);
        throw error;
    }
}

// ============================================================
// TIKTOK
// ============================================================

export async function tiktok(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();

        const urlRegex = /(https?:\/\/)?(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)\/[^\s]+/i;

        if (!urlRegex.test(url)) {
            throw new Error('URL TikTok tidak valid');
        }

        // Method 1: TikWM API
        try {
            const response = await axios.get(
                `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
                {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            if (response.data && response.data.code === 0 && response.data.data) {
                const data = response.data.data;
                const videoUrl = data.play || data.wmplay || data.hdplay;

                if (videoUrl && typeof videoUrl === 'string') {
                    return {
                        caption: data.title || 'Tidak ada caption',
                        video: videoUrl,
                        audio: data.music || '',
                        thumbnail: data.cover || '',
                        source: 'TikWM'
                    };
                }
            }
        } catch (tikwmError) {}

        // Method 2: Lolhuman API
        try {
            const apiKey = config.lolhumanApiKey;

            if (!apiKey) {
                throw new Error('API Key Lolhuman tidak ditemukan');
            }

            const response = await axios.get(
                `https://api.lolhuman.xyz/api/tiktok?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
                { timeout: 30000 }
            );

            if (response.data.status === 200 && response.data.result) {
                const result = response.data.result;
                let videoUrl = result.video || result.video_hd || result.video_watermark;

                if (videoUrl && typeof videoUrl === 'string') {
                    return {
                        caption: result.caption || 'Tidak ada caption',
                        video: videoUrl,
                        audio: result.audio || '',
                        thumbnail: result.thumbnail || '',
                        source: 'Lolhuman'
                    };
                }
            }
        } catch (lolhumanError) {}

        throw new Error('Semua API gagal. Coba URL lain.');

    } catch (error) {
        console.error('[TIKTOK Error]', error.message);
        throw error;
    }
}

// ============================================================
// INSTAGRAM
// ============================================================

export async function instagram(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();

        const apiKey = config.lolhumanApiKey;

        if (!apiKey) {
            throw new Error('API Key Lolhuman tidak ditemukan di config.js');
        }

        let response = null;
        let lastError = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`[IG] Waiting 3 seconds before attempt ${attempt}...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                console.log(`[IG] Attempt ${attempt} (Lolhuman)...`);

                response = await axios.get(
                    `https://api.lolhuman.xyz/api/instagram?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );

                if (response.data.status === 200) {
                    break;
                }

                if (response.data.status === 429) {
                    lastError = 'Rate limit exceeded (429) - tunggu beberapa menit';
                    console.log(`[IG] Rate limit!`);
                } else {
                    lastError = response.data.message || 'Gagal';
                }

            } catch (err) {
                lastError = err.message;
                if (err.response && err.response.status === 429) {
                    lastError = 'Rate limit exceeded (429) - tunggu beberapa menit';
                    console.log(`[IG] Rate limit!`);
                }
                console.log(`[IG] Attempt ${attempt} failed:`, lastError);
            }
        }

        if (response && response.data.status === 200) {
            const result = response.data.result;
            let mediaUrl = result.media;

            if (typeof mediaUrl === 'object' && mediaUrl.url) {
                mediaUrl = mediaUrl.url;
            } else if (Array.isArray(mediaUrl) && mediaUrl.length > 0) {
                mediaUrl = typeof mediaUrl[0] === 'string' ? mediaUrl[0] : null;
            }

            if (mediaUrl && typeof mediaUrl === 'string') {
                return {
                    type: result.type || 'image',
                    media: mediaUrl,
                    caption: result.caption || 'Instagram'
                };
            }
        }

        if (lastError && lastError.includes('429')) {
            throw new Error('⚠️ API Key Lolhuman terkena rate limit. Tunggu beberapa menit atau besok lagi.');
        }

        throw new Error(lastError || 'Semua API gagal. Coba lagi nanti atau URL lain.');

    } catch (error) {
        console.error('[INSTAGRAM Error]', error.message);
        throw error;
    }
}

// ============================================================
// FACEBOOK
// ============================================================

export async function facebook(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();

        const apiKey = config.lolhumanApiKey;

        if (!apiKey) {
            throw new Error('API Key Lolhuman tidak ditemukan di config.js');
        }

        const response = await axios.get(
            `https://api.lolhuman.xyz/api/facebook?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
            { timeout: 30000 }
        );

        if (response.data.status !== 200) {
            throw new Error(response.data.message || 'Gagal mendapatkan video Facebook');
        }

        const result = response.data.result;

        let videoUrl = result.video;

        if (typeof videoUrl === 'object' && videoUrl.url) {
            videoUrl = videoUrl.url;
        } else if (Array.isArray(videoUrl) && videoUrl.length > 0) {
            videoUrl = typeof videoUrl[0] === 'string' ? videoUrl[0] : null;
        }

        if (!videoUrl || typeof videoUrl !== 'string') {
            throw new Error('URL video tidak ditemukan');
        }

        return {
            title: result.title || 'Facebook Video',
            video: videoUrl
        };

    } catch (error) {
        console.error('[FACEBOOK Error]', error.message);
        throw error;
    }
}

// ============================================================
// GITHUB
// ============================================================

export async function github(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('URL tidak valid');
        }

        url = url.trim();

        if (url.includes('git@github.com:')) {
            url = url.replace('git@github.com:', 'https://github.com/');
        }

        if (url.endsWith('.git')) {
            url = url.slice(0, -4);
        }

        const parsed = new URL(url);
        const pathParts = parsed.pathname.split('/').filter(Boolean);

        if (pathParts.length < 2) {
            throw new Error('URL repository tidak valid');
        }

        const author = pathParts[0];
        const repo = pathParts[1];

        const downloadUrl = `https://api.github.com/repos/${author}/${repo}/zipball`;

        try {
            const response = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'FarrMD-V1-Bot'
                },
                timeout: 60000
            });

            return {
                author: author,
                repo: repo,
                data: response.data,
                size: response.data.length,
                name: repo
            };

        } catch (githubError) {
            if (githubError.response && githubError.response.status === 404) {
                throw new Error(`Repository ${author}/${repo} tidak ditemukan atau private.`);
            }
            if (githubError.response && githubError.response.status === 403) {
                throw new Error(`Rate limit GitHub. Coba lagi nanti.`);
            }
            throw githubError;
        }

    } catch (error) {
        console.error('[GITHUB Error]', error.message);
        throw error;
    }
}

export default {
    ytmp3,
    ytmp4,
    tiktok,
    instagram,
    facebook,
    github
};