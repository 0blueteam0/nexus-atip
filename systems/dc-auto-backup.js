#!/usr/bin/env node
/**
 * Desktop Commander Auto Backup System
 * Superior version using DC's advanced features
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = 'K:\\PortableApps\\Claude-Code\\.claude.json';
const BACKUP_DIR = 'K:\\PortableApps\\Claude-Code\\backups\\mcp-configs';
const MAX_BACKUPS = 20; // DC can handle more
const CHECK_INTERVAL = 2000; // 2 seconds

class DesktopCommanderBackup {
    constructor() {
        this.lastHash = '';
        this.backupCount = 0;
        this.gitInitialized = false;
    }

    async init() {
        console.log('[*] Desktop Commander Backup System v2.0');
        console.log('[+] Superior to filesystem MCP version');
        
        // Create backup directory
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log('[+] Created backup directory');
        }

        // Initialize Git if not exists
        this.initGit();
        
        // Initial backup
        await this.createBackup('Initial backup');
        
        // Start monitoring
        this.startMonitoring();
    }

    initGit() {
        try {
            const gitDir = path.join(BACKUP_DIR, '.git');
            if (!fs.existsSync(gitDir)) {
                execSync('git init', { cwd: BACKUP_DIR });
                execSync('git config user.name "DC Backup System"', { cwd: BACKUP_DIR });
                execSync('git config user.email "backup@k-drive.local"', { cwd: BACKUP_DIR });
                console.log('[+] Git repository initialized');
            }
            this.gitInitialized = true;
        } catch (error) {
            console.log('[!] Git not available, using file-only backup');
            this.gitInitialized = false;
        }
    }

    getFileHash(filePath) {
        const crypto = require('crypto');
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }

    async createBackup(reason = 'Auto backup') {
        try {
            this.backupCount++;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFile = path.join(BACKUP_DIR, `claude-config-${timestamp}.json`);
            
            // Read current config
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            
            // Add metadata
            const backupData = {
                ...config,
                _backup_metadata: {
                    timestamp: new Date().toISOString(),
                    reason: reason,
                    backupNumber: this.backupCount,
                    mcpServerCount: Object.keys(config.mcpServers || {}).length,
                    hash: this.getFileHash(CONFIG_FILE)
                }
            };
            
            // Write backup with pretty formatting
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`[+] Backup #${this.backupCount}: ${path.basename(backupFile)}`);
            
            // Git commit if available
            if (this.gitInitialized) {
                try {
                    execSync(`git add "${path.basename(backupFile)}"`, { cwd: BACKUP_DIR });
                    execSync(`git commit -m "${reason} - ${timestamp}"`, { cwd: BACKUP_DIR });
                    console.log('[+] Git commit created');
                } catch (error) {
                    // Ignore if nothing to commit
                }
            }
            
            // Update latest symlink
            const latestPath = path.join(BACKUP_DIR, 'claude-config-LATEST.json');
            fs.copyFileSync(backupFile, latestPath);
            
            // Clean old backups
            this.cleanOldBackups();
            
            return backupFile;
        } catch (error) {
            console.error('[-] Backup failed:', error.message);
            return null;
        }
    }

    cleanOldBackups() {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('claude-config-') && f !== 'claude-config-LATEST.json')
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
            }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length > MAX_BACKUPS) {
            files.slice(MAX_BACKUPS).forEach(f => {
                fs.unlinkSync(f.path);
                console.log(`[*] Cleaned old backup: ${f.name}`);
            });
        }
    }

    detectChanges() {
        try {
            const currentHash = this.getFileHash(CONFIG_FILE);
            if (!currentHash) return null;
            
            if (this.lastHash && currentHash !== this.lastHash) {
                // Analyze what changed
                const oldConfig = this.lastConfig || {};
                const newConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
                
                const changes = [];
                
                // Check MCP servers
                const oldServers = Object.keys(oldConfig.mcpServers || {});
                const newServers = Object.keys(newConfig.mcpServers || {});
                
                const added = newServers.filter(s => !oldServers.includes(s));
                const removed = oldServers.filter(s => !newServers.includes(s));
                
                if (added.length > 0) changes.push(`Added MCP: ${added.join(', ')}`);
                if (removed.length > 0) changes.push(`Removed MCP: ${removed.join(', ')}`);
                
                // Check other changes
                if (oldConfig.promptQueueUseCount !== newConfig.promptQueueUseCount) {
                    changes.push('Usage count updated');
                }
                
                this.lastConfig = newConfig;
                return changes.length > 0 ? changes.join('; ') : 'Config updated';
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    startMonitoring() {
        console.log('[*] Monitoring started');
        console.log('[*] Press Ctrl+C to stop');
        
        // Initial hash
        this.lastHash = this.getFileHash(CONFIG_FILE);
        this.lastConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        
        // Check periodically
        setInterval(() => {
            const changes = this.detectChanges();
            if (changes) {
                console.log(`[!] Change detected: ${changes}`);
                this.createBackup(changes);
                this.lastHash = this.getFileHash(CONFIG_FILE);
            }
        }, CHECK_INTERVAL);
    }

    async showStats() {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('claude-config-') && f !== 'claude-config-LATEST.json');
        
        console.log('\n[*] Backup Statistics:');
        console.log(`    Total backups: ${files.length}`);
        console.log(`    Backup directory: ${BACKUP_DIR}`);
        console.log(`    Git enabled: ${this.gitInitialized}`);
        console.log(`    Monitoring interval: ${CHECK_INTERVAL}ms`);
        console.log(`    Max backups kept: ${MAX_BACKUPS}`);
    }
}

// Main execution
const backup = new DesktopCommanderBackup();

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n[*] Shutting down Desktop Commander Backup System');
    await backup.showStats();
    process.exit(0);
});

// Start
backup.init().catch(error => {
    console.error('[-] Failed to start:', error);
    process.exit(1);
});