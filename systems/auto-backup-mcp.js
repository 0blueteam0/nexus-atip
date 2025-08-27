#!/usr/bin/env node
/**
 * Auto Backup System for MCP Config
 * Monitors .claude.json and creates timestamped backups
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join('K:', 'PortableApps', 'Claude-Code', '.claude.json');
const BACKUP_DIR = path.join('K:', 'PortableApps', 'Claude-Code', 'backups', 'mcp-configs');
const MAX_BACKUPS = 10;

// Create backup directory if not exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('[+] Created backup directory:', BACKUP_DIR);
}

// Function to create backup
function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupFile = path.join(BACKUP_DIR, `claude-config-${timestamp}.json`);
        
        // Read current config
        const config = fs.readFileSync(CONFIG_FILE, 'utf8');
        
        // Write backup
        fs.writeFileSync(backupFile, config);
        console.log(`[+] Backup created: ${backupFile}`);
        
        // Clean old backups
        cleanOldBackups();
        
        return backupFile;
    } catch (error) {
        console.error('[-] Backup failed:', error.message);
        return null;
    }
}

// Function to clean old backups
function cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('claude-config-'))
        .map(f => ({
            name: f,
            path: path.join(BACKUP_DIR, f),
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
        }))
        .sort((a, b) => b.time - a.time);
    
    // Keep only MAX_BACKUPS most recent
    if (files.length > MAX_BACKUPS) {
        files.slice(MAX_BACKUPS).forEach(f => {
            fs.unlinkSync(f.path);
            console.log(`[*] Removed old backup: ${f.name}`);
        });
    }
}

// Function to get last backup hash
let lastHash = '';
function getFileHash(filePath) {
    const crypto = require('crypto');
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

// Watch for changes
console.log('[*] Auto Backup System Started');
console.log('[*] Monitoring:', CONFIG_FILE);
console.log('[*] Backup directory:', BACKUP_DIR);
console.log('[*] Max backups:', MAX_BACKUPS);

// Initial backup
createBackup();
lastHash = getFileHash(CONFIG_FILE);

// Watch for changes
fs.watchFile(CONFIG_FILE, { interval: 1000 }, (curr, prev) => {
    const currentHash = getFileHash(CONFIG_FILE);
    if (currentHash !== lastHash) {
        console.log('[!] Config change detected');
        const backupPath = createBackup();
        if (backupPath) {
            lastHash = currentHash;
            
            // Also create a quick-access latest backup
            const latestPath = path.join(BACKUP_DIR, 'claude-config-LATEST.json');
            fs.copyFileSync(CONFIG_FILE, latestPath);
            console.log('[+] Updated LATEST backup');
        }
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[*] Shutting down auto backup system');
    process.exit(0);
});

console.log('[+] Auto backup system running... Press Ctrl+C to stop');