/**
 * Fix .claude.json Bug
 * Removes the buggy history field that shouldn't be there
 * Keeps only proper MCP server configuration
 */

const fs = require('fs');
const path = require('path');

class ClaudeJsonFixer {
    constructor() {
        this.configPath = 'K:/PortableApps/Claude-Code/.claude.json';
        this.backupDir = 'K:/PortableApps/Claude-Code/_ARCHIVE/claude-json-backups';
    }

    backup() {
        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `claude.json.backup-${timestamp}`);
        
        const content = fs.readFileSync(this.configPath, 'utf8');
        fs.writeFileSync(backupPath, content);
        
        console.log(`[+] Backup created: ${backupPath}`);
        
        // Show original file size
        const stats = fs.statSync(this.configPath);
        console.log(`[*] Original file size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        return backupPath;
    }

    analyze() {
        const content = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(content);
        
        console.log('\n[*] Analyzing .claude.json structure:');
        console.log('====================================');
        
        // Check for buggy fields
        const bugs = [];
        
        if (config.projects) {
            console.log('[!] Found "projects" section (BUGGY)');
            
            for (const projectPath in config.projects) {
                const project = config.projects[projectPath];
                if (project.history) {
                    const historyCount = project.history.length;
                    console.log(`    - ${projectPath}: ${historyCount} history items`);
                    bugs.push(`projects.${projectPath}.history`);
                }
            }
        }
        
        if (config.tipsHistory) {
            console.log('[!] Found "tipsHistory" section (should be separate)');
            bugs.push('tipsHistory');
        }
        
        if (config.promptQueueUseCount) {
            console.log('[!] Found "promptQueueUseCount" (runtime data)');
            bugs.push('promptQueueUseCount');
        }
        
        // Check proper fields
        console.log('\n[*] Proper configuration fields:');
        if (config.mcpServers) {
            const serverCount = Object.keys(config.mcpServers).length;
            console.log(`[+] mcpServers: ${serverCount} servers configured`);
        }
        
        if (config.autoUpdates !== undefined) {
            console.log(`[+] autoUpdates: ${config.autoUpdates}`);
        }
        
        if (config.shell) {
            console.log(`[+] shell: ${config.shell}`);
        }
        
        if (config.gitBashPath) {
            console.log(`[+] gitBashPath: ${config.gitBashPath}`);
        }
        
        return bugs;
    }

    fix() {
        console.log('\n[*] Fixing .claude.json...');
        console.log('========================');
        
        // Backup first
        const backupPath = this.backup();
        
        // Load config
        const content = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(content);
        
        // Keep only proper configuration fields
        const cleanConfig = {};
        
        // Essential fields to keep
        const keepFields = [
            'mcpServers',
            'autoUpdates', 
            'shell',
            'gitBashPath',
            'userID',
            'numStartups',
            'installMethod',
            'customApiKeyResponses'
        ];
        
        // Copy only fields we want to keep
        for (const field of keepFields) {
            if (config[field] !== undefined) {
                cleanConfig[field] = config[field];
            }
        }
        
        // Remove buggy projects.history but keep allowedTools if exists
        if (config.projects) {
            cleanConfig.projects = {};
            for (const projectPath in config.projects) {
                if (config.projects[projectPath].allowedTools) {
                    cleanConfig.projects[projectPath] = {
                        allowedTools: config.projects[projectPath].allowedTools
                    };
                }
            }
            // If projects is now empty, remove it
            if (Object.keys(cleanConfig.projects).length === 0) {
                delete cleanConfig.projects;
            }
        }
        
        // Save cleaned config
        const cleanContent = JSON.stringify(cleanConfig, null, 2);
        fs.writeFileSync(this.configPath, cleanContent, 'utf8');
        
        // Show new file size
        const newStats = fs.statSync(this.configPath);
        const originalStats = fs.statSync(backupPath);  // Use the backup path from earlier
        const oldSize = (originalStats.size / 1024).toFixed(2);
        const newSize = (newStats.size / 1024).toFixed(2);
        
        console.log(`\n[+] Fixed successfully!`);
        console.log(`[*] File size: ${oldSize} KB -> ${newSize} KB`);
        console.log(`[*] Removed buggy history fields`);
        console.log(`[*] Kept proper MCP configuration`);
    }

    showSessions() {
        console.log('\n[*] Actual session storage:');
        console.log('==========================');
        
        const sessionsDir = 'K:/PortableApps/Claude-Code/projects/K--PortableApps-Claude-Code';
        
        if (fs.existsSync(sessionsDir)) {
            const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
            
            console.log(`[+] Found ${files.length} session files in:`);
            console.log(`    ${sessionsDir}`);
            
            for (const file of files) {
                const filePath = path.join(sessionsDir, file);
                const stats = fs.statSync(filePath);
                const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
                console.log(`    - ${file}: ${lines} lines, ${(stats.size / 1024).toFixed(2)} KB`);
            }
            
            console.log('\n[*] These JSONL files are the PROPER place for session history!');
        }
    }
}

// Run the fixer
if (require.main === module) {
    const fixer = new ClaudeJsonFixer();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';
    
    switch (command) {
        case 'analyze':
            fixer.analyze();
            fixer.showSessions();
            console.log('\n[?] Run with "fix" to clean the file');
            break;
            
        case 'fix':
            const bugs = fixer.analyze();
            if (bugs.length > 0) {
                fixer.fix();
                fixer.showSessions();
            } else {
                console.log('\n[+] No bugs found! File is clean.');
            }
            break;
            
        case 'backup':
            fixer.backup();
            break;
            
        default:
            console.log('Usage: node fix-claude-json-bug.js [analyze|fix|backup]');
    }
}