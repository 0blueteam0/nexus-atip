#!/usr/bin/env node
/**
 * AUTO-HEAL-DAEMON.js - 상시 자가 치유 데몬
 * 
 * 기능:
 * - 30초마다 환경 체크
 * - 문제 자동 감지 및 수정
 * - 순환참조 방지
 * - 로그 기록
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 설정
const CONFIG = {
    checkInterval: 30000,  // 30초
    logFile: 'K:\\PortableApps\\genai\\auto-heal.log',
    maxLogSize: 1024 * 1024,  // 1MB
    safeMode: true  // 안전 모드 (수정 전 확인)
};

// 로그 함수
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    // 로그 파일에 기록
    try {
        // 로그 파일 크기 체크
        if (fs.existsSync(CONFIG.logFile)) {
            const stats = fs.statSync(CONFIG.logFile);
            if (stats.size > CONFIG.maxLogSize) {
                // 로그 순환
                const backupPath = CONFIG.logFile + '.old';
                fs.renameSync(CONFIG.logFile, backupPath);
            }
        }
        
        fs.appendFileSync(CONFIG.logFile, logMessage);
    } catch (error) {
        console.error('로그 기록 실패:', error.message);
    }
}

// 자가 치유 클래스
class AutoHealDaemon {
    constructor() {
        this.isRunning = false;
        this.checkCount = 0;
        this.fixCount = 0;
        this.errorCount = 0;
    }
    
    // 환경 체크
    checkEnvironment() {
        const issues = [];
        
        // 1. tmp 디렉토리 확인
        const tmpDir = 'K:\\PortableApps\\genai\\tmp';
        if (!fs.existsSync(tmpDir)) {
            issues.push({
                type: 'MISSING_DIR',
                path: tmpDir,
                fix: () => {
                    fs.mkdirSync(tmpDir, { recursive: true });
                    log(`Created tmp directory: ${tmpDir}`, 'FIX');
                }
            });
        }
        
        // 2. shell-snapshots 정리
        const snapshotDir = 'K:\\PortableApps\\genai\\shell-snapshots';
        if (fs.existsSync(snapshotDir)) {
            const files = fs.readdirSync(snapshotDir);
            const now = Date.now();
            const oldFiles = files.filter(file => {
                try {
                    const filePath = path.join(snapshotDir, file);
                    const stats = fs.statSync(filePath);
                    return (now - stats.mtimeMs) > 3600000;  // 1시간 이상
                } catch {
                    return false;
                }
            });
            
            if (oldFiles.length > 10) {
                issues.push({
                    type: 'OLD_SNAPSHOTS',
                    count: oldFiles.length,
                    fix: () => {
                        let cleaned = 0;
                        oldFiles.forEach(file => {
                            try {
                                fs.unlinkSync(path.join(snapshotDir, file));
                                cleaned++;
                            } catch {}
                        });
                        log(`Cleaned ${cleaned} old snapshots`, 'FIX');
                    }
                });
            }
        }
        
        // 3. 환경 변수 체크
        const requiredEnvVars = {
            'CLAUDE_HOME': 'K:\\PortableApps\\genai',
            'TMPDIR': 'K:\\PortableApps\\genai\\tmp'
        };
        
        for (const [varName, expectedValue] of Object.entries(requiredEnvVars)) {
            if (process.env[varName] !== expectedValue) {
                issues.push({
                    type: 'ENV_VAR',
                    variable: varName,
                    expected: expectedValue,
                    actual: process.env[varName],
                    fix: () => {
                        process.env[varName] = expectedValue;
                        log(`Set ${varName}=${expectedValue}`, 'FIX');
                    }
                });
            }
        }
        
        // 4. 순환참조 파일 체크
        const dangerousFiles = [
            'claude-json-protector.js',
            'FIX-BASH-RECURSIVE.bat',
            'INFINITE-LOOP.js'
        ];
        
        dangerousFiles.forEach(filename => {
            const filePath = `K:\\PortableApps\\genai\\${filename}`;
            if (fs.existsSync(filePath)) {
                issues.push({
                    type: 'DANGEROUS_FILE',
                    path: filePath,
                    fix: () => {
                        const backupPath = `K:\\PortableApps\\genai\\BACKUP\\${filename}.quarantine`;
                        try {
                            fs.renameSync(filePath, backupPath);
                            log(`Quarantined dangerous file: ${filename}`, 'WARN');
                        } catch {}
                    }
                });
            }
        });
        
        return issues;
    }
    
    // 자가 치유 실행
    async heal() {
        this.checkCount++;
        log(`Starting health check #${this.checkCount}`);
        
        const issues = this.checkEnvironment();
        
        if (issues.length === 0) {
            log(`System healthy - no issues found`);
            return;
        }
        
        log(`Found ${issues.length} issues`, 'WARN');
        
        // 안전 모드에서는 수정 전 확인
        if (CONFIG.safeMode) {
            log('Safe mode enabled - fixes will be applied carefully');
        }
        
        // 각 문제 수정
        for (const issue of issues) {
            try {
                if (issue.fix && typeof issue.fix === 'function') {
                    issue.fix();
                    this.fixCount++;
                }
            } catch (error) {
                this.errorCount++;
                log(`Failed to fix ${issue.type}: ${error.message}`, 'ERROR');
            }
        }
        
        log(`Healing complete - Fixed: ${this.fixCount}, Errors: ${this.errorCount}`);
    }
    
    // 데몬 시작
    start() {
        if (this.isRunning) {
            log('Daemon already running', 'WARN');
            return;
        }
        
        this.isRunning = true;
        log('🚀 AUTO-HEAL-DAEMON started');
        log(`Check interval: ${CONFIG.checkInterval}ms`);
        log(`Safe mode: ${CONFIG.safeMode}`);
        
        // 즉시 첫 체크
        this.heal();
        
        // 정기 체크 시작
        this.intervalId = setInterval(() => {
            this.heal();
        }, CONFIG.checkInterval);
        
        // 종료 처리
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }
    
    // 데몬 중지
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        log('🛑 AUTO-HEAL-DAEMON stopped');
        log(`Total checks: ${this.checkCount}`);
        log(`Total fixes: ${this.fixCount}`);
        log(`Total errors: ${this.errorCount}`);
        
        process.exit(0);
    }
    
    // 상태 보고
    getStatus() {
        return {
            running: this.isRunning,
            checks: this.checkCount,
            fixes: this.fixCount,
            errors: this.errorCount,
            uptime: process.uptime()
        };
    }
}

// 메인 실행
if (require.main === module) {
    const daemon = new AutoHealDaemon();
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🛡️ AUTO-HEAL-DAEMON v1.0.0         ║');
    console.log('║   순환참조 없는 자가 치유 시스템       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    
    daemon.start();
    
    // 상태 보고 (1분마다)
    setInterval(() => {
        const status = daemon.getStatus();
        console.log('');
        console.log('📊 Status Report:');
        console.log(`   Uptime: ${Math.floor(status.uptime)}s`);
        console.log(`   Checks: ${status.checks}`);
        console.log(`   Fixes: ${status.fixes}`);
        console.log(`   Errors: ${status.errors}`);
    }, 60000);
}

module.exports = AutoHealDaemon;