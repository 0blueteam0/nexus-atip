/**
 * Tool Collector - MCP 도구 사용 추적
 * 
 * 기능:
 * - ATOS execution-monitor.js 연동
 * - 도구별 사용 횟수, 성공률
 * - 체이닝 패턴 분석
 * - 실시간 통계
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const ATOS_STATS_FILE = path.join(BASE_PATH, 'atos/usage-stats.json');
const ATOS_LOGS_DIR = path.join(BASE_PATH, 'atos/logs');
const TOOLS_LOG_DIR = path.join(BASE_PATH, 'planning-log/tools');

/**
 * 디렉토리 안전하게 생성
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * JSON 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${filePath}: ${e.message}`);
    }
    return defaultValue;
}

/**
 * ATOS 통계 로드
 */
function loadATOSStats() {
    return safeReadJSON(ATOS_STATS_FILE, {
        tools: {},
        globalStats: {},
        chainingPatterns: { patterns: [] },
        sessions: { history: [] }
    });
}

/**
 * planning-log/tools/에서 최근 N일 데이터 로드
 */
function loadRecentToolLogs(days = 7) {
    ensureDir(TOOLS_LOG_DIR);

    const files = fs.readdirSync(TOOLS_LOG_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, days);

    const allCalls = [];
    for (const file of files) {
        const data = safeReadJSON(path.join(TOOLS_LOG_DIR, file), { calls: [] });
        allCalls.push(...(data.calls || []));
    }
    return allCalls;
}

/**
 * 도구 사용 통계 수집 (ATOS + planning-log 병합)
 */
function collectToolStats() {
    const atos = loadATOSStats();
    const atosTools = atos.tools || {};

    // planning-log/tools/에서 최근 데이터 로드
    const recentCalls = loadRecentToolLogs(7);

    // 도구별 통계 병합
    const mergedTools = {};

    // 1. ATOS 데이터 먼저 추가
    for (const [name, data] of Object.entries(atosTools)) {
        if (name === '_template') continue;
        mergedTools[name] = {
            name,
            totalCalls: data.totalCalls || 0,
            successCount: data.successCount || 0,
            failureCount: data.failureCount || 0,
            successRate: data.successRate || 0,
            averageResponseTime: data.averageResponseTime || 0,
            lastUsed: data.lastUsed,
            chainedWith: data.chainedWith || [],
            category: getToolCategory(name)
        };
    }

    // 2. planning-log 데이터 병합
    for (const call of recentCalls) {
        const name = call.tool;
        if (!mergedTools[name]) {
            mergedTools[name] = {
                name,
                totalCalls: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                averageResponseTime: 0,
                lastUsed: null,
                chainedWith: [],
                category: getToolCategory(name)
            };
        }

        const t = mergedTools[name];
        t.totalCalls++;
        if (call.success) t.successCount++;
        else t.failureCount++;

        // 평균 응답 시간 업데이트
        t.averageResponseTime = Math.round(
            ((t.averageResponseTime * (t.totalCalls - 1)) + (call.responseTime || 0)) / t.totalCalls
        );

        // lastUsed 업데이트
        if (!t.lastUsed || new Date(call.timestamp) > new Date(t.lastUsed)) {
            t.lastUsed = call.timestamp;
        }

        // 성공률 재계산
        t.successRate = t.totalCalls > 0 ? Math.round((t.successCount / t.totalCalls) * 100) : 0;
    }

    // 도구 목록 정렬
    const toolList = Object.values(mergedTools).sort((a, b) => b.totalCalls - a.totalCalls);

    // 전체 통계
    const totalCalls = toolList.reduce((sum, t) => sum + t.totalCalls, 0);

    return {
        tools: toolList,
        globalStats: {
            ...atos.globalStats,
            totalToolCalls: totalCalls
        },
        chainingPatterns: atos.chainingPatterns?.patterns || [],
        totalUniqueTools: toolList.length,
        totalCalls: totalCalls,
        recentCallsCount: recentCalls.length,
        collectedAt: new Date().toISOString()
    };
}

/**
 * 도구 카테고리 분류
 */
function getToolCategory(toolName) {
    const categories = {
        'desktop-commander': 'file',
        'edit-file-lines': 'file',
        'filesystem': 'file',
        'git-mcp': 'git',
        'github': 'git',
        'firecrawl': 'web',
        'one-search': 'web',
        'crawl4ai': 'web',
        'playwright': 'web',
        'deep-research': 'research',
        'paper-search': 'research',
        'context7': 'research',
        'sequential-thinking': 'ai',
        'multi-ai': 'ai',
        'llm-council': 'ai',
        'shrimp-task': 'task',
        'task-master': 'task',
        'memory': 'memory',
        'kiro-memory': 'memory',
        'sqlite': 'database',
        'supabase': 'database',
        'antv-chart': 'visualization',
        'image-recognition': 'media',
        'paddleocr': 'media',
        'marker-mcp': 'media'
    };
    
    for (const [key, category] of Object.entries(categories)) {
        if (toolName.toLowerCase().includes(key)) {
            return category;
        }
    }
    return 'general';
}

/**
 * 카테고리별 도구 통계
 */
function getToolsByCategory() {
    const stats = collectToolStats();
    const byCategory = {};
    
    for (const tool of stats.tools) {
        const cat = tool.category;
        if (!byCategory[cat]) {
            byCategory[cat] = { tools: [], totalCalls: 0, avgSuccessRate: 0 };
        }
        byCategory[cat].tools.push(tool);
        byCategory[cat].totalCalls += tool.totalCalls;
    }
    
    // 카테고리별 평균 성공률 계산
    for (const cat of Object.keys(byCategory)) {
        const tools = byCategory[cat].tools;
        if (tools.length > 0) {
            const avgRate = tools.reduce((sum, t) => sum + t.successRate, 0) / tools.length;
            byCategory[cat].avgSuccessRate = Math.round(avgRate);
        }
    }
    
    return byCategory;
}

/**
 * 상위 N개 도구 조회
 */
function getTopTools(n = 10) {
    const stats = collectToolStats();
    return stats.tools.slice(0, n);
}

/**
 * 상위 체이닝 패턴 조회
 */
function getTopChainingPatterns(n = 10) {
    const stats = collectToolStats();
    return stats.chainingPatterns.slice(0, n);
}

/**
 * 세션 로그에서 도구 타임라인 추출
 */
function getToolTimeline(date = null) {
    ensureDir(ATOS_LOGS_DIR);
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logFile = path.join(ATOS_LOGS_DIR, `session-${targetDate}.jsonl`);
    
    if (!fs.existsSync(logFile)) {
        return { date: targetDate, sessions: [], events: [] };
    }
    
    try {
        const lines = fs.readFileSync(logFile, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);
        
        // 세션별 도구 호출 이벤트 추출
        const events = [];
        for (const session of lines) {
            for (const call of session.toolCalls || []) {
                events.push({
                    sessionId: session.id,
                    tool: call.tool,
                    timestamp: call.timestamp,
                    success: call.success,
                    responseTime: call.responseTime
                });
            }
        }
        
        // 시간순 정렬
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return {
            date: targetDate,
            sessions: lines,
            events,
            eventCount: events.length
        };
    } catch (e) {
        console.error(`Error reading log: ${e.message}`);
        return { date: targetDate, sessions: [], events: [] };
    }
}

/**
 * 도구 호출 기록 (Dashboard에서 직접 호출용)
 */
function recordToolCall(toolName, success, responseTime, context = {}) {
    ensureDir(TOOLS_LOG_DIR);
    
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(TOOLS_LOG_DIR, `${today}.json`);
    
    let data = safeReadJSON(logFile, { date: today, calls: [] });
    
    data.calls.push({
        tool: toolName,
        timestamp: new Date().toISOString(),
        success,
        responseTime,
        context
    });
    
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    collectToolStats,
    getToolsByCategory,
    getTopTools,
    getTopChainingPatterns,
    getToolTimeline,
    recordToolCall
};
