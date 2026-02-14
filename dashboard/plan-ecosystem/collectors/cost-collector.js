/**
 * Cost Collector
 * Phase 11: 비용 추적 시스템
 *
 * 토큰 사용량 및 API 비용 모니터링
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const COST_DATA_PATH = path.join(BASE_PATH, 'planning-log', 'costs');

// Claude 모델별 토큰 비용 (USD per 1M tokens) - 2026년 기준 예상
const MODEL_PRICING = {
    'claude-opus-4-5-20251101': {
        input: 15.00,   // $15/1M input tokens
        output: 75.00,  // $75/1M output tokens
        name: 'Claude Opus 4.5'
    },
    'claude-sonnet-4-20250514': {
        input: 3.00,
        output: 15.00,
        name: 'Claude Sonnet 4'
    },
    'claude-haiku-3-5-20241022': {
        input: 0.80,
        output: 4.00,
        name: 'Claude Haiku 3.5'
    }
};

// 기본 모델 (현재 사용 중)
const DEFAULT_MODEL = 'claude-opus-4-5-20251101';

/**
 * 비용 데이터 디렉토리 확인/생성
 */
function ensureCostDataDir() {
    if (!fs.existsSync(COST_DATA_PATH)) {
        fs.mkdirSync(COST_DATA_PATH, { recursive: true });
    }
}

/**
 * 일별 비용 파일 경로
 */
function getDailyCostPath(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return path.join(COST_DATA_PATH, `${dateStr}.json`);
}

/**
 * 일별 비용 데이터 로드
 */
function loadDailyCosts(date = new Date()) {
    const filePath = getDailyCostPath(date);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (error) {
        console.error('[!] Error loading daily costs:', error.message);
    }

    return {
        date: date.toISOString().split('T')[0],
        sessions: [],
        totals: {
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0
        }
    };
}

/**
 * 일별 비용 데이터 저장
 */
function saveDailyCosts(data, date = new Date()) {
    ensureCostDataDir();
    const filePath = getDailyCostPath(date);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 세션 비용 기록
 */
function recordSessionCost(sessionData) {
    const {
        sessionId,
        model = DEFAULT_MODEL,
        inputTokens = 0,
        outputTokens = 0,
        startTime,
        endTime
    } = sessionData;

    const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
    const cost = calculateCost(inputTokens, outputTokens, pricing);

    const dailyData = loadDailyCosts();

    const sessionRecord = {
        sessionId,
        model,
        modelName: pricing.name,
        inputTokens,
        outputTokens,
        cost,
        startTime: startTime || new Date().toISOString(),
        endTime: endTime || null
    };

    dailyData.sessions.push(sessionRecord);

    // 총계 업데이트
    dailyData.totals.inputTokens += inputTokens;
    dailyData.totals.outputTokens += outputTokens;
    dailyData.totals.totalCost += cost;

    saveDailyCosts(dailyData);

    return sessionRecord;
}

/**
 * 비용 계산
 */
function calculateCost(inputTokens, outputTokens, pricing) {
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return Math.round((inputCost + outputCost) * 10000) / 10000; // 소수점 4자리
}

/**
 * 최근 N일 비용 통계 수집
 */
function collectCostStats(days = 7) {
    const stats = {
        dailyStats: [],
        totals: {
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            sessions: 0
        },
        avgDailyCost: 0,
        avgSessionCost: 0,
        modelBreakdown: {},
        period: {
            start: null,
            end: new Date().toISOString().split('T')[0],
            days
        }
    };

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dailyData = loadDailyCosts(date);

        stats.dailyStats.push({
            date: dateStr,
            inputTokens: dailyData.totals.inputTokens,
            outputTokens: dailyData.totals.outputTokens,
            cost: dailyData.totals.totalCost,
            sessions: dailyData.sessions.length
        });

        // 총계 누적
        stats.totals.inputTokens += dailyData.totals.inputTokens;
        stats.totals.outputTokens += dailyData.totals.outputTokens;
        stats.totals.totalCost += dailyData.totals.totalCost;
        stats.totals.sessions += dailyData.sessions.length;

        // 모델별 분류
        for (const session of dailyData.sessions) {
            const model = session.model || DEFAULT_MODEL;
            if (!stats.modelBreakdown[model]) {
                stats.modelBreakdown[model] = {
                    name: MODEL_PRICING[model]?.name || model,
                    inputTokens: 0,
                    outputTokens: 0,
                    cost: 0,
                    sessions: 0
                };
            }
            stats.modelBreakdown[model].inputTokens += session.inputTokens;
            stats.modelBreakdown[model].outputTokens += session.outputTokens;
            stats.modelBreakdown[model].cost += session.cost;
            stats.modelBreakdown[model].sessions += 1;
        }

        if (!stats.period.start) {
            stats.period.start = dateStr;
        }
    }

    // 평균 계산
    stats.avgDailyCost = stats.totals.sessions > 0
        ? Math.round((stats.totals.totalCost / days) * 100) / 100
        : 0;
    stats.avgSessionCost = stats.totals.sessions > 0
        ? Math.round((stats.totals.totalCost / stats.totals.sessions) * 100) / 100
        : 0;

    // 비용 소수점 정리
    stats.totals.totalCost = Math.round(stats.totals.totalCost * 100) / 100;

    return stats;
}

/**
 * 오늘의 비용 요약
 */
function getTodayCostSummary() {
    const dailyData = loadDailyCosts();

    return {
        date: dailyData.date,
        inputTokens: dailyData.totals.inputTokens,
        outputTokens: dailyData.totals.outputTokens,
        totalCost: Math.round(dailyData.totals.totalCost * 100) / 100,
        sessions: dailyData.sessions.length,
        formattedCost: `$${dailyData.totals.totalCost.toFixed(2)}`
    };
}

/**
 * 세션 목록 조회
 */
function getRecentSessions(days = 7, limit = 50) {
    const sessions = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dailyData = loadDailyCosts(date);

        for (const session of dailyData.sessions) {
            sessions.push({
                ...session,
                date: dailyData.date
            });
        }
    }

    // 최신순 정렬
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return sessions.slice(0, limit);
}

/**
 * 월별 비용 통계
 */
function getMonthlyCostStats(year, month) {
    const stats = {
        year,
        month,
        dailyStats: [],
        totals: {
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            sessions: 0
        }
    };

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        if (date > new Date()) break; // 미래 날짜 제외

        const dailyData = loadDailyCosts(date);

        stats.dailyStats.push({
            day,
            date: date.toISOString().split('T')[0],
            cost: dailyData.totals.totalCost,
            sessions: dailyData.sessions.length
        });

        stats.totals.inputTokens += dailyData.totals.inputTokens;
        stats.totals.outputTokens += dailyData.totals.outputTokens;
        stats.totals.totalCost += dailyData.totals.totalCost;
        stats.totals.sessions += dailyData.sessions.length;
    }

    stats.totals.totalCost = Math.round(stats.totals.totalCost * 100) / 100;

    return stats;
}

/**
 * 토큰 사용 추세 분석
 */
function getTokenTrend(days = 30) {
    const trend = {
        dates: [],
        inputTokens: [],
        outputTokens: [],
        costs: [],
        movingAverage: []
    };

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dailyData = loadDailyCosts(date);

        trend.dates.push(dateStr);
        trend.inputTokens.push(dailyData.totals.inputTokens);
        trend.outputTokens.push(dailyData.totals.outputTokens);
        trend.costs.push(dailyData.totals.totalCost);
    }

    // 7일 이동평균 계산
    for (let i = 0; i < trend.costs.length; i++) {
        if (i < 6) {
            trend.movingAverage.push(null);
        } else {
            const sum = trend.costs.slice(i - 6, i + 1).reduce((a, b) => a + b, 0);
            trend.movingAverage.push(Math.round((sum / 7) * 100) / 100);
        }
    }

    return trend;
}

/**
 * 예상 월간 비용 계산
 */
function getProjectedMonthlyCost() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const monthStats = getMonthlyCostStats(today.getFullYear(), today.getMonth() + 1);
    const currentCost = monthStats.totals.totalCost;

    if (dayOfMonth === 0) return 0;

    const dailyAvg = currentCost / dayOfMonth;
    const projected = dailyAvg * daysInMonth;

    return Math.round(projected * 100) / 100;
}

module.exports = {
    recordSessionCost,
    collectCostStats,
    getTodayCostSummary,
    getRecentSessions,
    getMonthlyCostStats,
    getTokenTrend,
    getProjectedMonthlyCost,
    calculateCost,
    MODEL_PRICING,
    DEFAULT_MODEL
};
