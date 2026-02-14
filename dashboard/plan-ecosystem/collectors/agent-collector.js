/**
 * Agent Collector - 에이전트/서브에이전트 추적
 * 
 * 기능:
 * - Task/Explore/Plan/Bash 에이전트 실행 기록
 * - 세션별 에이전트 활동 추적
 * - 병렬 실행 시각화 지원
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const AGENTS_DIR = path.join(BASE_PATH, 'planning-log/agents');
const SESSION_STATE = path.join(BASE_PATH, 'unified-task-system/session-state.json');

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
 * 오늘 날짜 파일명
 */
function getTodayFileName() {
    return `${new Date().toISOString().split('T')[0]}.json`;
}

/**
 * 일일 에이전트 로그 로드
 */
function loadDailyAgents(date = null) {
    ensureDir(AGENTS_DIR);
    const fileName = date ? `${date}.json` : getTodayFileName();
    const filePath = path.join(AGENTS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error loading agents: ${e.message}`);
        }
    }
    
    return {
        date: date || new Date().toISOString().split('T')[0],
        agents: [],
        stats: { total: 0, byType: {}, completed: 0, failed: 0 }
    };
}

/**
 * 일일 에이전트 로그 저장
 */
function saveDailyAgents(data) {
    ensureDir(AGENTS_DIR);
    const fileName = getTodayFileName();
    const filePath = path.join(AGENTS_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 에이전트 실행 기록
 * @param {Object} agentData - 에이전트 데이터
 */
function recordAgentStart(agentData) {
    const data = loadDailyAgents();
    
    const record = {
        agentId: agentData.agentId || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: agentData.type || 'general-purpose', // Explore, Plan, Bash, general-purpose
        prompt: agentData.prompt ? agentData.prompt.substring(0, 500) : '', // 처음 500자
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'running',
        toolsUsed: 0,
        parentSession: agentData.sessionId || null,
        runInBackground: agentData.runInBackground || false,
        result: null
    };
    
    data.agents.push(record);
    
    // 통계 업데이트
    data.stats.total = data.agents.length;
    data.stats.byType[record.type] = (data.stats.byType[record.type] || 0) + 1;
    
    saveDailyAgents(data);
    return record;
}

/**
 * 에이전트 완료 기록
 */
function recordAgentComplete(agentId, result = {}) {
    const data = loadDailyAgents();
    
    const agent = data.agents.find(a => a.agentId === agentId);
    if (agent) {
        agent.endTime = new Date().toISOString();
        agent.status = result.success !== false ? 'completed' : 'failed';
        agent.toolsUsed = result.toolsUsed || 0;
        agent.result = result.summary ? result.summary.substring(0, 1000) : null;
        
        // 통계 업데이트
        if (agent.status === 'completed') {
            data.stats.completed++;
        } else {
            data.stats.failed++;
        }
        
        saveDailyAgents(data);
    }
    return agent;
}

/**
 * 최근 N일간의 에이전트 활동 수집
 */
function collectRecentAgents(days = 7) {
    ensureDir(AGENTS_DIR);
    
    const files = fs.readdirSync(AGENTS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, days);
    
    const allAgents = [];
    const dailyStats = [];
    
    for (const file of files) {
        const data = loadDailyAgents(file.replace('.json', ''));
        allAgents.push(...data.agents);
        dailyStats.push({
            date: data.date,
            total: data.stats.total,
            byType: data.stats.byType,
            completed: data.stats.completed,
            failed: data.stats.failed
        });
    }
    
    return {
        agents: allAgents,
        dailyStats,
        totalCount: allAgents.length,
        collectedAt: new Date().toISOString()
    };
}

/**
 * 에이전트 통계 조회
 */
function getAgentStats(days = 7) {
    const data = collectRecentAgents(days);
    
    // 타입별 집계
    const byType = {};
    // 평균 실행 시간
    let totalDuration = 0;
    let durationCount = 0;
    
    for (const agent of data.agents) {
        // 타입별
        const type = agent.type || 'unknown';
        if (!byType[type]) {
            byType[type] = { count: 0, completed: 0, failed: 0, avgDuration: 0 };
        }
        byType[type].count++;
        if (agent.status === 'completed') byType[type].completed++;
        if (agent.status === 'failed') byType[type].failed++;
        
        // 실행 시간
        if (agent.startTime && agent.endTime) {
            const duration = new Date(agent.endTime) - new Date(agent.startTime);
            totalDuration += duration;
            durationCount++;
        }
    }
    
    return {
        totalAgents: data.totalCount,
        byType,
        avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount / 1000) : 0, // 초 단위
        dailyStats: data.dailyStats,
        generatedAt: new Date().toISOString()
    };
}

/**
 * 세션 상태에서 현재 실행 중인 에이전트 조회
 */
function getRunningAgents() {
    const data = loadDailyAgents();
    return data.agents.filter(a => a.status === 'running');
}

/**
 * 에이전트 타임라인 (Gantt 스타일용)
 */
function getAgentTimeline(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const data = loadDailyAgents(targetDate);
    
    // 타임라인 이벤트 변환
    const timeline = data.agents.map(agent => ({
        id: agent.agentId,
        type: agent.type,
        start: agent.startTime,
        end: agent.endTime || new Date().toISOString(),
        status: agent.status,
        duration: agent.endTime 
            ? (new Date(agent.endTime) - new Date(agent.startTime)) / 1000 
            : null,
        prompt: agent.prompt
    }));
    
    return {
        date: targetDate,
        timeline,
        runningCount: data.agents.filter(a => a.status === 'running').length
    };
}

module.exports = {
    recordAgentStart,
    recordAgentComplete,
    collectRecentAgents,
    getAgentStats,
    getRunningAgents,
    getAgentTimeline,
    loadDailyAgents
};
