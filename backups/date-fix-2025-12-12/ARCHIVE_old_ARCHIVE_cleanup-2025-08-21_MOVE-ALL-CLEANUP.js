const fs = require('fs');
const path = require('path');

const rootDir = 'K:\\PortableApps\\genai';
const archiveDir = path.join(rootDir, 'ARCHIVE', 'cleanup-2025-01-21');

// 이동할 파일 목록
const filesToMove = [
    // FIX 파일들
    'fix-bash-env.bat', 'FIX-BASH-FROM-POWERSHELL.ps1', 'FIX-BASH-WITH-POWERSHELL.ps1',
    'fix-bash.bat', 'FIX-CLAUDE-BASH.js', 'FIX-CLAUDE-BUG.bat', 'FIX-GIT-BASH-PATH.bat',
    'FIX-K-DRIVE-MOUNT.js', 'fix-k-mount.sh', 'FIX-PORTABLE-GIT.bat', 'fix-shell-snapshot.bat',
    'FIX-TIMESTAMP.js', 'fix-wsl-mount.bat', 'FINAL-BASH-FIX.bat', 'FINAL-FIX-ENVIRONMENT.bat',
    'FINAL-FIX.bat',
    
    // TEST 파일들
    'TEST-AND-SAVE.bat', 'test-bash-direct.bat', 'TEST-BASH-PATHS.bat', 'TEST-CLAUDE-DIRECT.js',
    'test-claude-version.bat', 'TEST-DIRECT-NOW.bat', 'TEST-DIRECT.ps1', 'TEST-MCP-SERVERS.js',
    'TEST-NOW.js', 'TEST-POWERSHELL-ENV.ps1', 'test-timestamp-final.ps1', 'test-timestamp.js',
    
    // VERIFY 파일들
    'VERIFY-19-MCP.bat', 'VERIFY-ALL-FIXES.bat', 'VERIFY-ALL-PATHS.js', 'VERIFY-CLAUDE.bat',
    'VERIFY-K-TOOLS.bat', 'VERIFY-TIMESTAMPS.js',
    
    // RUN 파일들
    'RUN-ANALYSIS.bat', 'run-cleanup.bat', 'RUN-DETECTION.bat', 'RUN-FIX.bat',
    'RUN-MCP-CHECK.bat', 'RUN-POWERSHELL.ps1', 'run-safe-monitor.bat', 'RUN-TEST.bat',
    'run-timestamp-test.bat', 'RUN-VERIFY.bat',
    
    // CHECK 파일들
    'CHECK-19-MCP.js', 'CHECK-EXTERNAL-TOOLS.bat', 'CHECK-GIT-PATH.bat',
    'CHECK-MCP-DIRECT.js', 'CHECK-RECENT-FILES.js', 'CHECK-RESOURCES.js',
    
    // CLEANUP 파일들
    'cleanup-all.js', 'CLEANUP-COMMANDS.txt', 'cleanup-google-search.ps1',
    'CLEANUP-JUNK.js', 'CLEANUP-PHASE2.txt', 'CLEANUP-TXT-FILES.txt',
    
    // 기타 임시 파일들
    'ULTIMATE-AUTO-FIX.bat', 'ULTIMATE-BASH-FIX.bat', 'ULTIMATE-FIX-PORTABLE.bat',
    'UPDATE-MCP-PATHS.js', 'UPDATE-TO-K-TOOLS.bat', 'TRACE-BASH-EXECUTION.js',
    'START-AUTO-HEAL.bat', 'START-POWERSHELL.bat', 'START-ULTIMATE.bat',
    'switch-to-powershell.ps1', 'simple-test.js', 'SET-PORTABLE-GIT-BASH.bat',
    'set-api-keys.bat', 'RESTORE-CLAUDE-CODE.bat', 'remove-google-search-from-config.js',
    'REALTIME-DIAGNOSTIC.js', 'python-direct.bat', 'pwsh.bat', 'POWERSHELL-MAIN.ps1',
    'POWERSHELL-EXECUTOR.ps1', 'OPTIMIZE-RESOURCES.bat', 'ONE-FIX-ALL.bat',
    'node-direct.bat', 'MONITOR-LIVE.js', 'MASTER-CLEANUP-PLAN.txt',
    'INSTALL-CLAUDE-PORTABLE.bat', 'init-sqlite.js', 'init-sqlite.bat',
    'init-bash.sh', 'init-bash-windows.bat', 'git.bat', 'FORCE-C-TMP.bat',
    'EXECUTE-TEST.ps1', 'EXECUTE-ALL-FIXES.js', 'EVIDENCE-REORGANIZE.txt',
    'EVIDENCE-PRESERVATION.txt', 'ENABLE-PORTABLE-GIT.bat', 'EMERGENCY-TEST.bat',
    'DOCS-MODULE-CONSOLIDATION.txt', 'DISABLE-WSL-BASH.bat', 'DISABLE-BASH.bat',
    'DIRECT-TEST.ps1', 'direct-node-test.bat', 'direct-claude-test.js',
    'DETECT-ERRORS.js', 'DETECT-BASH-ISSUE.js', 'delete-google-search.js',
    'delete-google-search.bat', 'comprehensive-timestamp-test.bat',
    'claude-ps.bat', 'claude-optimized.bat', 'CLAUDE-MD-FIXES.txt',
    'claude-k-tools.bat', 'claude-fixed.bat', 'CLAUDE-FINAL.bat',
    'claude-direct.bat', 'CLAUDE-CODE-BUG-REPORT.md', 'c.bat',
    'bash.bat', 'AUTO-VERIFY-ALL.bat', 'AUTO-CHECK.js',
    'ANALYZE-PORTABLE-ENVIRONMENT.js', 'ANALYZE-MCP.js', 'run-claude.js'
];

console.log('파일 이동 시작...');
let movedCount = 0;
let errorCount = 0;

filesToMove.forEach(fileName => {
    const sourcePath = path.join(rootDir, fileName);
    const destPath = path.join(archiveDir, fileName);
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.renameSync(sourcePath, destPath);
            movedCount++;
            console.log(`✓ ${fileName}`);
        } catch (err) {
            errorCount++;
            console.log(`✗ ${fileName}: ${err.message}`);
        }
    }
});

console.log(`\n완료: ${movedCount}개 이동, ${errorCount}개 실패`);

// 남은 파일 수 확인
const remaining = fs.readdirSync(rootDir);
const files = remaining.filter(f => fs.statSync(path.join(rootDir, f)).isFile());
const dirs = remaining.filter(f => fs.statSync(path.join(rootDir, f)).isDirectory());

console.log(`\n현재 상태:`);
console.log(`- 디렉토리: ${dirs.length}개`);
console.log(`- 파일: ${files.length}개`);