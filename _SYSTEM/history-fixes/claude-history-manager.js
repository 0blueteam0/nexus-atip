/**
 * Claude History Manager
 * Manages .claude.json history to prevent infinite growth
 * Keeps only recent conversations while preserving session memory
 */

const fs = require('fs');
const path = require('path');

class ClaudeHistoryManager {
    constructor() {
        this.configPath = 'K:/PortableApps/Claude-Code/.claude.json';
        this.backupDir = 'K:/PortableApps/Claude-Code/_ARCHIVE/claude-history';
        this.maxHistoryItems = 10; // Keep only 10 most recent
        this.historyArchiveFile = null;
    }

    loadConfig() {
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('[-] Failed to load .claude.json:', error.message);
            return null;
        }
    }

    saveConfig(config) {
        try {
            const content = JSON.stringify(config, null, 2);
            fs.writeFileSync(this.configPath, content, 'utf8');
            return true;
        } catch (error) {
            console.error('[-] Failed to save .claude.json:', error.message);
            return false;
        }
    }

    archiveHistory(history) {
        // Create archive directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Create archive file name with date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const timeStr = `${String(date.getHours()).padStart(2,'0')}-${String(date.getMinutes()).padStart(2,'0')}`;
        const archiveFile = path.join(this.backupDir, `history-${dateStr}_${timeStr}.json`);

        // Save archived history
        try {
            fs.writeFileSync(archiveFile, JSON.stringify(history, null, 2), 'utf8');
            console.log(`[+] Archived ${history.length} history items to: ${archiveFile}`);
            this.historyArchiveFile = archiveFile;
            return true;
        } catch (error) {
            console.error('[-] Failed to archive history:', error.message);
            return false;
        }
    }

    cleanHistory() {
        console.log('========================================');
        console.log('   CLAUDE HISTORY MANAGER');
        console.log('========================================\n');

        // Load config
        const config = this.loadConfig();
        if (!config) {
            console.error('[-] Could not load config');
            return false;
        }

        // Check if projects exists
        if (!config.projects) {
            console.log('[*] No projects section found');
            return true;
        }

        let totalCleaned = 0;

        // Process each project
        for (const projectPath in config.projects) {
            const project = config.projects[projectPath];
            
            if (project.history && Array.isArray(project.history)) {
                const originalCount = project.history.length;
                
                if (originalCount > this.maxHistoryItems) {
                    // Archive old history
                    const toArchive = project.history.slice(0, -this.maxHistoryItems);
                    this.archiveHistory(toArchive);
                    
                    // Keep only recent items
                    project.history = project.history.slice(-this.maxHistoryItems);
                    const cleaned = originalCount - project.history.length;
                    totalCleaned += cleaned;
                    
                    console.log(`[+] Project: ${projectPath}`);
                    console.log(`    Original: ${originalCount} items`);
                    console.log(`    Kept: ${project.history.length} items`);
                    console.log(`    Archived: ${cleaned} items`);
                } else {
                    console.log(`[*] Project: ${projectPath} - Already clean (${originalCount} items)`);
                }
            }
        }

        if (totalCleaned > 0) {
            // Save cleaned config
            if (this.saveConfig(config)) {
                console.log(`\n[+] Success! Cleaned ${totalCleaned} history items`);
                
                // Show file size reduction
                this.showFileSizeReduction();
            } else {
                console.log('\n[-] Failed to save cleaned config');
                return false;
            }
        } else {
            console.log('\n[*] No cleaning needed');
        }

        return true;
    }

    showFileSizeReduction() {
        try {
            const stats = fs.statSync(this.configPath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`[*] New .claude.json size: ${sizeKB} KB`);
            
            if (this.historyArchiveFile && fs.existsSync(this.historyArchiveFile)) {
                const archiveStats = fs.statSync(this.historyArchiveFile);
                const archiveSizeKB = (archiveStats.size / 1024).toFixed(2);
                console.log(`[*] Archive size: ${archiveSizeKB} KB`);
            }
        } catch (error) {
            // Ignore size calculation errors
        }
    }

    // Monitor mode - runs continuously
    startMonitoring(intervalMinutes = 30) {
        console.log(`[+] Starting history monitoring (checks every ${intervalMinutes} minutes)\n`);
        
        // Initial clean
        this.cleanHistory();
        
        // Schedule periodic checks
        setInterval(() => {
            console.log(`\n[*] Running scheduled history check...`);
            this.cleanHistory();
        }, intervalMinutes * 60 * 1000);
    }

    // Hook mode - to be called after each conversation
    hookClean() {
        const config = this.loadConfig();
        if (!config) return;

        let needsSave = false;

        for (const projectPath in config.projects) {
            const project = config.projects[projectPath];
            
            if (project.history && project.history.length > this.maxHistoryItems) {
                // Quick clean without archive
                project.history = project.history.slice(-this.maxHistoryItems);
                needsSave = true;
                console.log(`[+] Auto-cleaned history for: ${projectPath}`);
            }
        }

        if (needsSave) {
            this.saveConfig(config);
        }
    }

    // Get history statistics
    getStats() {
        const config = this.loadConfig();
        if (!config || !config.projects) return null;

        const stats = {
            totalProjects: 0,
            totalHistoryItems: 0,
            projects: []
        };

        for (const projectPath in config.projects) {
            const project = config.projects[projectPath];
            if (project.history) {
                stats.totalProjects++;
                stats.totalHistoryItems += project.history.length;
                stats.projects.push({
                    path: projectPath,
                    historyCount: project.history.length
                });
            }
        }

        return stats;
    }
}

// Export for use
module.exports = ClaudeHistoryManager;

// CLI usage
if (require.main === module) {
    const manager = new ClaudeHistoryManager();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'clean';

    switch (command) {
        case 'clean':
            manager.cleanHistory();
            break;
        case 'monitor':
            manager.startMonitoring();
            break;
        case 'stats':
            const stats = manager.getStats();
            console.log('History Statistics:');
            console.log(JSON.stringify(stats, null, 2));
            break;
        case 'hook':
            manager.hookClean();
            break;
        default:
            console.log('Usage: node claude-history-manager.js [clean|monitor|stats|hook]');
    }
}