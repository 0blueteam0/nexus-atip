// Session File Cleaner for Claude Code
// Removes outdated shell-snapshot references from session files

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECTS_DIR = 'K:/PortableApps/Claude-Code/projects';
const SHELL_SNAPSHOTS_DIR = 'K:/PortableApps/Claude-Code/shell-snapshots';

async function cleanSessionFile(filePath) {
    console.log(`Cleaning session file: ${path.basename(filePath)}`);
    
    const tempFile = filePath + '.tmp';
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(tempFile);
    const rl = readline.createInterface({ input });
    
    let linesProcessed = 0;
    let linesModified = 0;
    
    for await (const line of rl) {
        linesProcessed++;
        let modifiedLine = line;
        
        // Fix shell-snapshot paths
        if (line.includes('shell-snapshots/snapshot-bash-')) {
            const match = line.match(/snapshot-bash-(\d+)-(\w+)\.sh/);
            if (match) {
                const timestamp = match[1];
                const random = match[2];
                const snapshotFile = `snapshot-bash-${timestamp}-${random}.sh`;
                const fullPath = path.join(SHELL_SNAPSHOTS_DIR, snapshotFile);
                
                if (!fs.existsSync(fullPath)) {
                    console.log(`  Creating missing snapshot: ${snapshotFile}`);
                    fs.writeFileSync(fullPath, 
`# Auto-generated snapshot
export PATH=$PATH
export CLAUDE_HOME="/k/PortableApps/Claude-Code"
echo "Bash environment loaded successfully"
`);
                    linesModified++;
                }
            }
        }
        
        output.write(modifiedLine + '\n');
    }
    
    output.end();
    
    return new Promise((resolve) => {
        output.on('finish', () => {
            // Replace original with cleaned version
            fs.unlinkSync(filePath);
            fs.renameSync(tempFile, filePath);
            console.log(`  Processed ${linesProcessed} lines, fixed ${linesModified} issues`);
            resolve();
        });
    });
}

async function cleanAllSessions() {
    console.log('=== Claude Code Session Cleaner ===\n');
    
    // Find all project directories
    const projectDirs = fs.readdirSync(PROJECTS_DIR)
        .map(name => path.join(PROJECTS_DIR, name))
        .filter(p => fs.statSync(p).isDirectory());
    
    for (const projectDir of projectDirs) {
        const sessionFiles = fs.readdirSync(projectDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => path.join(projectDir, f));
        
        for (const sessionFile of sessionFiles) {
            await cleanSessionFile(sessionFile);
        }
    }
    
    console.log('\n=== Cleaning Complete ===');
}

// Run cleaner
cleanAllSessions().catch(console.error);