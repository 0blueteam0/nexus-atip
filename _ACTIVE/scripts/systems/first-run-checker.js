/**
 * First Run Checker - Daily paradigm checks and reporting
 * K-Drive only paths, no C-Drive references
 */

const fs = require('fs');
const path = require('path');

class FirstRunChecker {
    constructor() {
        this.lastRunFile = 'K:\\PortableApps\\Claude-Code\\brain\\metrics\\last-run.json';
        this.metricsDir = 'K:\\PortableApps\\Claude-Code\\brain\\metrics';
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.metricsDir)) {
            fs.mkdirSync(this.metricsDir, { recursive: true });
        }
    }

    isFirstRunToday() {
        const today = new Date().toDateString();
        
        try {
            if (fs.existsSync(this.lastRunFile)) {
                const lastRun = JSON.parse(fs.readFileSync(this.lastRunFile, 'utf8'));
                return lastRun.date !== today;
            }
        } catch (e) {
            console.log('First run detected:', e.message);
        }
        
        return true;
    }

    recordRun() {
        const runData = {
            date: new Date().toDateString(),
            timestamp: new Date().toISOString(),
            sessionCount: 1
        };
        
        // 오늘 이미 실행했다면 세션 카운트 증가
        if (fs.existsSync(this.lastRunFile)) {
            try {
                const existing = JSON.parse(fs.readFileSync(this.lastRunFile, 'utf8'));
                if (existing.date === runData.date) {
                    runData.sessionCount = (existing.sessionCount || 0) + 1;
                }
            } catch (e) {
                console.error('Error reading last run:', e.message);
            }
        }
        
        fs.writeFileSync(this.lastRunFile, JSON.stringify(runData, null, 2));
        return runData;
    }

    async performDailyChecks() {
        console.log('📊 Performing Daily Paradigm Checks...\n');
        
        const checks = {
            paradigmIntegrity: this.checkParadigmIntegrity(),
            yesterdayMetrics: this.getYesterdayMetrics(),
            evolutionStatus: this.checkEvolution(),
            recommendations: this.generateRecommendations(),
            systemHealth: this.checkSystemHealth()
        };
        
        // 일일 리포트 생성
        this.generateDailyReport(checks);
        
        return checks;
    }

    checkParadigmIntegrity() {
        const requiredFiles = [
            'K:\\PortableApps\\Claude-Code\\CLAUDE.md',
            'K:\\PortableApps\\Claude-Code\\modules\\@bottom-up-paradigm.md',
            'K:\\PortableApps\\Claude-Code\\modules\\@precision-comparison-format.md',
            'K:\\PortableApps\\Claude-Code\\claude.bat',
            'K:\\PortableApps\\Claude-Code\\systems\\smart-suggest.js',
            'K:\\PortableApps\\Claude-Code\\systems\\assessment-recorder.js'
        ];
        
        const integrity = requiredFiles.map(file => {
            const exists = fs.existsSync(file);
            let size = 0;
            let modified = null;
            
            if (exists) {
                const stats = fs.statSync(file);
                size = stats.size;
                modified = stats.mtime.toISOString();
            }
            
            return {
                file: path.basename(file),
                exists,
                size,
                modified
            };
        });
        
        return {
            allPresent: integrity.every(i => i.exists),
            totalSize: integrity.reduce((sum, i) => sum + i.size, 0),
            files: integrity
        };
    }

    getYesterdayMetrics() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
        
        const logFile = `${this.metricsDir}\\paradigm-check-${dateStr}.log`;
        
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.split('\n').length;
            const checks = (content.match(/PARADIGM CHECK:/g) || []).length;
            const errors = (content.match(/\[WARNING\]|\[ERROR\]/g) || []).length;
            
            return {
                date: yesterday.toDateString(),
                checkCount: checks,
                errorCount: errors,
                logLines: lines,
                status: errors > 0 ? 'Issues detected' : 'Healthy'
            };
        }
        
        return { 
            date: yesterday.toDateString(), 
            checkCount: 0, 
            errorCount: 0,
            logLines: 0,
            status: 'No data'
        };
    }

    checkEvolution() {
        const patternsFile = 'K:\\PortableApps\\Claude-Code\\brain\\patterns.json';
        const assessmentsFile = 'K:\\PortableApps\\Claude-Code\\brain\\metrics\\assessments.jsonl';
        
        let evolution = { level: 1, averageProactivity: 'N/A', techniques: 0 };
        
        try {
            if (fs.existsSync(patternsFile)) {
                const patterns = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
                evolution.level = patterns.evolution || 1;
                evolution.averageProactivity = patterns.averageProactivity || 'N/A';
                evolution.techniques = Object.keys(patterns.techniques || {}).length;
            }
            
            // 최근 평가 분석
            if (fs.existsSync(assessmentsFile)) {
                const lines = fs.readFileSync(assessmentsFile, 'utf8').split('\n').filter(l => l);
                const recentAssessments = lines.slice(-10).map(l => {
                    try { return JSON.parse(l); } catch(e) { return null; }
                }).filter(a => a);
                
                if (recentAssessments.length > 0) {
                    const avgProactivity = recentAssessments
                        .map(a => a.proactivityLevel || 0)
                        .reduce((a, b) => a + b, 0) / recentAssessments.length;
                    
                    evolution.recentAverage = avgProactivity.toFixed(1);
                    evolution.trend = avgProactivity > parseFloat(evolution.averageProactivity) ? 
                        '📈 Improving' : '📊 Stable';
                }
            }
        } catch (e) {
            console.error('Evolution check error:', e.message);
        }
        
        return evolution;
    }

    checkSystemHealth() {
        const health = {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            kDriveSpace: this.checkDriveSpace()
        };
        
        // 메모리 사용률 계산
        const totalMem = health.memoryUsage.heapTotal;
        const usedMem = health.memoryUsage.heapUsed;
        health.memoryPercent = ((usedMem / totalMem) * 100).toFixed(1) + '%';
        
        // 상태 판단
        health.status = 'Healthy';
        if (parseFloat(health.memoryPercent) > 80) {
            health.status = 'High memory usage';
        }
        
        return health;
    }

    checkDriveSpace() {
        // Windows 전용 드라이브 체크
        try {
            const { execSync } = require('child_process');
            const output = execSync('wmic logicaldisk where caption="K:" get size,freespace', 
                { encoding: 'utf8' });
            
            const lines = output.trim().split('\n');
            if (lines.length > 1) {
                const [freeSpace, totalSize] = lines[1].trim().split(/\s+/).map(Number);
                if (freeSpace && totalSize) {
                    return {
                        free: Math.round(freeSpace / 1024 / 1024 / 1024 * 10) / 10 + ' GB',
                        total: Math.round(totalSize / 1024 / 1024 / 1024 * 10) / 10 + ' GB',
                        percent: Math.round((freeSpace / totalSize) * 100) + '% free'
                    };
                }
            }
        } catch (e) {
            console.error('Drive check error:', e.message);
        }
        
        return { status: 'Unable to check' };
    }

    generateRecommendations() {
        const evolution = this.checkEvolution();
        const recommendations = [];
        
        if (parseFloat(evolution.averageProactivity) < 8) {
            recommendations.push('⚡ Increase proactivity level - aim for 8+ average');
        }
        
        if (evolution.techniques < 5) {
            recommendations.push('🔧 Explore more cutting-edge techniques');
        }
        
        if (evolution.level < 2) {
            recommendations.push('📈 Focus on pattern learning and evolution');
        }
        
        const health = this.checkSystemHealth();
        if (health.status !== 'Healthy') {
            recommendations.push(`⚠️ System health: ${health.status}`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✨ Excellent performance! Keep pushing boundaries');
            recommendations.push('🚀 Consider advanced automation features');
        }
        
        return recommendations;
    }

    generateDailyReport(checks) {
        const report = `
╔════════════════════════════════════════════════╗
║  DAILY PARADIGM REPORT - ${new Date().toDateString()}
╚════════════════════════════════════════════════╝

📁 INTEGRITY CHECK:
${checks.paradigmIntegrity.files.map(f => 
    `  ${f.exists ? '✅' : '❌'} ${f.file} ${f.exists ? `(${f.size} bytes)` : ''}`
).join('\n')}
  Total Size: ${(checks.paradigmIntegrity.totalSize / 1024).toFixed(1)} KB
  Status: ${checks.paradigmIntegrity.allPresent ? '✅ All files present' : '⚠️ Missing files detected'}

📊 YESTERDAY'S METRICS:
  Date: ${checks.yesterdayMetrics.date}
  Paradigm Checks: ${checks.yesterdayMetrics.checkCount}
  Errors/Warnings: ${checks.yesterdayMetrics.errorCount}
  Activity Level: ${checks.yesterdayMetrics.logLines} lines
  Status: ${checks.yesterdayMetrics.status}

🧬 EVOLUTION STATUS:
  Generation: ${checks.evolutionStatus.level.toFixed(2)}
  Average Proactivity: ${checks.evolutionStatus.averageProactivity}/10
  Recent Average: ${checks.evolutionStatus.recentAverage || 'N/A'}/10
  Techniques Mastered: ${checks.evolutionStatus.techniques}
  Trend: ${checks.evolutionStatus.trend || '📊 Stable'}

💻 SYSTEM HEALTH:
  Node Version: ${checks.systemHealth.nodeVersion}
  Memory Usage: ${checks.systemHealth.memoryPercent}
  Uptime: ${Math.round(checks.systemHealth.uptime / 60)} minutes
  K Drive: ${checks.systemHealth.kDriveSpace.percent || 'N/A'}
  Status: ${checks.systemHealth.status}

💡 RECOMMENDATIONS:
${checks.recommendations.map(r => `  ${r}`).join('\n')}

═══════════════════════════════════════════════════
Generated: ${new Date().toLocaleString('ko-KR')}
Session: #${this.recordRun().sessionCount} today
═══════════════════════════════════════════════════
`;
        
        // 리포트 파일 저장
        const reportFile = `${this.metricsDir}\\daily-report-${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(reportFile, report);
        
        // 콘솔 출력
        console.log(report);
        
        return report;
    }
}

module.exports = FirstRunChecker;

// 직접 실행 시
if (require.main === module) {
    const checker = new FirstRunChecker();
    
    if (checker.isFirstRunToday()) {
        console.log('🌅 First run of the day detected!\n');
        checker.performDailyChecks().then(() => {
            console.log('\n✅ Daily checks complete');
        });
    } else {
        const runData = checker.recordRun();
        console.log(`📌 Session #${runData.sessionCount} today`);
        console.log('Already performed daily checks. Run with --force to repeat.\n');
        
        if (process.argv.includes('--force')) {
            checker.performDailyChecks();
        }
    }
}