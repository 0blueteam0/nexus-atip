/**
 * AUTO-ORGANIZE-CONTINUOUS
 * Continuously monitors and organizes files/folders
 * Runs every 10 minutes to keep everything tidy
 */

const fs = require('fs');
const path = require('path');

class AutoOrganizer {
    constructor() {
        this.baseDir = 'K:/PortableApps/Claude-Code';
        this.rules = {
            // Essential files that stay in root
            essential: ['claude.bat', 'CLAUDE.md', 'package.json', 'package-lock.json', '.bashrc', '.bash_profile', 'shell-snapshots', 'index.html'],
            
            // File patterns and their destinations
            patterns: {
                'FIX-*.bat': '_ARCHIVE/today/',
                'TEST-*.bat': '_ARCHIVE/today/',
                'DEBUG-*.bat': '_ARCHIVE/today/',
                'TEMP-*.bat': '_ARCHIVE/today/',
                '*.backup*': '_ARCHIVE/backups/',
                '*.tmp': '_TEMP/',
                '*.log': '_TEMP/logs/',
                '*.ps1': '_ARCHIVE/scripts/',
                '*.py': '_ARCHIVE/scripts/',
            },
            
            // Folder organization rules
            folders: {
                'mcp-servers': '_SYSTEM/',
                'tools': '_SYSTEM/',
                'documentation': '_SYSTEM/',
                'systems': '_ACTIVE/scripts/',
                'scripts': '_ACTIVE/scripts/',
                'hooks': '_ACTIVE/scripts/',
                'projects': '_ACTIVE/',
                'ShrimpData': '_ACTIVE/data/',
                'data': '_ACTIVE/data/',
                'statsig': '_ACTIVE/data/',
                'ARCHIVE': '_ARCHIVE/old/',
                'BACKUP-*': '_ARCHIVE/old/',
                'old': '_ARCHIVE/old/',
                'todos': '_ARCHIVE/old/',
            }
        };
    }

    getToday() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }

    ensureDirectoryStructure() {
        // Create main directories
        const mainDirs = ['_SYSTEM', '_ACTIVE', '_ARCHIVE', '_TEMP'];
        mainDirs.forEach(dir => {
            const fullPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });

        // Create subdirectories
        const subDirs = [
            '_SYSTEM/mcp-servers',
            '_SYSTEM/tools',
            '_SYSTEM/configs',
            '_SYSTEM/documentation',
            '_ACTIVE/scripts',
            '_ACTIVE/projects',
            '_ACTIVE/data',
            `_ARCHIVE/${this.getToday()}`,
            '_ARCHIVE/old',
            '_ARCHIVE/backups',
            '_ARCHIVE/scripts',
            '_TEMP/logs'
        ];

        subDirs.forEach(dir => {
            const fullPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    }

    isEssential(filename) {
        return this.rules.essential.includes(filename);
    }

    matchPattern(filename, pattern) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filename);
    }

    organizeFile(filepath) {
        const filename = path.basename(filepath);
        
        // Skip essential files
        if (this.isEssential(filename)) {
            return;
        }

        // Check against patterns
        for (const [pattern, destination] of Object.entries(this.rules.patterns)) {
            if (this.matchPattern(filename, pattern)) {
                let destPath = destination.replace('today', this.getToday());
                const fullDest = path.join(this.baseDir, destPath);
                
                // Ensure destination exists
                if (!fs.existsSync(fullDest)) {
                    fs.mkdirSync(fullDest, { recursive: true });
                }
                
                // Move file
                const newPath = path.join(fullDest, filename);
                try {
                    fs.renameSync(filepath, newPath);
                    console.log(`[+] Moved: ${filename} -> ${destPath}`);
                } catch (err) {
                    console.log(`[-] Failed to move ${filename}: ${err.message}`);
                }
                return;
            }
        }

        // Default action for unmatched files
        const ext = path.extname(filename);
        if (['.txt', '.md', '.doc', '.pdf'].includes(ext)) {
            this.moveToArchive(filepath, 'documents');
        } else if (['.js', '.bat', '.sh'].includes(ext)) {
            this.moveToActive(filepath, 'scripts');
        }
    }

    organizeFolder(folderPath) {
        const folderName = path.basename(folderPath);
        
        // Check folder rules
        for (const [pattern, destination] of Object.entries(this.rules.folders)) {
            if (this.matchPattern(folderName, pattern)) {
                const fullDest = path.join(this.baseDir, destination);
                
                // Ensure destination exists
                if (!fs.existsSync(fullDest)) {
                    fs.mkdirSync(fullDest, { recursive: true });
                }
                
                // Move folder
                const newPath = path.join(fullDest, folderName);
                try {
                    fs.renameSync(folderPath, newPath);
                    console.log(`[+] Moved folder: ${folderName} -> ${destination}`);
                } catch (err) {
                    console.log(`[-] Failed to move folder ${folderName}: ${err.message}`);
                }
                return;
            }
        }
    }

    moveToArchive(filepath, subdir = '') {
        const filename = path.basename(filepath);
        const destDir = path.join(this.baseDir, '_ARCHIVE', this.getToday(), subdir);
        
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        const newPath = path.join(destDir, filename);
        try {
            fs.renameSync(filepath, newPath);
            console.log(`[+] Archived: ${filename}`);
        } catch (err) {
            console.log(`[-] Failed to archive ${filename}: ${err.message}`);
        }
    }

    moveToActive(filepath, subdir = '') {
        const filename = path.basename(filepath);
        const destDir = path.join(this.baseDir, '_ACTIVE', subdir);
        
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        const newPath = path.join(destDir, filename);
        try {
            fs.renameSync(filepath, newPath);
            console.log(`[+] Moved to active: ${filename}`);
        } catch (err) {
            console.log(`[-] Failed to move ${filename}: ${err.message}`);
        }
    }

    cleanTempFolder() {
        const tempDir = path.join(this.baseDir, '_TEMP');
        if (!fs.existsSync(tempDir)) return;

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        fs.readdirSync(tempDir).forEach(file => {
            const filepath = path.join(tempDir, file);
            const stats = fs.statSync(filepath);
            
            // Delete files older than 1 day
            if (now - stats.mtime > oneDay) {
                try {
                    if (stats.isDirectory()) {
                        fs.rmSync(filepath, { recursive: true });
                    } else {
                        fs.unlinkSync(filepath);
                    }
                    console.log(`[+] Cleaned temp: ${file}`);
                } catch (err) {
                    console.log(`[-] Failed to clean ${file}: ${err.message}`);
                }
            }
        });
    }

    scan() {
        console.log('========================================');
        console.log('   AUTO-ORGANIZE CONTINUOUS');
        console.log(`   Time: ${new Date().toLocaleString()}`);
        console.log('========================================\n');

        // Ensure directory structure exists
        this.ensureDirectoryStructure();

        // Get all items in base directory
        const items = fs.readdirSync(this.baseDir);
        let movedCount = 0;

        for (const item of items) {
            // Skip organized directories
            if (item.startsWith('_') || item === 'node_modules') continue;

            const itemPath = path.join(this.baseDir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                this.organizeFolder(itemPath);
                movedCount++;
            } else if (stats.isFile()) {
                this.organizeFile(itemPath);
                movedCount++;
            }
        }

        // Clean temp folder
        this.cleanTempFolder();

        console.log(`\n[*] Organized ${movedCount} items`);
        console.log('[*] Next scan in 10 minutes...\n');
    }

    start() {
        // Initial scan
        this.scan();

        // Schedule periodic scans every 10 minutes
        setInterval(() => {
            this.scan();
        }, 10 * 60 * 1000);

        console.log('[+] Auto-organize continuous monitoring started');
    }
}

// Export for use
module.exports = AutoOrganizer;

// Run if called directly
if (require.main === module) {
    const organizer = new AutoOrganizer();
    organizer.start();
}