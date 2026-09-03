// ai-modules/lib/aiService.js
// Layanan AI dengan Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import AI_CONFIG from './aiConfig.js';
import memoryManager from './memoryManager.js';

if (!AI_CONFIG.apiKey) {
    console.warn('[AI] ⚠️ GEMINI_API_KEY tidak ditemukan di .env');
    console.warn('[AI] ⚠️ Fitur AI tidak akan berfungsi!');
}

const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey || 'dummy');

// ============================================================
// SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `Kamu adalah asisten AI WhatsApp yang ramah dan membantu.

KEMAMPUANMU:
1. Bisa ngobrol santai dengan pengguna
2. Bisa menjalankan command/fitur bot tanpa prefix (contoh: "jadikan sticker" akan menjalankan command sticker)
3. Bisa membantu berbagai hal seperti download video, cari informasi, dll.

KARAKTER:
- Ramah dan sopan
- Gunakan bahasa Indonesia yang santai
- Respon singkat padat (maksimal 2-3 paragraf)
- Pakai emoji secukupnya

CATATAN:
- Jika diminta sesuatu yang tidak bisa dilakukan, jelaskan dengan jujur
- Jangan ngasal, kalau gak tau bilang "Maaf, saya belum bisa membantu itu"`;

// ============================================================
// CHAT WITH AI
// ============================================================

export async function chatWithAI(userJid, messageText, imageBuffer = null) {
    try {
        console.log(`[AI] Chat request from: ${userJid}`);

        const history = await memoryManager.getHistory(userJid, AI_CONFIG.maxHistoryLength);
        
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const model = genAI.getGenerativeModel({ 
            model: AI_CONFIG.model,
            generationConfig: {
                temperature: AI_CONFIG.temperature,
                maxOutputTokens: AI_CONFIG.maxTokens,
                topP: AI_CONFIG.topP
            }
        });

        // Kalau ada gambar, pakai vision
        if (imageBuffer) {
            console.log('[AI] Processing image...');
            const imageBase64 = imageBuffer.toString('base64');
            
            const chat = model.startChat({
                history: formattedHistory,
                systemInstruction: SYSTEM_PROMPT
            });
            
            const result = await chat.sendMessage([
                { text: messageText || 'Apa yang ada di gambar ini?' },
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: 'image/jpeg'
                    }
                }
            ]);
            const response = await result.response.text();
            
            await memoryManager.addMessage(userJid, 'user', messageText || '[Gambar]');
            await memoryManager.addMessage(userJid, 'model', response);
            return response;
        }

        // Chat biasa
        const chat = model.startChat({
            history: formattedHistory,
            systemInstruction: SYSTEM_PROMPT
        });

        const result = await chat.sendMessage(messageText);
        const response = await result.response.text();

        await memoryManager.addMessage(userJid, 'user', messageText);
        await memoryManager.addMessage(userJid, 'model', response);

        return response;

    } catch (error) {
        console.error('[AI] Error:', error.message);
        return `❌ *AI Error*\n\n> ${error.message}\n\nCoba lagi nanti ya!`;
    }
}

// ============================================================
// FUNGSI LAINNYA
// ============================================================

export async function resetAIMemory(userJid) {
    try {
        await memoryManager.clearHistory(userJid);
        return true;
    } catch (error) {
        console.error('[AI] Reset error:', error.message);
        return false;
    }
}

export async function isAIModeActive(userJid) {
    if (AI_CONFIG.alwaysAIMode.includes(userJid)) return true;
    if (AI_CONFIG.aiBlacklist.includes(userJid)) return false;
    
    try {
        const mode = await memoryManager.getAIMode(userJid);
        return mode === 1;
    } catch (error) {
        return AI_CONFIG.defaultAIMode;
    }
}

export async function setAIMode(userJid, active) {
    try {
        await memoryManager.setAIMode(userJid, active);
        return true;
    } catch (error) {
        console.error('[AI] Set mode error:', error.message);
        return false;
    }
}

export default {
    chatWithAI,
    resetAIMemory,
    isAIModeActive,
    setAIMode
};
