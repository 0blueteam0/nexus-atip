/**
 * Metrics Collector - Performance data collection and dashboard generation
 * K-Drive only paths, no C-Drive references
 */

const fs = require('fs');
const path = require('path');

class MetricsCollector {
    constructor() {
        this.dataPath = 'K:\\PortableApps\\Claude-Code\\brain\\metrics';
        this.dashboardPath = 'K:\\PortableApps\\Claude-Code\\dashboard';
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.dataPath, this.dashboardPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    collectAllMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            assessments: this.loadAssessments(),
            patterns: this.loadPatterns(),
            dailyStats: this.calculateDailyStats(),
            trends: this.analyzeTrends(),
            toolUsage: this.analyzeToolUsage(),
            systemInfo: this.getSystemInfo()
        };
        
        return metrics;
    }

    loadAssessments() {
        const assessmentFile = `${this.dataPath}\\assessments.jsonl`;
        const assessments = [];
        
        if (fs.existsSync(assessmentFile)) {
            const lines = fs.readFileSync(assessmentFile, 'utf8').split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    try {
                        assessments.push(JSON.parse(line));
                    } catch (e) {
                        console.error('Failed to parse assessment:', e.message);
                    }
                }
            });
        }
        
        return assessments;
    }

    loadPatterns() {
        const patternsFile = 'K:\\PortableApps\\Claude-Code\\brain\\patterns.json';
        
        try {
            if (fs.existsSync(patternsFile)) {
                return JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to load patterns:', e.message);
        }
        
        return { 
            evolution: 1, 
            averageProactivity: 0, 
            techniques: {},
            proactivityTrend: []
        };
    }

    calculateDailyStats() {
        const assessments = this.loadAssessments();
        const today = new Date().toDateString();
        
        const todayAssessments = assessments.filter(a => 
            new Date(a.timestamp).toDateString() === today
        );
        
        const stats = {
            totalToday: todayAssessments.length,
            averageProactivityToday: 0,
            techniquesUsedToday: new Set(),
            sessionsToday: new Set()
        };
        
        if (todayAssessments.length > 0) {
            const proactivitySum = todayAssessments
                .map(a => a.proactivityLevel || 0)
                .reduce((a, b) => a + b, 0);
            
            stats.averageProactivityToday = (proactivitySum / todayAssessments.length).toFixed(1);
            
            todayAssessments.forEach(a => {
                if (a.cuttingEdgeApplied) stats.techniquesUsedToday.add(a.cuttingEdgeApplied);
                if (a.sessionId) stats.sessionsToday.add(a.sessionId);
            });
        }
        
        stats.uniqueTechniques = stats.techniquesUsedToday.size;
        stats.uniqueSessions = stats.sessionsToday.size;
        
        return stats;
    }

    analyzeTrends() {
        const assessments = this.loadAssessments();
        
        // 최근 30일 트렌드
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recent = assessments.filter(a => 
            new Date(a.timestamp) > thirtyDaysAgo
        );
        
        // 일별 평균 계산
        const dailyAverages = {};
        recent.forEach(a => {
            const date = a.timestamp.split('T')[0];
            if (!dailyAverages[date]) {
                dailyAverages[date] = { 
                    sum: 0, 
                    count: 0,
                    techniques: new Set(),
                    maxLevel: 0
                };
            }
            if (a.proactivityLevel) {
                dailyAverages[date].sum += a.proactivityLevel;
                dailyAverages[date].count++;
                dailyAverages[date].maxLevel = Math.max(dailyAverages[date].maxLevel, a.proactivityLevel);
            }
            if (a.cuttingEdgeApplied) {
                dailyAverages[date].techniques.add(a.cuttingEdgeApplied);
            }
        });
        
        const trends = Object.entries(dailyAverages).map(([date, data]) => ({
            date,
            average: data.count > 0 ? (data.sum / data.count).toFixed(1) : 0,
            maxLevel: data.maxLevel,
            techniqueCount: data.techniques.size,
            assessmentCount: data.count
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // 트렌드 분석
        if (trends.length >= 7) {
            const lastWeek = trends.slice(-7);
            const previousWeek = trends.slice(-14, -7);
            
            const lastWeekAvg = lastWeek.reduce((sum, t) => sum + parseFloat(t.average), 0) / lastWeek.length;
            const prevWeekAvg = previousWeek.length > 0 ? 
                previousWeek.reduce((sum, t) => sum + parseFloat(t.average), 0) / previousWeek.length : 0;
            
            return {
                daily: trends,
                weeklyComparison: {
                    lastWeek: lastWeekAvg.toFixed(1),
                    previousWeek: prevWeekAvg.toFixed(1),
                    trend: lastWeekAvg > prevWeekAvg ? '📈 Improving' : 
                           lastWeekAvg < prevWeekAvg ? '📉 Declining' : '📊 Stable'
                }
            };
        }
        
        return { daily: trends, weeklyComparison: null };
    }

    analyzeToolUsage() {
        const toolPatterns = 'K:\\PortableApps\\Claude-Code\\brain\\tool-patterns.json';
        const contextHistory = 'K:\\PortableApps\\Claude-Code\\brain\\context-history.jsonl';
        
        const usage = {
            mcpServers: {},
            contexts: {},
            suggestions: []
        };
        
        // MCP 서버 사용 현황
        try {
            const config = JSON.parse(fs.readFileSync('K:\\PortableApps\\Claude-Code\\.claude.json', 'utf8'));
            if (config.mcpServers) {
                Object.keys(config.mcpServers).forEach(server => {
                    usage.mcpServers[server] = 'Active';
                });
            }
        } catch (e) {}
        
        // 컨텍스트 사용 빈도
        if (fs.existsSync(contextHistory)) {
            const lines = fs.readFileSync(contextHistory, 'utf8').split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    try {
                        const entry = JSON.parse(line);
                        if (entry.context) {
                            entry.context.split(',').forEach(ctx => {
                                usage.contexts[ctx] = (usage.contexts[ctx] || 0) + 1;
                            });
                        }
                    } catch (e) {}
                }
            });
        }
        
        // 도구 추천 로드
        if (fs.existsSync(toolPatterns)) {
            try {
                const patterns = JSON.parse(fs.readFileSync(toolPatterns, 'utf8'));
                if (patterns.suggestions) {
                    usage.suggestions = patterns.suggestions.slice(-5);
                }
            } catch (e) {}
        }
        
        return usage;
    }

    getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: Math.round(process.uptime() / 60) + ' minutes',
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            },
            timestamp: new Date().toISOString()
        };
    }

    generateDashboardHTML() {
        const metrics = this.collectAllMetrics();
        
        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Paradigm Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
            to { text-shadow: 2px 2px 20px rgba(255,255,255,0.5); }
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .card h2 {
            margin-bottom: 15px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metric {
            font-size: 2.5em;
            font-weight: bold;
            color: #ffd700;
            text-align: center;
            margin: 15px 0;
        }
        .sub-metric {
            font-size: 0.9em;
            opacity: 0.8;
            text-align: center;
        }
        .chart {
            min-height: 200px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 15px;
            margin-top: 10px;
        }
        .progress-bar {
            height: 30px;
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00ccff);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            position: relative;
        }
        .progress-fill.high {
            background: linear-gradient(90deg, #ffdd00, #ff6b00);
        }
        .progress-fill.low {
            background: linear-gradient(90deg, #ff4444, #cc0000);
        }
        .techniques-list {
            list-style: none;
            margin-top: 10px;
        }
        .techniques-list li {
            padding: 8px;
            margin: 5px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
        }
        .badge {
            background: rgba(255,215,0,0.3);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
        }
        .trend-indicator {
            display: inline-block;
            margin-left: 10px;
            font-size: 1.2em;
        }
        .timestamp {
            text-align: center;
            opacity: 0.7;
            margin-top: 20px;
            font-size: 0.9em;
        }
        .chart-bar {
            display: flex;
            align-items: flex-end;
            height: 150px;
            gap: 5px;
            margin-top: 10px;
        }
        .bar {
            flex: 1;
            background: linear-gradient(to top, #00ff88, #00ccff);
            border-radius: 5px 5px 0 0;
            min-height: 20px;
            position: relative;
            transition: all 0.3s;
        }
        .bar:hover {
            filter: brightness(1.2);
        }
        .bar-label {
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.7em;
            opacity: 0.7;
        }
        .mcp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .mcp-item {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            font-size: 0.9em;
        }
        .mcp-item.active {
            background: rgba(0,255,136,0.2);
            border: 1px solid rgba(0,255,136,0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Claude Bottom-up Paradigm Dashboard</h1>
        
        <div class="grid">
            <!-- Proactivity Card -->
            <div class="card">
                <h2>📊 Average Proactivity</h2>
                <div class="metric">${metrics.patterns?.averageProactivity || '0'}/10</div>
                <div class="progress-bar">
                    <div class="progress-fill ${parseFloat(metrics.patterns?.averageProactivity) >= 8 ? 'high' : parseFloat(metrics.patterns?.averageProactivity) < 6 ? 'low' : ''}" 
                         style="width: ${(metrics.patterns?.averageProactivity || 0) * 10}%">
                        ${Math.round((metrics.patterns?.averageProactivity || 0) * 10)}%
                    </div>
                </div>
                <div class="sub-metric">
                    Today: ${metrics.dailyStats.averageProactivityToday || '0'}/10
                    ${metrics.trends.weeklyComparison ? `<span class="trend-indicator">${metrics.trends.weeklyComparison.trend}</span>` : ''}
                </div>
            </div>
            
            <!-- Evolution Card -->
            <div class="card">
                <h2>🧬 Evolution Level</h2>
                <div class="metric">Gen ${Math.floor(metrics.patterns?.evolution || 1)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((metrics.patterns?.evolution % 1) * 100)}%">
                        ${((metrics.patterns?.evolution % 1) * 100).toFixed(0)}% to next
                    </div>
                </div>
                <div class="sub-metric">
                    Evolution Rate: ${((metrics.patterns?.evolution || 1) * 0.01).toFixed(3)}/session
                </div>
            </div>
            
            <!-- Daily Stats Card -->
            <div class="card">
                <h2>📅 Today's Performance</h2>
                <div class="metric">${metrics.dailyStats.totalToday}</div>
                <div class="sub-metric">Assessments Today</div>
                <ul class="techniques-list">
                    <li>Sessions <span class="badge">${metrics.dailyStats.uniqueSessions}</span></li>
                    <li>Techniques <span class="badge">${metrics.dailyStats.uniqueTechniques}</span></li>
                    <li>Avg Level <span class="badge">${metrics.dailyStats.averageProactivityToday}/10</span></li>
                </ul>
            </div>
            
            <!-- Total Assessments Card -->
            <div class="card">
                <h2>💡 Total Assessments</h2>
                <div class="metric">${metrics.assessments?.length || 0}</div>
                <div class="chart">
                    <div class="chart-bar">
                        ${metrics.trends.daily.slice(-7).map(t => `
                            <div class="bar" style="height: ${t.average * 10}%" title="${t.date}: ${t.average}/10">
                                <span class="bar-label">${new Date(t.date).getDate()}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="sub-metric" style="margin-top: 25px;">
                        Last 7 days trend
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Techniques Card -->
        <div class="card">
            <h2>🔧 Cutting Edge Techniques</h2>
            <div class="grid" style="grid-template-columns: 1fr 1fr;">
                <div>
                    <h3 style="font-size: 1.1em; margin-bottom: 10px;">Most Used</h3>
                    <ul class="techniques-list">
                        ${Object.entries(metrics.patterns?.techniques || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([tech, count]) => `
                                <li>${tech} <span class="badge">${count}x</span></li>
                            `).join('') || '<li>No techniques recorded yet</li>'}
                    </ul>
                </div>
                <div>
                    <h3 style="font-size: 1.1em; margin-bottom: 10px;">Recent Contexts</h3>
                    <ul class="techniques-list">
                        ${Object.entries(metrics.toolUsage.contexts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([ctx, count]) => `
                                <li>${ctx} <span class="badge">${count}x</span></li>
                            `).join('') || '<li>No context data</li>'}
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- MCP Servers Card -->
        <div class="card">
            <h2>🔌 MCP Servers Status</h2>
            <div class="mcp-grid">
                ${Object.entries(metrics.toolUsage.mcpServers).map(([server, status]) => `
                    <div class="mcp-item ${status === 'Active' ? 'active' : ''}">
                        ${server}
                    </div>
                `).join('') || '<div class="mcp-item">No MCP servers configured</div>'}
            </div>
        </div>
        
        <!-- Weekly Comparison -->
        ${metrics.trends.weeklyComparison ? `
        <div class="card">
            <h2>📈 Weekly Performance</h2>
            <div class="grid" style="grid-template-columns: 1fr 1fr;">
                <div style="text-align: center;">
                    <div class="sub-metric">Last Week</div>
                    <div class="metric">${metrics.trends.weeklyComparison.lastWeek}/10</div>
                </div>
                <div style="text-align: center;">
                    <div class="sub-metric">Previous Week</div>
                    <div class="metric">${metrics.trends.weeklyComparison.previousWeek}/10</div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 1.5em;">
                ${metrics.trends.weeklyComparison.trend}
            </div>
        </div>
        ` : ''}
        
        <!-- System Info -->
        <div class="card">
            <h2>💻 System Information</h2>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div>Node: ${metrics.systemInfo.nodeVersion}</div>
                <div>Platform: ${metrics.systemInfo.platform}</div>
                <div>Memory: ${metrics.systemInfo.memory.used} / ${metrics.systemInfo.memory.total}</div>
                <div>Uptime: ${metrics.systemInfo.uptime}</div>
            </div>
        </div>
        
        <div class="timestamp">
            Last Updated: ${new Date().toLocaleString('ko-KR')}<br>
            Auto-refresh in <span id="countdown">30</span> seconds
        </div>
    </div>
    
    <script>
        // Countdown timer
        let countdown = 30;
        const countdownEl = document.getElementById('countdown');
        
        setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            if (countdown <= 0) {
                location.reload();
            }
        }, 1000);
        
        // Smooth animations on load
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s, transform 0.5s';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    </script>
</body>
</html>`;
        
        fs.writeFileSync(`${this.dashboardPath}\\index.html`, html);
        console.log(`✅ Dashboard generated: ${this.dashboardPath}\\index.html`);
        
        return html;
    }

    generateJSONReport() {
        const metrics = this.collectAllMetrics();
        const reportFile = `${this.dataPath}\\metrics-${new Date().toISOString().split('T')[0]}.json`;
        
        fs.writeFileSync(reportFile, JSON.stringify(metrics, null, 2));
        console.log(`📊 Metrics saved: ${reportFile}`);
        
        return metrics;
    }
}

module.exports = MetricsCollector;

// 직접 실행 시
if (require.main === module) {
    const collector = new MetricsCollector();
    
    console.log('📊 Collecting metrics...\n');
    const metrics = collector.generateJSONReport();
    
    console.log('🎨 Generating dashboard...\n');
    collector.generateDashboardHTML();
    
    console.log('\n✨ Metrics collection complete!');
    console.log(`📈 Total assessments: ${metrics.assessments.length}`);
    console.log(`🧬 Evolution level: ${metrics.patterns.evolution}`);
    console.log(`📊 Average proactivity: ${metrics.patterns.averageProactivity}/10`);
}