/**
 * Script Lifecycle Manager
 * Automatically archives one-time scripts after execution
 * Monitors script usage and moves to archive when done
 */

const fs = require('fs');
const path = require('path');

class ScriptLifecycleManager {
    constructor() {
        this.workDir = 'K:/PortableApps/Claude-Code';
        this.archiveBase = path.join(this.workDir, 'ARCHIVE', 'auto-archive');
        this.oneTimePatterns = [
            /^FIX-/i, /^TEST-/i, /^DEBUG-/i, /^TEMP-/i,
            /^QUICK-/i, /^EXECUTE-/i, /^RUN-/i, /^CATCH-/i,
            /^CHECK-/i, /^CLEANUP-EXECUTOR/i, /-test\./i, 
            /-temp\./i, /-debug\./i, /^trace-/i
        ];
        this.executionLog = new Map();
    }

    getToday() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isOneTimeScript(filename) {
        return this.oneTimePatterns.some(pattern => pattern.test(filename));
    }

    async archiveScript(filepath) {
        try {
            const filename = path.basename(filepath);
            const todayFolder = path.join(this.archiveBase, this.getToday());
            
            // Create archive folder if needed
            if (!fs.existsSync(todayFolder)) {
                fs.mkdirSync(todayFolder, { recursive: true });
            }

            // Move file to archive
            const destPath = path.join(todayFolder, filename);
            fs.renameSync(filepath, destPath);
            
            console.log(`[+] Archived: ${filename} -> ${this.getToday()}/`);
            return true;
        } catch (error) {
            console.error(`[-] Archive failed for ${filepath}:`, error.message);
            return false;
        }
    }

    async scanAndArchive() {
        console.log('========================================');
        console.log('   SCRIPT LIFECYCLE MANAGER');
        console.log(`   Date: ${this.getToday()}`);
        console.log('========================================\n');

        const files = fs.readdirSync(this.workDir);
        let archivedCount = 0;

        for (const file of files) {
            const filepath = path.join(this.workDir, file);
            
            // Skip directories
            if (fs.statSync(filepath).isDirectory()) continue;
            
            // Check if it's a one-time script
            if (this.isOneTimeScript(file)) {
                // Check last modified time (archive if older than 1 hour)
                const stats = fs.statSync(filepath);
                const ageInHours = (Date.now() - stats.mtime) / (1000 * 60 * 60);
                
                if (ageInHours > 1) {
                    if (await this.archiveScript(filepath)) {
                        archivedCount++;
                    }
                }
            }
        }

        console.log(`\n[*] Summary: Archived ${archivedCount} scripts`);
        
        // Also clean up old archive folders (older than 30 days)
        this.cleanOldArchives();
    }

    cleanOldArchives() {
        try {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const archiveFolders = fs.readdirSync(this.archiveBase);
            
            for (const folder of archiveFolders) {
                const folderPath = path.join(this.archiveBase, folder);
                const stats = fs.statSync(folderPath);
                
                if (stats.isDirectory() && stats.mtime < thirtyDaysAgo) {
                    // Move to historical archive
                    const historicalPath = path.join(this.workDir, 'ARCHIVE', 'historical', folder);
                    fs.renameSync(folderPath, historicalPath);
                    console.log(`[*] Moved old archive to historical: ${folder}`);
                }
            }
        } catch (error) {
            console.log('[*] No old archives to clean');
        }
    }

    // Hook into script execution
    hookScriptExecution(scriptPath) {
        const filename = path.basename(scriptPath);
        
        if (this.isOneTimeScript(filename)) {
            // Mark for archiving after execution
            this.executionLog.set(scriptPath, Date.now());
            
            // Schedule archive check after 5 minutes
            setTimeout(() => {
                if (fs.existsSync(scriptPath)) {
                    this.archiveScript(scriptPath);
                }
            }, 5 * 60 * 1000);
        }
    }

    startAutoMonitor() {
        // Run initial scan
        this.scanAndArchive();
        
        // Schedule periodic scans every hour
        setInterval(() => {
            this.scanAndArchive();
        }, 60 * 60 * 1000);
        
        console.log('[+] Auto-monitoring started (checks every hour)');
    }
}

// Export for use in other scripts
module.exports = ScriptLifecycleManager;

// Run if called directly
if (require.main === module) {
    const manager = new ScriptLifecycleManager();
    manager.startAutoMonitor();
}