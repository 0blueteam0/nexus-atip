#!/usr/bin/env node

/**
 * Auto Executor System (자동 실행 시스템)
 *
 * 기능:
 * - 메인 자율 시스템
 * - 시스템 자동 시작
 * - 자가 복구 기능
 * - 서비스 상태 모니터링
 * - 자동 재시작
 *
 * 실행: node systems/auto-executor.js
 * 시작: AUTO-STARTUP.bat
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    baseDir: path.join(__dirname, '..'),
    checkInterval: 30000,  // 30초
    maxRestartAttempts: 3,
    restartCooldown: 60000,  // 1분
    stateFile: path.join(__dirname, '../data/executor-state.json'),
    logFile: path.join(__dirname, '../data/executor-log.json')
};

// 관리 대상 서비스 정의
const SERVICES = [
    {
        name: 'anomaly-detector',
        script: path.join(__dirname, 'anomaly-detector.js'),
        enabled: true,
        critical: false,
        autoRestart: true
    },
    {
        name: 'supabase-keep-alive',
        script: path.join(__dirname, 'supabase-keep-alive.js'),
        enabled: true,
        critical: false,
        autoRestart: true
    }
];

// 상태
let state = {
    startTime: Date.now(),
    services: {},
    restartAttempts: {},
    lastCheck: null
};

// 로그 저장
function log(level, message, data = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data
    };

    console.log(`[${level}] ${new Date().toLocaleTimeString()} - ${message}`);
    if (Object.keys(data).length > 0) {
        console.log('    ', JSON.stringify(data));
    }

    try {
        const dir = path.dirname(CONFIG.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let logs = [];
        if (fs.existsSync(CONFIG.logFile)) {
            try {
                logs = JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
            } catch (e) {
                logs = [];
            }
        }

        logs.push(entry);

        // 최근 1000개 로그만 유지
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        fs.writeFileSync(CONFIG.logFile, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('[ERROR] 로그 저장 실패:', err.message);
    }
}

// 상태 저장
function saveState() {
    try {
        const dir = path.dirname(CONFIG.stateFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const saveData = {
            ...state,
            savedAt: new Date().toISOString(),
            services: {}
        };

        // 프로세스 객체는 저장 불가, 상태만 저장
        for (const [name, svc] of Object.entries(state.services)) {
            saveData.services[name] = {
                name: svc.name,
                running: svc.running,
                startedAt: svc.startedAt,
                pid: svc.process ? svc.process.pid : null
            };
        }

        fs.writeFileSync(CONFIG.stateFile, JSON.stringify(saveData, null, 2));
    } catch (err) {
        log('ERROR', '상태 저장 실패', { error: err.message });
    }
}

// 상태 로드
function loadState() {
    try {
        if (fs.existsSync(CONFIG.stateFile)) {
            const loaded = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
            state.restartAttempts = loaded.restartAttempts || {};
            log('INFO', '이전 상태 로드 완료');
        }
    } catch (err) {
        log('WARN', '상태 로드 실패', { error: err.message });
    }
}

// 서비스 시작
function startService(serviceDef) {
    if (!serviceDef.enabled) {
        log('INFO', `서비스 비활성화됨: ${serviceDef.name}`);
        return false;
    }

    if (!fs.existsSync(serviceDef.script)) {
        log('ERROR', `스크립트 없음: ${serviceDef.name}`, { script: serviceDef.script });
        return false;
    }

    // 이미 실행 중인지 확인
    if (state.services[serviceDef.name]?.running) {
        log('INFO', `이미 실행 중: ${serviceDef.name}`);
        return true;
    }

    try {
        const nodeExe = process.execPath;
        const child = spawn(nodeExe, [serviceDef.script], {
            cwd: CONFIG.baseDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        state.services[serviceDef.name] = {
            name: serviceDef.name,
            running: true,
            process: child,
            startedAt: new Date().toISOString(),
            restarts: (state.services[serviceDef.name]?.restarts || 0)
        };

        // stdout 로깅
        child.stdout?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) {
                console.log(`  [${serviceDef.name}] ${msg}`);
            }
        });

        // stderr 로깅
        child.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) {
                console.error(`  [${serviceDef.name}:ERR] ${msg}`);
            }
        });

        // 종료 핸들러
        child.on('exit', (code, signal) => {
            log('WARN', `서비스 종료: ${serviceDef.name}`, { code, signal });
            state.services[serviceDef.name].running = false;
            state.services[serviceDef.name].process = null;

            // 자동 재시작
            if (serviceDef.autoRestart && code !== 0) {
                scheduleRestart(serviceDef);
            }
        });

        child.on('error', (err) => {
            log('ERROR', `서비스 에러: ${serviceDef.name}`, { error: err.message });
            state.services[serviceDef.name].running = false;
        });

        log('INFO', `서비스 시작: ${serviceDef.name}`, { pid: child.pid });
        saveState();
        return true;

    } catch (err) {
        log('ERROR', `서비스 시작 실패: ${serviceDef.name}`, { error: err.message });
        return false;
    }
}

// 서비스 중지
function stopService(serviceName) {
    const svc = state.services[serviceName];
    if (!svc || !svc.running || !svc.process) {
        log('INFO', `서비스 미실행: ${serviceName}`);
        return true;
    }

    try {
        svc.process.kill('SIGTERM');
        svc.running = false;
        log('INFO', `서비스 중지: ${serviceName}`);
        saveState();
        return true;
    } catch (err) {
        log('ERROR', `서비스 중지 실패: ${serviceName}`, { error: err.message });
        return false;
    }
}

// 재시작 스케줄
function scheduleRestart(serviceDef) {
    const name = serviceDef.name;
    state.restartAttempts[name] = (state.restartAttempts[name] || 0) + 1;

    if (state.restartAttempts[name] > CONFIG.maxRestartAttempts) {
        log('ERROR', `재시작 한도 초과: ${name}`, {
            attempts: state.restartAttempts[name],
            max: CONFIG.maxRestartAttempts
        });
        return;
    }

    log('INFO', `재시작 예약: ${name}`, {
        attempt: state.restartAttempts[name],
        delay: `${CONFIG.restartCooldown / 1000}초`
    });

    setTimeout(() => {
        startService(serviceDef);
    }, CONFIG.restartCooldown);
}

// 상태 체크
function checkServices() {
    state.lastCheck = new Date().toISOString();
    let allHealthy = true;

    for (const serviceDef of SERVICES) {
        const svc = state.services[serviceDef.name];

        if (serviceDef.enabled && (!svc || !svc.running)) {
            log('WARN', `서비스 다운 감지: ${serviceDef.name}`);
            allHealthy = false;

            if (serviceDef.autoRestart) {
                scheduleRestart(serviceDef);
            }
        }
    }

    // 5분마다 상태 요약
    const uptime = (Date.now() - state.startTime) / 1000 / 60;
    if (Math.floor(uptime) % 5 === 0 && Math.floor(uptime) > 0) {
        const runningCount = Object.values(state.services).filter(s => s.running).length;
        log('STATUS', '시스템 상태', {
            uptime: `${uptime.toFixed(1)}분`,
            services: `${runningCount}/${SERVICES.length} 실행 중`,
            healthy: allHealthy
        });
    }

    saveState();
    return allHealthy;
}

// 모든 서비스 시작
function startAllServices() {
    log('INFO', '모든 서비스 시작 중...');

    for (const serviceDef of SERVICES) {
        if (serviceDef.enabled) {
            startService(serviceDef);
        }
    }
}

// 모든 서비스 중지
function stopAllServices() {
    log('INFO', '모든 서비스 중지 중...');

    for (const name of Object.keys(state.services)) {
        stopService(name);
    }
}

// 자가 복구 (환경 체크)
function selfHeal() {
    // 데이터 디렉토리 확인
    const dataDir = path.join(CONFIG.baseDir, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        log('INFO', '데이터 디렉토리 생성됨');
    }

    // 로그 파일 크기 체크
    if (fs.existsSync(CONFIG.logFile)) {
        const stats = fs.statSync(CONFIG.logFile);
        if (stats.size > 10 * 1024 * 1024) {  // 10MB 이상
            // 로그 순환
            const backupPath = CONFIG.logFile + '.old';
            fs.renameSync(CONFIG.logFile, backupPath);
            log('INFO', '로그 파일 순환 완료');
        }
    }

    // 재시작 카운터 리셋 (1시간마다)
    const uptime = Date.now() - state.startTime;
    if (uptime > 60 * 60 * 1000) {
        state.restartAttempts = {};
    }
}

// 메인
function main() {
    console.log('='.repeat(50));
    console.log('[+] Auto Executor 시작');
    console.log(`[*] 체크 간격: ${CONFIG.checkInterval / 1000}초`);
    console.log(`[*] 관리 대상: ${SERVICES.length}개 서비스`);
    console.log('='.repeat(50));

    loadState();
    selfHeal();
    startAllServices();

    // 주기적 체크
    setInterval(() => {
        selfHeal();
        checkServices();
    }, CONFIG.checkInterval);

    // 종료 핸들러
    process.on('SIGINT', () => {
        log('INFO', 'Auto Executor 종료 중...');
        stopAllServices();
        saveState();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        log('INFO', 'Auto Executor 종료 (SIGTERM)');
        stopAllServices();
        saveState();
        process.exit(0);
    });
}

// 실행
if (require.main === module) {
    main();
}

module.exports = {
    startService,
    stopService,
    startAllServices,
    stopAllServices,
    checkServices,
    SERVICES
};
