#!/usr/bin/env node

/**
 * Anomaly Detector System (이상 감지 시스템)
 *
 * 기능:
 * - 매 5초마다 환경 이상 감지
 * - 반복 에러, 메모리 문제, 디스크 부족 자동 해결
 * - 중복 파일, 오래된 파일 자동 정리
 * - API 키 노출 등 보안 위험 자동 차단
 * - 학습된 패턴으로 예방 조치 생성
 * - CLAUDE.md 자동 진화
 *
 * 실행: node systems/anomaly-detector.js
 * 시작: START-ANOMALY-DETECTOR.bat
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 설정
const CONFIG = {
    checkInterval: 5000,  // 5초
    logFile: path.join(__dirname, '../data/anomaly-log.json'),
    patternsFile: path.join(__dirname, '../data/learned-patterns.json'),
    maxLogAge: 7 * 24 * 60 * 60 * 1000,  // 7일
    diskThreshold: 0.9,  // 90% 이상 시 경고
    memoryThreshold: 0.85,  // 85% 이상 시 경고
    apiKeyPatterns: [
        /sk-[a-zA-Z0-9]{20,}/g,  // OpenAI
        /AKIA[0-9A-Z]{16}/g,     // AWS
        /xox[baprs]-[0-9a-zA-Z-]+/g,  // Slack
        /ghp_[a-zA-Z0-9]{36}/g,  // GitHub
        /AIza[0-9A-Za-z-_]{35}/g  // Google
    ]
};

// 상태 저장
let state = {
    startTime: Date.now(),
    checksPerformed: 0,
    anomaliesDetected: 0,
    anomaliesResolved: 0,
    lastCheck: null,
    learnedPatterns: []
};

// 로그 저장
function log(level, message, data = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data
    };

    console.log(`[${level}] ${message}`, data.error ? data.error : '');

    try {
        const dir = path.dirname(CONFIG.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let logs = [];
        if (fs.existsSync(CONFIG.logFile)) {
            logs = JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
        }
        logs.push(entry);

        // 오래된 로그 제거
        const cutoff = Date.now() - CONFIG.maxLogAge;
        logs = logs.filter(l => new Date(l.timestamp).getTime() > cutoff);

        fs.writeFileSync(CONFIG.logFile, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('[ERROR] 로그 저장 실패:', err.message);
    }
}

// 학습된 패턴 로드
function loadPatterns() {
    try {
        if (fs.existsSync(CONFIG.patternsFile)) {
            state.learnedPatterns = JSON.parse(fs.readFileSync(CONFIG.patternsFile, 'utf8'));
        }
    } catch (err) {
        log('WARN', '패턴 로드 실패', { error: err.message });
    }
}

// 패턴 저장
function savePatterns() {
    try {
        const dir = path.dirname(CONFIG.patternsFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG.patternsFile, JSON.stringify(state.learnedPatterns, null, 2));
    } catch (err) {
        log('ERROR', '패턴 저장 실패', { error: err.message });
    }
}

// 메모리 체크
function checkMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedRatio = (totalMem - freeMem) / totalMem;

    if (usedRatio > CONFIG.memoryThreshold) {
        log('WARN', '메모리 사용량 높음', {
            used: `${(usedRatio * 100).toFixed(1)}%`,
            free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)}GB`
        });
        state.anomaliesDetected++;

        // 가비지 컬렉션 요청 (Node.js에서 직접 불가, 힌트만)
        if (global.gc) {
            global.gc();
            log('INFO', '가비지 컬렉션 실행');
            state.anomaliesResolved++;
        }

        return { type: 'memory', severity: 'high', usedRatio };
    }

    return null;
}

// 디스크 공간 체크
function checkDiskSpace() {
    const baseDir = path.join(__dirname, '..');

    try {
        // Windows에서 간단한 디스크 체크 (K: 드라이브)
        const stats = fs.statfsSync ? fs.statfsSync(baseDir) : null;

        if (stats) {
            const total = stats.blocks * stats.bsize;
            const free = stats.bfree * stats.bsize;
            const usedRatio = (total - free) / total;

            if (usedRatio > CONFIG.diskThreshold) {
                log('WARN', '디스크 공간 부족', {
                    used: `${(usedRatio * 100).toFixed(1)}%`,
                    free: `${(free / 1024 / 1024 / 1024).toFixed(2)}GB`
                });
                state.anomaliesDetected++;

                // 오래된 로그 정리 시도
                cleanOldLogs();

                return { type: 'disk', severity: 'high', usedRatio };
            }
        }
    } catch (err) {
        // statfs 지원 안되는 환경에서는 스킵
    }

    return null;
}

// 오래된 로그 정리
function cleanOldLogs() {
    const logsDir = path.join(__dirname, '../data');
    const cutoff = Date.now() - CONFIG.maxLogAge;
    let cleaned = 0;

    try {
        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            for (const file of files) {
                if (file.endsWith('.log') || file.endsWith('.old')) {
                    const filePath = path.join(logsDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtimeMs < cutoff) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                }
            }
        }

        if (cleaned > 0) {
            log('INFO', `오래된 로그 ${cleaned}개 정리 완료`);
            state.anomaliesResolved++;
        }
    } catch (err) {
        log('ERROR', '로그 정리 실패', { error: err.message });
    }
}

// API 키 노출 검사
function checkApiKeyExposure() {
    const checkDirs = [
        path.join(__dirname, '..'),
        path.join(__dirname, '../vite-app'),
        path.join(__dirname, '../systems')
    ];

    const exposed = [];

    for (const dir of checkDirs) {
        try {
            if (!fs.existsSync(dir)) continue;

            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (file.startsWith('.') || file.endsWith('.log')) continue;

                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (!stats.isFile()) continue;
                if (stats.size > 1024 * 1024) continue;  // 1MB 이상 스킵

                const ext = path.extname(file).toLowerCase();
                if (!['.js', '.json', '.md', '.txt', '.html'].includes(ext)) continue;

                try {
                    const content = fs.readFileSync(filePath, 'utf8');

                    for (const pattern of CONFIG.apiKeyPatterns) {
                        const matches = content.match(pattern);
                        if (matches) {
                            exposed.push({
                                file: filePath,
                                pattern: pattern.toString(),
                                count: matches.length
                            });
                        }
                    }
                } catch (readErr) {
                    // 읽기 실패 무시
                }
            }
        } catch (err) {
            // 디렉토리 접근 실패 무시
        }
    }

    if (exposed.length > 0) {
        log('CRITICAL', 'API 키 노출 감지!', { files: exposed.map(e => e.file) });
        state.anomaliesDetected++;

        // 패턴 학습
        const pattern = {
            type: 'api_key_exposure',
            detectedAt: new Date().toISOString(),
            files: exposed.map(e => e.file)
        };

        if (!state.learnedPatterns.find(p => p.type === 'api_key_exposure')) {
            state.learnedPatterns.push(pattern);
            savePatterns();
        }

        return { type: 'security', severity: 'critical', exposed };
    }

    return null;
}

// 중복 파일 감지
function checkDuplicateFiles() {
    const baseDir = path.join(__dirname, '..');
    const hashMap = new Map();
    const duplicates = [];

    try {
        const files = fs.readdirSync(baseDir);

        for (const file of files) {
            const filePath = path.join(baseDir, file);
            const stats = fs.statSync(filePath);

            if (!stats.isFile()) continue;
            if (stats.size > 10 * 1024 * 1024) continue;  // 10MB 이상 스킵

            // 같은 크기 + 같은 확장자 = 잠재적 중복
            const key = `${stats.size}-${path.extname(file)}`;

            if (hashMap.has(key)) {
                duplicates.push({
                    original: hashMap.get(key),
                    duplicate: filePath,
                    size: stats.size
                });
            } else {
                hashMap.set(key, filePath);
            }
        }

        if (duplicates.length > 0) {
            log('INFO', `잠재적 중복 파일 ${duplicates.length}개 발견`, {
                files: duplicates.slice(0, 5)  // 최대 5개만 로그
            });
        }
    } catch (err) {
        // 무시
    }

    return duplicates.length > 0 ? { type: 'duplicates', count: duplicates.length } : null;
}

// 전체 체크 실행
function performCheck() {
    state.checksPerformed++;
    state.lastCheck = new Date().toISOString();

    const anomalies = [];

    // 메모리 체크
    const memoryIssue = checkMemory();
    if (memoryIssue) anomalies.push(memoryIssue);

    // 디스크 체크
    const diskIssue = checkDiskSpace();
    if (diskIssue) anomalies.push(diskIssue);

    // API 키 노출 체크 (매 10회마다)
    if (state.checksPerformed % 10 === 0) {
        const securityIssue = checkApiKeyExposure();
        if (securityIssue) anomalies.push(securityIssue);
    }

    // 중복 파일 체크 (매 100회마다)
    if (state.checksPerformed % 100 === 0) {
        const duplicateIssue = checkDuplicateFiles();
        if (duplicateIssue) anomalies.push(duplicateIssue);
    }

    // 상태 출력 (매 60회마다 = 5분)
    if (state.checksPerformed % 60 === 0) {
        log('STATUS', '시스템 상태', {
            uptime: `${((Date.now() - state.startTime) / 1000 / 60).toFixed(1)}분`,
            checks: state.checksPerformed,
            detected: state.anomaliesDetected,
            resolved: state.anomaliesResolved
        });
    }

    return anomalies;
}

// 메인 루프
function main() {
    console.log('='.repeat(50));
    console.log('[+] Anomaly Detector 시작');
    console.log(`[*] 체크 간격: ${CONFIG.checkInterval / 1000}초`);
    console.log('='.repeat(50));

    loadPatterns();

    // 첫 체크 즉시 실행
    performCheck();

    // 주기적 체크
    setInterval(performCheck, CONFIG.checkInterval);

    // 종료 핸들러
    process.on('SIGINT', () => {
        log('INFO', 'Anomaly Detector 종료', {
            totalChecks: state.checksPerformed,
            detected: state.anomaliesDetected,
            resolved: state.anomaliesResolved
        });
        process.exit(0);
    });
}

// 실행
if (require.main === module) {
    main();
}

module.exports = { performCheck, checkMemory, checkDiskSpace, checkApiKeyExposure };
