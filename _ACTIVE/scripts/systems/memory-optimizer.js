#!/usr/bin/env node
/**
 * Memory Optimizer - 메모리 최적화 시스템
 * 자동 가비지 컬렉션 및 캐시 관리
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class MemoryOptimizer {
    constructor() {
        this.threshold = 0.8; // 80% 메모리 사용 시 정리
        this.cacheDir = 'K:\\PortableApps\\genai\\cache';
        this.monitoring = false;
    }
    
    // 메모리 상태 체크
    checkMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedPercent = (totalMem - freeMem) / totalMem;
        
        return {
            total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
            free: Math.round(freeMem / 1024 / 1024 / 1024 * 10) / 10,
            used: Math.round((totalMem - freeMem) / 1024 / 1024 / 1024 * 10) / 10,
            percent: Math.round(usedPercent * 100)
        };
    }
    
    // 자동 정리
    async autoClean() {
        const memory = this.checkMemory();
        console.log(`📊 Memory: ${memory.used}GB / ${memory.total}GB (${memory.percent}%)`);
        
        if (memory.percent > this.threshold * 100) {
            console.log('⚠️  High memory usage detected! Cleaning...');
            
            // 1. 임시 파일 정리
            this.cleanTempFiles();
            
            // 2. 오래된 로그 압축
            this.compressOldLogs();
            
            // 3. 캐시 정리
            this.cleanCache();
            
            // 4. Node.js 가비지 컬렉션 강제 실행
            if (global.gc) {
                global.gc();
                console.log('♻️  Garbage collection executed');
            }
            
            // 5. Windows 메모리 정리
            this.windowsMemoryClean();
            
            const newMemory = this.checkMemory();
            const freed = memory.used - newMemory.used;
            console.log(`✅ Freed ${freed.toFixed(1)}GB of memory`);
        }
    }
    
    // 임시 파일 정리
    cleanTempFiles() {
        const tempDirs = [
            'K:\\PortableApps\\genai\\tmp',
            'K:\\PortableApps\\genai\\shell-snapshots'
        ];
        
        let cleaned = 0;
        tempDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                const now = Date.now();
                
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);
                    const age = now - stats.mtimeMs;
                    
                    // 1시간 이상 된 임시 파일 삭제
                    if (age > 3600000) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                });
            }
        });
        
        if (cleaned > 0) {
            console.log(`🗑️  Cleaned ${cleaned} temp files`);
        }
    }
    
    // 오래된 로그 압축
    compressOldLogs() {
        const logDir = 'K:\\PortableApps\\genai\\logs';
        if (!fs.existsSync(logDir)) return;
        
        const files = fs.readdirSync(logDir);
        const oldLogs = files.filter(f => f.endsWith('.log'));
        
        if (oldLogs.length > 10) {
            // 오래된 로그를 archive 폴더로 이동
            const archiveDir = path.join(logDir, 'archive');
            if (!fs.existsSync(archiveDir)) {
                fs.mkdirSync(archiveDir);
            }
            
            oldLogs.slice(0, -5).forEach(log => {
                const src = path.join(logDir, log);
                const dest = path.join(archiveDir, log);
                fs.renameSync(src, dest);
            });
            
            console.log(`📦 Archived ${oldLogs.length - 5} old logs`);
        }
    }
    
    // 캐시 정리
    cleanCache() {
        if (!fs.existsSync(this.cacheDir)) return;
        
        // NPM 캐시 정리
        exec('npm cache clean --force', (err) => {
            if (!err) console.log('🧹 NPM cache cleaned');
        });
        
        // 커스텀 캐시 정리
        const files = fs.readdirSync(this.cacheDir);
        files.forEach(file => {
            fs.unlinkSync(path.join(this.cacheDir, file));
        });
    }
    
    // Windows 메모리 정리
    windowsMemoryClean() {
        // Windows 메모리 압축
        exec('compact /c /s:K:\\PortableApps\\genai\\tmp /i', () => {});
        
        // 작업 세트 정리
        exec('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', () => {});
    }
    
    // 모니터링 시작
    startMonitoring(interval = 60000) { // 1분마다
        this.monitoring = true;
        console.log('🔍 Memory monitoring started');
        
        this.monitorInterval = setInterval(() => {
            this.autoClean();
        }, interval);
        
        // 초기 체크
        this.autoClean();
    }
    
    // 모니터링 중지
    stopMonitoring() {
        this.monitoring = false;
        clearInterval(this.monitorInterval);
        console.log('🛑 Memory monitoring stopped');
    }
    
    // 상태 리포트
    generateReport() {
        const memory = this.checkMemory();
        const report = `
╔════════════════════════════════════════╗
║         MEMORY STATUS REPORT           ║
╠════════════════════════════════════════╣
║ Total Memory:    ${memory.total.toFixed(1)} GB           ║
║ Used Memory:     ${memory.used.toFixed(1)} GB (${memory.percent}%)     ║
║ Free Memory:     ${memory.free.toFixed(1)} GB           ║
╠════════════════════════════════════════╣
║ Status: ${memory.percent > 80 ? '⚠️  HIGH' : memory.percent > 60 ? '⚡ MODERATE' : '✅ GOOD'}                      ║
╚════════════════════════════════════════╝`;
        
        return report;
    }
}

// CLI
if (require.main === module) {
    const optimizer = new MemoryOptimizer();
    const command = process.argv[2];
    
    switch(command) {
        case 'monitor':
            optimizer.startMonitoring();
            process.on('SIGINT', () => {
                optimizer.stopMonitoring();
                process.exit(0);
            });
            break;
            
        case 'clean':
            optimizer.autoClean();
            break;
            
        case 'status':
            console.log(optimizer.generateReport());
            break;
            
        default:
            console.log(`
Memory Optimizer - 메모리 최적화

Usage:
  node memory-optimizer.js monitor  - 자동 모니터링 시작
  node memory-optimizer.js clean    - 즉시 정리
  node memory-optimizer.js status   - 상태 확인
            `);
    }
}

module.exports = MemoryOptimizer;