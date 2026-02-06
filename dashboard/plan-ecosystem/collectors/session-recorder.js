/**
 * Session Recorder - v3.0 Phase 14
 * 세션 이벤트 기록 및 리플레이 지원
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const SESSIONS_DIR = path.join(BASE_PATH, 'planning-log/sessions');

// 이벤트 타입 정의
const EVENT_TYPES = {
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    PROMPT: 'prompt',
    RESPONSE: 'response',
    TOOL_CALL: 'tool_call',
    TOOL_RESULT: 'tool_result',
    AGENT_SPAWN: 'agent_spawn',
    AGENT_COMPLETE: 'agent_complete',
    PLAN_UPDATE: 'plan_update',
    TASK_UPDATE: 'task_update',
    ERROR: 'error',
    ALERT: 'alert'
};

// 세션 디렉토리 초기화
function ensureSessionsDir() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
}

// 세션 파일 경로
function getSessionFilePath(sessionId) {
    ensureSessionsDir();
    return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

// 세션 데이터 로드
function loadSession(sessionId) {
    const filePath = getSessionFilePath(sessionId);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (error) {
        console.error(`[!] Session load error (${sessionId}):`, error.message);
    }
    return null;
}

// 세션 데이터 저장
function saveSession(session) {
    ensureSessionsDir();
    const filePath = getSessionFilePath(session.sessionId);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
}

// 새 세션 시작
function startSession(sessionId, metadata = {}) {
    const session = {
        sessionId,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'active',
        metadata: {
            platform: metadata.platform || 'claude-code',
            model: metadata.model || 'unknown',
            ...metadata
        },
        events: [],
        stats: {
            totalEvents: 0,
            promptCount: 0,
            toolCallCount: 0,
            agentCount: 0,
            errorCount: 0,
            duration: 0
        }
    };

    // 세션 시작 이벤트 기록
    recordEvent(session, EVENT_TYPES.SESSION_START, {
        message: 'Session started'
    });

    saveSession(session);
    return session;
}

// 세션 종료
function endSession(sessionId, result = {}) {
    const session = loadSession(sessionId);
    if (!session) return null;

    session.endTime = new Date().toISOString();
    session.status = 'completed';
    session.stats.duration = new Date(session.endTime) - new Date(session.startTime);

    recordEvent(session, EVENT_TYPES.SESSION_END, {
        message: 'Session ended',
        result
    });

    saveSession(session);
    return session;
}

// 이벤트 기록
function recordEvent(session, type, data = {}) {
    const event = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        timestamp: new Date().toISOString(),
        data
    };

    session.events.push(event);
    session.stats.totalEvents++;

    // 타입별 통계 업데이트
    switch (type) {
        case EVENT_TYPES.PROMPT:
            session.stats.promptCount++;
            break;
        case EVENT_TYPES.TOOL_CALL:
            session.stats.toolCallCount++;
            break;
        case EVENT_TYPES.AGENT_SPAWN:
            session.stats.agentCount++;
            break;
        case EVENT_TYPES.ERROR:
            session.stats.errorCount++;
            break;
    }

    return event;
}

// 세션에 이벤트 추가 (외부 호출용)
function addSessionEvent(sessionId, type, data) {
    let session = loadSession(sessionId);

    // 세션이 없으면 자동 생성
    if (!session) {
        session = startSession(sessionId, data.metadata || {});
    }

    const event = recordEvent(session, type, data);
    saveSession(session);

    return event;
}

// 프롬프트 이벤트 기록
function recordPromptEvent(sessionId, prompt, context = {}) {
    return addSessionEvent(sessionId, EVENT_TYPES.PROMPT, {
        prompt: prompt.substring(0, 1000), // 길이 제한
        context
    });
}

// 도구 호출 이벤트 기록
function recordToolEvent(sessionId, tool, result = {}) {
    return addSessionEvent(sessionId, EVENT_TYPES.TOOL_CALL, {
        tool,
        success: result.success !== false,
        responseTime: result.responseTime || 0,
        error: result.error || null
    });
}

// 에이전트 이벤트 기록
function recordAgentEvent(sessionId, action, agentData) {
    const eventType = action === 'start' ? EVENT_TYPES.AGENT_SPAWN : EVENT_TYPES.AGENT_COMPLETE;
    return addSessionEvent(sessionId, eventType, agentData);
}

// 세션 목록 조회
function listSessions(options = {}) {
    ensureSessionsDir();

    const { limit = 50, status = null, days = 30 } = options;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    try {
        const files = fs.readdirSync(SESSIONS_DIR)
            .filter(f => f.endsWith('.json'))
            .sort((a, b) => {
                const statA = fs.statSync(path.join(SESSIONS_DIR, a));
                const statB = fs.statSync(path.join(SESSIONS_DIR, b));
                return statB.mtime - statA.mtime;
            });

        const sessions = [];

        for (const file of files) {
            if (sessions.length >= limit) break;

            try {
                const filePath = path.join(SESSIONS_DIR, file);
                const stat = fs.statSync(filePath);

                if (stat.mtime < cutoff) continue;

                const session = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                if (status && session.status !== status) continue;

                sessions.push({
                    sessionId: session.sessionId,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    status: session.status,
                    stats: session.stats,
                    metadata: session.metadata
                });
            } catch (error) {
                console.error(`[!] Error reading session file ${file}:`, error.message);
            }
        }

        return sessions;
    } catch (error) {
        console.error('[!] Error listing sessions:', error.message);
        return [];
    }
}

// 세션 상세 조회
function getSessionDetail(sessionId) {
    const session = loadSession(sessionId);
    if (!session) return null;

    return {
        ...session,
        eventCount: session.events.length
    };
}

// 세션 이벤트 조회
function getSessionEvents(sessionId, options = {}) {
    const session = loadSession(sessionId);
    if (!session) return [];

    let events = session.events;

    // 타입 필터
    if (options.type) {
        events = events.filter(e => e.type === options.type);
    }

    // 시간 범위 필터
    if (options.startTime) {
        events = events.filter(e => new Date(e.timestamp) >= new Date(options.startTime));
    }
    if (options.endTime) {
        events = events.filter(e => new Date(e.timestamp) <= new Date(options.endTime));
    }

    // 페이지네이션
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    events = events.slice(offset, offset + limit);

    return events;
}

// 리플레이 데이터 생성
function getReplayData(sessionId) {
    const session = loadSession(sessionId);
    if (!session) return null;

    // 이벤트를 타임라인 형식으로 변환
    const baseTime = new Date(session.startTime).getTime();

    const timeline = session.events.map(event => ({
        ...event,
        relativeTime: new Date(event.timestamp).getTime() - baseTime,
        formattedTime: formatRelativeTime(new Date(event.timestamp).getTime() - baseTime)
    }));

    // 이벤트 타입별 색상
    const typeColors = {
        [EVENT_TYPES.SESSION_START]: '#10b981',
        [EVENT_TYPES.SESSION_END]: '#6b7280',
        [EVENT_TYPES.PROMPT]: '#3b82f6',
        [EVENT_TYPES.RESPONSE]: '#8b5cf6',
        [EVENT_TYPES.TOOL_CALL]: '#f59e0b',
        [EVENT_TYPES.TOOL_RESULT]: '#f59e0b',
        [EVENT_TYPES.AGENT_SPAWN]: '#ec4899',
        [EVENT_TYPES.AGENT_COMPLETE]: '#ec4899',
        [EVENT_TYPES.ERROR]: '#ef4444',
        [EVENT_TYPES.ALERT]: '#ef4444'
    };

    return {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        totalDuration: session.stats.duration,
        eventCount: timeline.length,
        timeline,
        typeColors,
        stats: session.stats
    };
}

// 상대 시간 포맷
function formatRelativeTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

// 세션 통계 집계
function getSessionsStats(days = 30) {
    const sessions = listSessions({ days, limit: 1000 });

    const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalEvents: 0,
        totalPrompts: 0,
        totalToolCalls: 0,
        totalAgents: 0,
        avgSessionDuration: 0,
        dailyStats: {}
    };

    sessions.forEach(session => {
        stats.totalEvents += session.stats.totalEvents || 0;
        stats.totalPrompts += session.stats.promptCount || 0;
        stats.totalToolCalls += session.stats.toolCallCount || 0;
        stats.totalAgents += session.stats.agentCount || 0;

        // 일별 통계
        const date = session.startTime.split('T')[0];
        if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { sessions: 0, events: 0, duration: 0 };
        }
        stats.dailyStats[date].sessions++;
        stats.dailyStats[date].events += session.stats.totalEvents || 0;
        stats.dailyStats[date].duration += session.stats.duration || 0;
    });

    // 평균 세션 시간 계산
    const completedWithDuration = sessions.filter(s => s.stats.duration > 0);
    if (completedWithDuration.length > 0) {
        const totalDuration = completedWithDuration.reduce((sum, s) => sum + s.stats.duration, 0);
        stats.avgSessionDuration = totalDuration / completedWithDuration.length;
    }

    return stats;
}

// 세션 삭제
function deleteSession(sessionId) {
    const filePath = getSessionFilePath(sessionId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

// 오래된 세션 정리
function cleanupOldSessions(days = 90) {
    ensureSessionsDir();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let deletedCount = 0;

    try {
        const files = fs.readdirSync(SESSIONS_DIR)
            .filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(SESSIONS_DIR, file);
            const stat = fs.statSync(filePath);

            if (stat.mtime < cutoff) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
    } catch (error) {
        console.error('[!] Cleanup error:', error.message);
    }

    return deletedCount;
}

module.exports = {
    EVENT_TYPES,
    startSession,
    endSession,
    addSessionEvent,
    recordPromptEvent,
    recordToolEvent,
    recordAgentEvent,
    listSessions,
    getSessionDetail,
    getSessionEvents,
    getReplayData,
    getSessionsStats,
    deleteSession,
    cleanupOldSessions
};
