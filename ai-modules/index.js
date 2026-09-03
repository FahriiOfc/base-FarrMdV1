// ai-modules/index.js
// Entry point untuk semua modul AI

import aiHandler from './lib/aiHandler.js';
import aiService from './lib/aiService.js';
import memoryManager from './lib/memoryManager.js';
import AI_CONFIG from './lib/aiConfig.js';
import commandMatcher from './lib/commandMatcher.js';

console.log('[AI-MODULES] 🤖 AI Modules loaded');

export {
    aiHandler,
    aiService,
    memoryManager,
    AI_CONFIG,
    commandMatcher
};

export default {
    aiHandler,
    aiService,
    memoryManager,
    AI_CONFIG,
    commandMatcher
};
