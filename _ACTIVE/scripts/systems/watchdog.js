#!/usr/bin/env node
/**
 * Claude Code Watchdog
 * 실시간 문제 감지 및 자동 복구 시스템
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ClaudeWatchdog {
    constructor() {
        this.baseDir = 'K:\\PortableApps\\Claude-Code';
        this.problems = [];
        this.fixes = 0;
        
        console.log('🐕 Claude Watchdog Started');
        console.log('   Monitoring for problems...\n');
    }
    
    // 문제 감지기
    detectProblems() {
        this.problems = [];
        
        // 1. 스냅샷 디렉토리 체크
        const snapshotDir = path.join(this.baseDir, 'shell-snapshots');
        if (!fs.existsSync(snapshotDir)) {
            this.problems.push({
                type: 'MISSING_DIR',
                path: snapshotDir,
                fix: () => fs.mkdirSync(snapshotDir, { recursive: true })
            });
        }
        
        // 2. tmp 디렉토리 체크
        const tmpDir = path.join(this.baseDir, 'tmp');
        if (!fs.existsSync(tmpDir)) {
            this.problems.push({
                type: 'MISSING_DIR',
                path: tmpDir,
                fix: () => fs.mkdirSync(tmpDir, { recursive: true })
            });
        }
        
        // 3. 오래된 임시 파일 체크
        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir);
            const oldFiles = files.filter(f => f.startsWith('claude-'));
            if (oldFiles.length > 10) {
                this.problems.push({
                    type: 'TOO_MANY_TEMP',
                    count: oldFiles.length,
                    fix: () => {
                        oldFiles.forEach(f => {
                            fs.unlinkSync(path.join(tmpDir, f));
                        });
                    }
                });
            }
        }
        
        // 4. 메모리 사용량 체크
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB 이상
            this.problems.push({
                type: 'HIGH_MEMORY',
                usage: Math.round(memUsage.heapUsed / 1024 / 1024),
                fix: () => {
                    if (global.gc) global.gc();
                }
            });
        }
        
        // 5. 설정 파일 체크
        const configFile = path.join(this.baseDir, '.claude.json');
        if (!fs.existsSync(configFile)) {
            this.problems.push({
                type: 'MISSING_CONFIG',
                fix: () => {
                    console.log('⚠️  Config file missing! Please restore .claude.json');
                }
            });
        }
        
        return this.problems.length;
    }
    
    // 자동 복구
    autoFix() {
        if (this.problems.length === 0) return;
        
        console.log(`\n🔧 Found ${this.problems.length} problems. Auto-fixing...`);
        
        this.problems.forEach(problem => {
            try {
                console.log(`  Fixing: ${problem.type}`);
                problem.fix();
                this.fixes++;
            } catch (e) {
                console.error(`  Failed to fix ${problem.type}: ${e.message}`);
            }
        });
        
        console.log(`✅ Fixed ${this.fixes} issues\n`);
        this.fixes = 0;
    }
    
    // 시스템 상태 리포트
    statusReport() {
        const status = {
            timestamp: new Date().toISOString(),
            directories: {
                snapshots: fs.existsSync(path.join(this.baseDir, 'shell-snapshots')),
                tmp: fs.existsSync(path.join(this.baseDir, 'tmp')),
                logs: fs.existsSync(path.join(this.baseDir, 'logs'))
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            environment: {
                CLAUDE_HOME: process.env.CLAUDE_HOME === this.baseDir,
                TMPDIR: process.env.TMPDIR === path.join(this.baseDir, 'tmp')
            }
        };
        
        return status;
    }
    
    // 감시 시작
    startWatching(interval = 5000) {
        setInterval(() => {
            const problemCount = this.detectProblems();
            if (problemCount > 0) {
                this.autoFix();
            }
        }, interval);
        
        // 상태 리포트 (1분마다)
        setInterval(() => {
            const status = this.statusReport();
            console.log('📊 Status Check:', new Date().toLocaleTimeString());
            console.log('  Memory:', `${status.memory.used}MB / ${status.memory.total}MB`);
            console.log('  Directories:', Object.values(status.directories).every(v => v) ? '✓ All OK' : '⚠ Some missing');
        }, 60000);
        
        // 초기 체크
        this.detectProblems();
        this.autoFix();
    }
}

// 실행
if (require.main === module) {
    const watchdog = new ClaudeWatchdog();
    watchdog.startWatching();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Watchdog stopping...');
        process.exit(0);
    });
    
    console.log('Press Ctrl+C to stop\n');
}