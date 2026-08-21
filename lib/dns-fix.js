// lib/dns-fix.js
// DNS Override tanpa hosts file

import dns from 'dns';
import { promisify } from 'util';

const lookupAsync = promisify(dns.lookup);

// ============================================================
// HARDCODED IP UNTUK DOMAIN YANG DIBLOKIR
// ============================================================

const DNS_OVERRIDE = {
    'web.whatsapp.com': '157.240.0.35',
    'whatsapp.com': '157.240.0.35',
    'www.whatsapp.com': '157.240.0.35',
    'whatsapp.net': '57.144.101.32'
};

// Cache untuk IP yang sudah di-resolve
const cache = new Map();

// ============================================================
// RESOLVE DOMAIN
// ============================================================

export async function resolveDomain(hostname) {
    // Cek override dulu
    if (DNS_OVERRIDE[hostname]) {
        console.log(`[DNS] Using override for ${hostname}: ${DNS_OVERRIDE[hostname]}`);
        return DNS_OVERRIDE[hostname];
    }

    // Cek cache
    if (cache.has(hostname)) {
        return cache.get(hostname);
    }

    try {
        // Coba resolve normal
        const result = await lookupAsync(hostname);
        cache.set(hostname, result.address);
        return result.address;
    } catch (error) {
        console.log(`[DNS] Failed to resolve ${hostname}, using fallback`);
        
        // Fallback: coba dengan ping
        try {
            const { exec } = await import('child_process');
            const { promisify: execPromisify } = await import('util');
            const execAsync = execPromisify(exec);
            
            const { stdout } = await execAsync(`ping -n 1 ${hostname}`);
            const ipMatch = stdout.match(/\[(\d+\.\d+\.\d+\.\d+)\]/);
            if (ipMatch) {
                const ip = ipMatch[1];
                cache.set(hostname, ip);
                return ip;
            }
        } catch (e) {}
        
        // Fallback terakhir: coba ekstrak dari nslookup
        try {
            const { exec } = await import('child_process');
            const { promisify: execPromisify } = await import('util');
            const execAsync = execPromisify(exec);
            
            const { stdout } = await execAsync(`nslookup ${hostname}`);
            const ipMatch = stdout.match(/Address:\s*(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
                const ip = ipMatch[1];
                cache.set(hostname, ip);
                return ip;
            }
        } catch (e) {}
        
        return null;
    }
}

// ============================================================
// OVERRIDE DNS LOOKUP
// ============================================================

export function overrideDNS() {
    const originalLookup = dns.lookup;
    
    dns.lookup = function(hostname, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        resolveDomain(hostname).then(ip => {
            if (ip) {
                callback(null, ip, 4);
            } else {
                originalLookup(hostname, options, callback);
            }
        }).catch(() => {
            originalLookup(hostname, options, callback);
        });
    };
    
    console.log('[DNS] ✅ DNS override activated (without hosts file)');
}

export default { resolveDomain, overrideDNS };