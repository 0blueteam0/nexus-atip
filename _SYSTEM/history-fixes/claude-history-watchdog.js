/**
 * Claude History Watchdog
 * Monitors .claude.json and removes history field as soon as it appears
 * This is a workaround for Claude Code bug that writes history to config file
 */

const fs = require('fs');
const path = require('path');

class ClaudeHistoryWatchdog {
    constructor() {
        this.configPath = 'K:/PortableApps/Claude-Code/.claude.json';
        this.lastClean = Date.now();
        this.cleanCount = 0;
    }

    cleanHistory() {
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(content);
            
            let hasHistory = false;
            
            // Check for history in projects
            if (config.projects) {
                for (const project in config.projects) {
                    if (config.projects[project].history) {
                        delete config.projects[project].history;
                        hasHistory = true;
                    }
                }
            }
            
            // Remove other buggy fields
            if (config.tipsHistory && Object.keys(config.tipsHistory).length > 5) {
                // Keep only first 5 tips
                const tips = Object.keys(config.tipsHistory).slice(0, 5);
                const newTips = {};
                tips.forEach(tip => {
                    newTips[tip] = config.tipsHistory[tip];
                });
                config.tipsHistory = newTips;
                hasHistory = true;
            }
            
            if (hasHistory) {
                // Save cleaned config
                fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
                this.cleanCount++;
                
                const now = new Date().toLocaleTimeString();
                console.log(`[${now}] Removed history (Clean #${this.cleanCount})`);
                
                return true;
            }
            
            return false;
        } catch (error) {
            // Ignore errors (file might be locked)
            return false;
        }
    }

    watch() {
        console.log('========================================');
        console.log('   CLAUDE HISTORY WATCHDOG');
        console.log('   Preventing history accumulation bug');
        console.log('========================================\n');
        console.log('[+] Watching .claude.json for changes...\n');

        // Initial clean
        this.cleanHistory();

        // Watch for changes
        fs.watchFile(this.configPath, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                // File changed, clean it
                setTimeout(() => {
                    this.cleanHistory();
                }, 100); // Small delay to ensure write is complete
            }
        });

        // Also run periodic cleanup every 10 seconds
        setInterval(() => {
            this.cleanHistory();
        }, 10000);

        // Status report every minute
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.lastClean) / 1000 / 60);
            console.log(`[*] Watchdog active | Cleaned ${this.cleanCount} times | Uptime: ${uptime} minutes`);
        }, 60000);
    }
}

// Run watchdog
if (require.main === module) {
    const watchdog = new ClaudeHistoryWatchdog();
    watchdog.watch();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n[*] Watchdog stopped');
        process.exit(0);
    });
}