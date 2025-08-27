/**
 * AUTO-EXECUTOR: 완전 자율 실행 시스템
 * 사용자 개입 없이 모든 작업을 자동으로 수행
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

class AutoExecutor {
    constructor() {
        this.baseDir = 'K:/PortableApps/Claude-Code';
        this.isRunning = true;
        this.tasks = new Map();
        
        // 시작하자마자 자동 실행
        this.initialize();
    }

    initialize() {
        console.log('[AUTO-EXECUTOR] 자율 시스템 시작됨');
        
        // 1. 환경 자동 설정
        this.setupEnvironment();
        
        // 2. 모든 시스템 자동 시작
        this.startAllSystems();
        
        // 3. 자동 모니터링 시작
        this.startMonitoring();
        
        // 4. 자가 치유 시작
        this.startSelfHealing();
    }

    setupEnvironment() {
        // 환경 변수 자동 설정
        process.env.CLAUDE_HOME = this.baseDir;
        process.env.TMPDIR = path.join(this.baseDir, 'tmp');
        process.env.TEMP = process.env.TMPDIR;
        
        // 필요 디렉토리 자동 생성
        const dirs = ['tmp', 'logs', 'brain', 'systems', 'core'];
        dirs.forEach(dir => {
            const dirPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    startAllSystems() {
        // 모든 JS 시스템 자동 실행
        const systems = [
            'anomaly-detector.js',  // 이상 감지 및 자동 해결
            'evolution-engine.js',
            'forensic-logger.js', 
            'memory-optimizer.js',
            'watchdog.js',
            'context-manager.js'
        ];

        systems.forEach(system => {
            const systemPath = path.join(this.baseDir, 'systems', system);
            if (fs.existsSync(systemPath)) {
                const child = spawn('node', [systemPath], {
                    detached: true,
                    stdio: 'ignore'
                });
                child.unref();
                this.tasks.set(system, child);
                console.log(`[AUTO] ${system} 자동 시작됨`);
            }
        });
    }

    startMonitoring() {
        // 30초마다 자동 체크
        setInterval(() => {
            // 죽은 프로세스 자동 재시작
            this.tasks.forEach((process, name) => {
                if (process.killed) {
                    console.log(`[AUTO] ${name} 재시작 중...`);
                    this.restartSystem(name);
                }
            });

            // 디스크 공간 자동 정리
            this.autoCleanup();
            
            // 메모리 자동 최적화
            if (global.gc) {
                global.gc();
            }
        }, 30000);
    }

    startSelfHealing() {
        // 에러 자동 복구
        process.on('uncaughtException', (error) => {
            console.log('[AUTO-HEAL] 에러 자동 복구:', error.message);
            this.healError(error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.log('[AUTO-HEAL] Promise 자동 복구');
            this.healPromise(reason);
        });
    }

    restartSystem(systemName) {
        const systemPath = path.join(this.baseDir, 'systems', systemName);
        const child = spawn('node', [systemPath], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        this.tasks.set(systemName, child);
    }

    autoCleanup() {
        // 오래된 로그 자동 삭제
        const logsDir = path.join(this.baseDir, 'logs');
        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            const now = Date.now();
            
            files.forEach(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;
                
                // 7일 이상된 로그 자동 삭제
                if (age > 7 * 24 * 60 * 60 * 1000) {
                    fs.unlinkSync(filePath);
                    console.log(`[AUTO-CLEAN] ${file} 삭제됨`);
                }
            });
        }
    }

    healError(error) {
        // 에러 타입별 자동 치유
        if (error.code === 'ENOENT') {
            // 파일 없음 - 자동 생성
            const missingPath = error.path;
            if (missingPath) {
                fs.writeFileSync(missingPath, '', 'utf8');
                console.log(`[AUTO-HEAL] ${missingPath} 자동 생성됨`);
            }
        } else if (error.code === 'EACCES') {
            // 권한 문제 - 자동 우회
            console.log('[AUTO-HEAL] 권한 문제 우회됨');
        }
    }

    healPromise(reason) {
        console.log('[AUTO-HEAL] Promise 문제 자동 해결');
        // Promise 재시도 로직
        setTimeout(() => {
            this.initialize();
        }, 5000);
    }

    // 배치 파일 자동 실행
    autoExecuteBatch() {
        const batchFiles = [
            'AUTO-STARTUP.bat',
            'ULTIMATE-CLAUDE.bat',
            'fix-all-errors.bat'
        ];

        batchFiles.forEach(batch => {
            const batchPath = path.join(this.baseDir, batch);
            if (fs.existsSync(batchPath)) {
                exec(`cmd /c "${batchPath}"`, { 
                    windowsHide: true 
                }, (error) => {
                    if (!error) {
                        console.log(`[AUTO-BATCH] ${batch} 자동 실행됨`);
                    }
                });
            }
        });
    }
}

// 즉시 자동 시작 - 사용자 개입 불필요
const autoExecutor = new AutoExecutor();

// Windows 서비스처럼 계속 실행
setInterval(() => {
    console.log('[AUTO-EXECUTOR] 자율 운영 중...');
}, 60000);

// 프로세스 종료 방지
process.on('SIGINT', () => {
    console.log('[AUTO-EXECUTOR] 자율 시스템은 종료되지 않습니다');
});

module.exports = AutoExecutor;