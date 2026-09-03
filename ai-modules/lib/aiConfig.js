// ai-modules/lib/aiConfig.js
// Konfigurasi untuk AI Service

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env dari root project
dotenv.config({ path: path.join(__dirname, '../../', '.env') });

export const AI_CONFIG = {
    // API Key dari environment variable
    apiKey: process.env.GEMINI_API_KEY || '',
    
    // Model yang digunakan
    model: 'gemini-2.5-flash',
    
    // Parameter default
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.95,
    
    // Memory settings - berapa pesan yang diingat per user
    maxHistoryLength: 20,
    
    // Prefix yang digunakan bot (sama dengan config utama)
    prefixes: ['.', '!', '#'],
    
    // Mode AI default (false = nonaktif)
    defaultAIMode: false,
    
    // User yang selalu dalam mode AI (isi nomor owner-mu)
    alwaysAIMode: ['6285893028915@s.whatsapp.net'],
    
    // User yang tidak boleh pakai AI
    aiBlacklist: []
};

export default AI_CONFIG;
