/**
 * Prompt Collector - 프롬프트 수집 및 분석
 * 
 * 기능:
 * - 세션별 프롬프트 저장
 * - 타임스탬프, 컨텍스트 포함
 * - 검색/필터 지원
 * - 하이브리드 저장 (JSON 실시간 + 장기 보관)
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const PROMPTS_DIR = path.join(BASE_PATH, 'planning-log/prompts');

/**
 * 디렉토리 안전하게 생성
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * 오늘 날짜 파일명 생성
 */
function getTodayFileName() {
    const today = new Date().toISOString().split('T')[0];
    return `${today}.json`;
}

/**
 * 일일 프롬프트 파일 로드
 */
function loadDailyPrompts(date = null) {
    ensureDir(PROMPTS_DIR);
    const fileName = date ? `${date}.json` : getTodayFileName();
    const filePath = path.join(PROMPTS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error loading prompts: ${e.message}`);
        }
    }
    
    return {
        date: date || new Date().toISOString().split('T')[0],
        prompts: [],
        stats: { total: 0, withTools: 0, withAgents: 0 }
    };
}

/**
 * 일일 프롬프트 파일 저장
 */
function saveDailyPrompts(data) {
    ensureDir(PROMPTS_DIR);
    const fileName = getTodayFileName();
    const filePath = path.join(PROMPTS_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 프롬프트 기록
 * @param {Object} promptData - 프롬프트 데이터
 */
function recordPrompt(promptData) {
    const data = loadDailyPrompts();
    
    const record = {
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        sessionId: promptData.sessionId || null,
        prompt: promptData.prompt || '',
        context: {
            activePlan: promptData.activePlan || null,
            currentTask: promptData.currentTask || null,
            phase: promptData.phase || null
        },
        // v3.0 Phase 7: 라이프사이클 연동 필드
        lifecycle: {
            planId: promptData.lifecycle?.planId || promptData.activePlan || null,
            phase: promptData.lifecycle?.phase || null,  // prd | mvp | implementation | release
            goalContext: promptData.lifecycle?.goalContext || null,
            isImplementation: promptData.lifecycle?.isImplementation || false
        },
        response: {
            toolsUsed: promptData.toolsUsed || [],
            agentsSpawned: promptData.agentsSpawned || [],
            duration: promptData.duration || 0,
            success: promptData.success !== false,
            codeChanges: promptData.codeChanges || [],
            implementationProgress: promptData.implementationProgress || 0
        }
    };
    
    data.prompts.push(record);
    
    // 통계 업데이트
    data.stats.total = data.prompts.length;
    data.stats.withTools = data.prompts.filter(p => p.response.toolsUsed.length > 0).length;
    data.stats.withAgents = data.prompts.filter(p => p.response.agentsSpawned.length > 0).length;
    
    saveDailyPrompts(data);
    return record;
}

/**
 * 최근 N일간의 프롬프트 수집
 */
function collectRecentPrompts(days = 7) {
    ensureDir(PROMPTS_DIR);
    
    const files = fs.readdirSync(PROMPTS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, days);
    
    const allPrompts = [];
    const dailyStats = [];
    
    for (const file of files) {
        const data = loadDailyPrompts(file.replace('.json', ''));
        allPrompts.push(...data.prompts);
        dailyStats.push({
            date: data.date,
            total: data.stats.total,
            withTools: data.stats.withTools,
            withAgents: data.stats.withAgents
        });
    }
    
    return {
        prompts: allPrompts,
        dailyStats,
        totalCount: allPrompts.length,
        collectedAt: new Date().toISOString()
    };
}

/**
 * 프롬프트 검색
 */
function searchPrompts(query, options = {}) {
    const { days = 30, limit = 100 } = options;
    const data = collectRecentPrompts(days);
    
    const queryLower = query.toLowerCase();
    const filtered = data.prompts
        .filter(p => p.prompt.toLowerCase().includes(queryLower))
        .slice(0, limit);
    
    return {
        query,
        results: filtered,
        count: filtered.length,
        searchedIn: data.totalCount
    };
}


/**
 * 프롬프트 통계 조회
 */
function getPromptStats(days = 7) {
    const data = collectRecentPrompts(days);
    
    // 도구 사용 빈도
    const toolFrequency = {};
    // 에이전트 사용 빈도
    const agentFrequency = {};
    // 시간대별 분포
    const hourlyDistribution = Array(24).fill(0);
    
    for (const prompt of data.prompts) {
        // 도구 빈도
        for (const tool of prompt.response.toolsUsed) {
            toolFrequency[tool] = (toolFrequency[tool] || 0) + 1;
        }
        // 에이전트 빈도
        for (const agent of prompt.response.agentsSpawned) {
            agentFrequency[agent] = (agentFrequency[agent] || 0) + 1;
        }
        // 시간대 분포
        const hour = new Date(prompt.timestamp).getHours();
        hourlyDistribution[hour]++;
    }
    
    return {
        totalPrompts: data.totalCount,
        dailyStats: data.dailyStats,
        toolFrequency,
        agentFrequency,
        hourlyDistribution,
        avgPromptsPerDay: Math.round(data.totalCount / data.dailyStats.length) || 0,
        generatedAt: new Date().toISOString()
    };
}

module.exports = {
    recordPrompt,
    collectRecentPrompts,
    searchPrompts,
    getPromptStats,
    loadDailyPrompts
};
