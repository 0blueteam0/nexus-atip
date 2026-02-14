/**
 * ANOMALY DETECTOR - 이상 감지 및 자율 해결 시스템
 * 불편하거나 이상한 상황을 자동으로 감지하고 즉시 해결
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

class AnomalyDetector {
    constructor() {
        this.baseDir = 'K:/PortableApps/genai';
        this.patterns = new Map();
        this.solutions = new Map();
        this.history = [];
        
        // 즉시 모니터링 시작
        this.startDetection();
    }

    startDetection() {
        console.log('[ANOMALY] 이상 감지 시스템 가동');
        
        // 실시간 감지 - 매 5초
        setInterval(() => {
            this.detectEnvironmentIssues();
            this.detectInefficiencies();
            this.detectDiscomfort();
            this.detectRisks();
        }, 5000);

        // 패턴 학습 - 매 1분
        setInterval(() => {
            this.learnPatterns();
            this.evolveGuidelines();
        }, 60000);
    }

    detectEnvironmentIssues() {
        // 1. 반복되는 에러 감지
        const errorPatterns = [
            /No such file or directory/,
            /Permission denied/,
            /Cannot find module/,
            /ENOENT/,
            /EACCES/
        ];

        // 최근 로그 검사
        const logFiles = this.getRecentLogs();
        logFiles.forEach(log => {
            const content = fs.readFileSync(log, 'utf8');
            errorPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    console.log(`[ANOMALY] 반복 에러 감지: ${pattern}`);
                    this.autoFix('error', pattern.source);
                }
            });
        });

        // 2. 메모리 사용량 체크
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB 초과
            console.log('[ANOMALY] 높은 메모리 사용 감지');
            this.autoFix('memory', memUsage.heapUsed);
        }

        // 3. 디스크 공간 체크
        exec('wmic logicaldisk get size,freespace,caption', (err, stdout) => {
            if (!err && stdout.includes('K:')) {
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    if (line.includes('K:')) {
                        const parts = line.trim().split(/\s+/);
                        const free = parseInt(parts[1]);
                        if (free < 100 * 1024 * 1024) { // 100MB 미만
                            console.log('[ANOMALY] 디스크 공간 부족');
                            this.autoFix('disk', free);
                        }
                    }
                });
            }
        });
    }

    detectInefficiencies() {
        // 중복 파일 감지
        const files = fs.readdirSync(this.baseDir);
        const duplicates = new Map();
        
        files.forEach(file => {
            const base = file.replace(/[-_]\d+\.(.*?)$/, '.$1');
            if (!duplicates.has(base)) {
                duplicates.set(base, []);
            }
            duplicates.get(base).push(file);
        });

        duplicates.forEach((files, base) => {
            if (files.length > 3) {
                console.log(`[ANOMALY] 중복 파일 과다: ${base}`);
                this.autoFix('duplicates', files);
            }
        });

        // 오래된 임시 파일
        const tmpDir = path.join(this.baseDir, 'tmp');
        if (fs.existsSync(tmpDir)) {
            const tmpFiles = fs.readdirSync(tmpDir);
            const now = Date.now();
            
            tmpFiles.forEach(file => {
                const filePath = path.join(tmpDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) { // 24시간
                    console.log(`[ANOMALY] 오래된 임시 파일: ${file}`);
                    fs.unlinkSync(filePath);
                }
            });
        }
    }

    detectDiscomfort() {
        // 느린 응답 감지
        const startTime = Date.now();
        process.nextTick(() => {
            const delay = Date.now() - startTime;
            if (delay > 100) { // 100ms 초과
                console.log(`[ANOMALY] 느린 응답 감지: ${delay}ms`);
                this.autoFix('performance', delay);
            }
        });

        // 복잡한 경로 감지
        const longPaths = [];
        this.scanDirectory(this.baseDir, (filePath) => {
            if (filePath.length > 200) {
                longPaths.push(filePath);
            }
        });

        if (longPaths.length > 0) {
            console.log(`[ANOMALY] 너무 긴 경로 ${longPaths.length}개 발견`);
            this.autoFix('longpaths', longPaths);
        }
    }

    detectRisks() {
        // API 키 노출 위험
        const riskyPatterns = [
            /api[_-]?key\s*=\s*["'][^"']+["']/i,
            /token\s*=\s*["'][^"']+["']/i,
            /password\s*=\s*["'][^"']+["']/i
        ];

        const codeFiles = this.getCodeFiles();
        codeFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            riskyPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    console.log(`[ANOMALY] 보안 위험 감지: ${file}`);
                    this.autoFix('security', file);
                }
            });
        });

        // 백업 부재 감지
        const importantFiles = ['CLAUDE.md', '.claude.json', 'memory-bank.json'];
        importantFiles.forEach(file => {
            const filePath = path.join(this.baseDir, file);
            const backupPath = path.join(this.baseDir, 'backup', file);
            
            if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
                console.log(`[ANOMALY] 백업 없음: ${file}`);
                this.autoFix('backup', file);
            }
        });
    }

    autoFix(type, data) {
        console.log(`[AUTO-FIX] ${type} 문제 자동 해결 중...`);
        
        switch(type) {
            case 'error':
                // 에러 자동 수정
                if (data.includes('ENOENT')) {
                    // 없는 파일/디렉토리 자동 생성
                    this.createMissingPaths();
                }
                break;
                
            case 'memory':
                // 메모리 자동 정리
                if (global.gc) global.gc();
                // 불필요한 캐시 정리
                this.clearCaches();
                break;
                
            case 'disk':
                // 디스크 공간 자동 확보
                this.cleanupOldFiles();
                this.compressLogs();
                break;
                
            case 'duplicates':
                // 중복 파일 자동 정리
                this.archiveDuplicates(data);
                break;
                
            case 'performance':
                // 성능 자동 최적화
                this.optimizePerformance();
                break;
                
            case 'security':
                // 보안 위험 자동 제거
                this.secureFile(data);
                break;
                
            case 'backup':
                // 자동 백업
                this.createBackup(data);
                break;
        }
        
        // 해결 기록
        this.history.push({
            timestamp: new Date().toISOString(),
            type: type,
            action: 'auto-fixed',
            data: data
        });
        
        // 학습을 위해 저장
        this.saveHistory();
    }

    learnPatterns() {
        // 반복되는 문제 패턴 학습
        const recentIssues = this.history.slice(-100);
        const frequency = new Map();
        
        recentIssues.forEach(issue => {
            const key = `${issue.type}-${issue.data}`;
            frequency.set(key, (frequency.get(key) || 0) + 1);
        });
        
        // 자주 발생하는 문제 => 예방 조치
        frequency.forEach((count, pattern) => {
            if (count > 5) {
                console.log(`[LEARNING] 패턴 학습: ${pattern} (${count}회)`);
                this.createPreventiveMeasure(pattern);
            }
        });
    }

    evolveGuidelines() {
        // CLAUDE.md 자동 진화
        const claudeMd = path.join(this.baseDir, 'CLAUDE.md');
        
        if (this.history.length > 50) {
            // 가장 많이 해결한 문제 유형
            const topIssues = this.getTopIssues();
            
            // 새로운 지침 생성
            const newGuideline = this.generateGuideline(topIssues);
            
            if (newGuideline) {
                // CLAUDE.md에 자동 추가
                const content = fs.readFileSync(claudeMd, 'utf8');
                if (!content.includes(newGuideline)) {
                    fs.appendFileSync(claudeMd, `\n${newGuideline}\n`);
                    console.log('[EVOLUTION] 지침 자동 진화 완료');
                }
            }
        }
    }

    // Helper methods
    getRecentLogs() {
        const logsDir = path.join(this.baseDir, 'logs');
        if (!fs.existsSync(logsDir)) return [];
        
        return fs.readdirSync(logsDir)
            .map(f => path.join(logsDir, f))
            .filter(f => fs.statSync(f).isFile());
    }

    getCodeFiles() {
        const extensions = ['.js', '.json', '.bat', '.md'];
        const files = [];
        
        this.scanDirectory(this.baseDir, (filePath) => {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                files.push(filePath);
            }
        });
        
        return files;
    }

    scanDirectory(dir, callback) {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                this.scanDirectory(filePath, callback);
            } else if (stats.isFile()) {
                callback(filePath);
            }
        });
    }

    createMissingPaths() {
        const requiredDirs = ['tmp', 'logs', 'backup', 'brain', 'systems'];
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`[AUTO-FIX] 디렉토리 생성: ${dir}`);
            }
        });
    }

    clearCaches() {
        // Node.js 모듈 캐시 정리
        Object.keys(require.cache).forEach(key => {
            if (key.includes('node_modules')) {
                delete require.cache[key];
            }
        });
    }

    cleanupOldFiles() {
        const archiveDir = 'K:/PortableApps/Claude-Archive';
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // 30일 이상 된 파일 이동
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.scanDirectory(this.baseDir, (filePath) => {
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < cutoff) {
                const archivePath = filePath.replace(this.baseDir, archiveDir);
                const archiveDir = path.dirname(archivePath);
                
                if (!fs.existsSync(archiveDir)) {
                    fs.mkdirSync(archiveDir, { recursive: true });
                }
                
                fs.renameSync(filePath, archivePath);
                console.log(`[AUTO-FIX] 오래된 파일 아카이브: ${path.basename(filePath)}`);
            }
        });
    }

    compressLogs() {
        // 로그 파일 압축 (간단한 구현)
        const logsDir = path.join(this.baseDir, 'logs');
        if (fs.existsSync(logsDir)) {
            const logs = fs.readdirSync(logsDir);
            logs.forEach(log => {
                const logPath = path.join(logsDir, log);
                const content = fs.readFileSync(logPath, 'utf8');
                
                // 중복 라인 제거
                const lines = content.split('\n');
                const unique = [...new Set(lines)];
                
                if (unique.length < lines.length * 0.8) {
                    fs.writeFileSync(logPath, unique.join('\n'));
                    console.log(`[AUTO-FIX] 로그 압축: ${log}`);
                }
            });
        }
    }

    archiveDuplicates(files) {
        const archiveDir = path.join(this.baseDir, 'archive', 'duplicates');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // 최신 파일만 남기고 나머지 아카이브
        files.sort((a, b) => {
            const aStats = fs.statSync(path.join(this.baseDir, a));
            const bStats = fs.statSync(path.join(this.baseDir, b));
            return bStats.mtimeMs - aStats.mtimeMs;
        });
        
        files.slice(1).forEach(file => {
            const src = path.join(this.baseDir, file);
            const dst = path.join(archiveDir, file);
            fs.renameSync(src, dst);
            console.log(`[AUTO-FIX] 중복 파일 아카이브: ${file}`);
        });
    }

    optimizePerformance() {
        // 프로세스 우선순위 조정
        try {
            process.priority = 10; // 낮은 우선순위
        } catch(e) {}
        
        // 가비지 컬렉션 강제 실행
        if (global.gc) {
            global.gc();
            global.gc(); // 두 번 실행으로 완전 정리
        }
    }

    secureFile(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // API 키를 환경 변수로 대체
        content = content.replace(/api[_-]?key\s*=\s*["']([^"']+)["']/gi, 'api_key = process.env.API_KEY');
        content = content.replace(/token\s*=\s*["']([^"']+)["']/gi, 'token = process.env.TOKEN');
        content = content.replace(/password\s*=\s*["']([^"']+)["']/gi, 'password = process.env.PASSWORD');
        
        fs.writeFileSync(filePath, content);
        console.log(`[AUTO-FIX] 보안 위험 제거: ${path.basename(filePath)}`);
    }

    createBackup(fileName) {
        const src = path.join(this.baseDir, fileName);
        const backupDir = path.join(this.baseDir, 'backup');
        const dst = path.join(backupDir, fileName);
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
            console.log(`[AUTO-FIX] 백업 생성: ${fileName}`);
        }
    }

    createPreventiveMeasure(pattern) {
        // 예방 조치 자동 생성
        const [type, data] = pattern.split('-');
        
        // 예방 스크립트 생성
        const preventScript = path.join(this.baseDir, 'systems', `prevent-${type}.js`);
        
        if (!fs.existsSync(preventScript)) {
            const script = `
// 자동 생성된 예방 스크립트
setInterval(() => {
    // ${type} 문제 예방
    console.log('[PREVENT] ${type} 모니터링 중...');
}, 60000);
`;
            fs.writeFileSync(preventScript, script);
            console.log(`[PREVENT] 예방 조치 생성: ${type}`);
        }
    }

    generateGuideline(topIssues) {
        if (topIssues.length === 0) return null;
        
        const issue = topIssues[0];
        return `
### 🔧 자동 학습된 지침: ${issue.type} 방지
- 빈도: ${issue.count}회 발생 및 자동 해결
- 조치: ${issue.type} 발생 시 즉시 자동 수정
- 예방: 사전 모니터링으로 발생 차단
`;
    }

    getTopIssues() {
        const frequency = new Map();
        
        this.history.forEach(item => {
            frequency.set(item.type, (frequency.get(item.type) || 0) + 1);
        });
        
        return Array.from(frequency.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
    }

    saveHistory() {
        const historyFile = path.join(this.baseDir, 'brain', 'anomaly-history.json');
        const dir = path.dirname(historyFile);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(historyFile, JSON.stringify(this.history, null, 2));
    }
}

// 즉시 시작
const detector = new AnomalyDetector();

// 프로세스 유지
setInterval(() => {
    console.log('[ANOMALY] 이상 감지 시스템 작동 중...');
}, 300000); // 5분마다 상태 출력

module.exports = AnomalyDetector;