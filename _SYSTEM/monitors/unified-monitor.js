/**
 * Unified Monitor - Lightweight single process
 * Combines all monitoring in one efficient script
 */

const fs = require('fs');
const path = require('path');

class UnifiedMonitor {
    constructor() {
        this.configPath = 'K:/PortableApps/Claude-Code/.claude.json';
        this.archivePath = 'K:/PortableApps/Claude-Code/_ARCHIVE/auto-scripts';
        this.stats = {
            jsonCleans: 0,
            filesArchived: 0,
            startTime: Date.now()
        };
    }

    // Clean .claude.json history
    cleanJson() {
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(content);
            let modified = false;
            
            // Remove history from projects
            if (config.projects) {
                for (const proj in config.projects) {
                    if (config.projects[proj].history) {
                        delete config.projects[proj].history;
                        modified = true;
                    }
                }
            }
            
            // Limit tipsHistory
            if (config.tipsHistory && Object.keys(config.tipsHistory).length > 5) {
                const tips = Object.keys(config.tipsHistory).slice(0, 5);
                const newTips = {};
                tips.forEach(tip => newTips[tip] = config.tipsHistory[tip]);
                config.tipsHistory = newTips;
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
                this.stats.jsonCleans++;
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // Archive old one-time scripts
    archiveOldScripts() {
        const oneTimePatterns = [
            /^test-.*\.(bat|js)$/i,
            /^temp-.*\.(bat|js)$/i,
            /^debug-.*\.(bat|js)$/i,
            /^fix-.*\.(bat|js)$/i,
            /^cleanup-.*\.(bat|js)$/i
        ];
        
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        let archived = 0;
        
        try {
            const files = fs.readdirSync('.');
            
            for (const file of files) {
                // Check if it's a one-time script
                const isOneTime = oneTimePatterns.some(pattern => pattern.test(file));
                if (!isOneTime) continue;
                
                // Check age
                const stats = fs.statSync(file);
                const age = now - stats.mtime.getTime();
                
                if (age > oneHour) {
                    // Create archive dir if needed
                    if (!fs.existsSync(this.archivePath)) {
                        fs.mkdirSync(this.archivePath, { recursive: true });
                    }
                    
                    // Move to archive
                    const dest = path.join(this.archivePath, file);
                    fs.renameSync(file, dest);
                    archived++;
                    this.stats.filesArchived++;
                }
            }
            
            return archived;
        } catch (e) {
            return 0;
        }
    }

    // Main monitor loop
    async run() {
        console.log('========================================');
        console.log('   UNIFIED MONITOR - LIGHTWEIGHT MODE');
        console.log('   Single process, minimal overhead');
        console.log('========================================\n');
        
        // Main loop - every 30 seconds
        const monitor = () => {
            const cleanedJson = this.cleanJson();
            const archivedFiles = this.archiveOldScripts();
            
            // Only log if something happened
            if (cleanedJson || archivedFiles > 0) {
                const now = new Date().toLocaleTimeString();
                console.log(`[${now}] Actions:`);
                if (cleanedJson) console.log('  - Cleaned .claude.json');
                if (archivedFiles > 0) console.log(`  - Archived ${archivedFiles} scripts`);
            }
        };
        
        // Initial run
        monitor();
        
        // Run every 30 seconds
        const interval = setInterval(monitor, 30000);
        
        // Status report every 5 minutes
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000 / 60);
            console.log(`\n[STATUS] Uptime: ${uptime}m | JSON cleans: ${this.stats.jsonCleans} | Files archived: ${this.stats.filesArchived}`);
        }, 300000);
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n[*] Monitor stopped gracefully');
            clearInterval(interval);
            process.exit(0);
        });
        
        // Keep alive
        process.stdin.resume();
    }
}

// Run if called directly
if (require.main === module) {
    const monitor = new UnifiedMonitor();
    monitor.run();
}