/**
 * Alert Manager - v3.0 Phase 13
 * 비용 임계값, 장기 실행 에이전트 등 실시간 알림
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const ALERTS_FILE = path.join(BASE_PATH, 'planning-log/alerts/alerts.json');
const SETTINGS_FILE = path.join(BASE_PATH, 'planning-log/alerts/settings.json');

// 기본 알림 규칙
const DEFAULT_ALERT_RULES = {
    costThreshold: {
        id: 'cost_threshold',
        type: 'cost',
        enabled: true,
        threshold: 5.00,  // $5 초과
        message: '일일 비용 ${value} 초과 (임계값: $${threshold})',
        severity: 'warning'
    },
    highCostThreshold: {
        id: 'high_cost_threshold',
        type: 'cost',
        enabled: true,
        threshold: 10.00,  // $10 초과
        message: '일일 비용 ${value} 초과 - 주의 필요!',
        severity: 'critical'
    },
    longRunningAgent: {
        id: 'long_running_agent',
        type: 'agent',
        enabled: true,
        threshold: 300000,  // 5분 (ms)
        message: '에이전트 실행 ${value}분 초과 (${agentType})',
        severity: 'info'
    },
    highTokenUsage: {
        id: 'high_token_usage',
        type: 'tokens',
        enabled: true,
        threshold: 100000,  // 10만 토큰
        message: '세션 토큰 ${value} 초과',
        severity: 'warning'
    },
    toolFailureRate: {
        id: 'tool_failure_rate',
        type: 'tool',
        enabled: true,
        threshold: 0.3,  // 30% 실패율
        message: '도구 ${tool} 실패율 ${value}% 초과',
        severity: 'warning'
    },
    manyAgentsRunning: {
        id: 'many_agents_running',
        type: 'agent_count',
        enabled: true,
        threshold: 5,  // 동시 5개 이상
        message: '동시 실행 에이전트 ${value}개',
        severity: 'info'
    }
};

// 알림 저장소 초기화
function ensureAlertsDir() {
    const dir = path.dirname(ALERTS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 설정 로드
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        }
    } catch (error) {
        console.error('[!] Alert settings load error:', error.message);
    }
    return { rules: DEFAULT_ALERT_RULES, muted: [], muteAll: false };
}

// 설정 저장
function saveSettings(settings) {
    ensureAlertsDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// 알림 기록 로드
function loadAlerts() {
    try {
        if (fs.existsSync(ALERTS_FILE)) {
            return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
        }
    } catch (error) {
        console.error('[!] Alerts load error:', error.message);
    }
    return { alerts: [], lastChecked: null };
}

// 알림 저장
function saveAlerts(data) {
    ensureAlertsDir();
    // 최근 1000개만 유지
    if (data.alerts.length > 1000) {
        data.alerts = data.alerts.slice(-1000);
    }
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(data, null, 2));
}

// 새 알림 생성
function createAlert(ruleId, values = {}) {
    const settings = loadSettings();
    const rule = settings.rules[ruleId] || DEFAULT_ALERT_RULES[ruleId];

    if (!rule || !rule.enabled) return null;
    if (settings.muteAll) return null;
    if (settings.muted.includes(ruleId)) return null;

    // 메시지 템플릿 치환
    let message = rule.message;
    Object.keys(values).forEach(key => {
        message = message.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), values[key]);
    });
    message = message.replace(/\$\{threshold\}/g, rule.threshold);

    const alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ruleId: rule.id,
        type: rule.type,
        severity: rule.severity,
        message,
        values,
        timestamp: new Date().toISOString(),
        read: false,
        dismissed: false
    };

    // 저장
    const data = loadAlerts();
    data.alerts.push(alert);
    data.lastChecked = new Date().toISOString();
    saveAlerts(data);

    return alert;
}

// 비용 체크 및 알림
function checkCostAlert(todayCost) {
    const settings = loadSettings();
    const alerts = [];

    // 높은 비용 체크 (먼저)
    if (settings.rules.highCostThreshold?.enabled && todayCost >= settings.rules.highCostThreshold.threshold) {
        const alert = createAlert('highCostThreshold', {
            value: `$${todayCost.toFixed(2)}`
        });
        if (alert) alerts.push(alert);
    }
    // 일반 비용 체크
    else if (settings.rules.costThreshold?.enabled && todayCost >= settings.rules.costThreshold.threshold) {
        const alert = createAlert('costThreshold', {
            value: `$${todayCost.toFixed(2)}`
        });
        if (alert) alerts.push(alert);
    }

    return alerts;
}

// 에이전트 실행 시간 체크
function checkAgentDurationAlert(agentId, agentType, durationMs) {
    const settings = loadSettings();

    if (settings.rules.longRunningAgent?.enabled &&
        durationMs >= settings.rules.longRunningAgent.threshold) {
        const minutes = Math.floor(durationMs / 60000);
        return createAlert('longRunningAgent', {
            agentId,
            agentType,
            value: minutes
        });
    }
    return null;
}

// 토큰 사용량 체크
function checkTokenUsageAlert(sessionTokens) {
    const settings = loadSettings();

    if (settings.rules.highTokenUsage?.enabled &&
        sessionTokens >= settings.rules.highTokenUsage.threshold) {
        return createAlert('highTokenUsage', {
            value: sessionTokens.toLocaleString()
        });
    }
    return null;
}

// 도구 실패율 체크
function checkToolFailureAlert(tool, failureRate) {
    const settings = loadSettings();

    if (settings.rules.toolFailureRate?.enabled &&
        failureRate >= settings.rules.toolFailureRate.threshold) {
        return createAlert('toolFailureRate', {
            tool,
            value: (failureRate * 100).toFixed(1)
        });
    }
    return null;
}

// 동시 실행 에이전트 수 체크
function checkRunningAgentsAlert(count) {
    const settings = loadSettings();

    if (settings.rules.manyAgentsRunning?.enabled &&
        count >= settings.rules.manyAgentsRunning.threshold) {
        return createAlert('manyAgentsRunning', {
            value: count
        });
    }
    return null;
}

// 최근 알림 조회
function getRecentAlerts(limit = 50, includeRead = false) {
    const data = loadAlerts();
    let alerts = data.alerts.filter(a => !a.dismissed);

    if (!includeRead) {
        alerts = alerts.filter(a => !a.read);
    }

    return alerts.slice(-limit).reverse();
}

// 읽지 않은 알림 수
function getUnreadCount() {
    const data = loadAlerts();
    return data.alerts.filter(a => !a.read && !a.dismissed).length;
}

// 알림 읽음 처리
function markAlertRead(alertId) {
    const data = loadAlerts();
    const alert = data.alerts.find(a => a.id === alertId);
    if (alert) {
        alert.read = true;
        saveAlerts(data);
        return true;
    }
    return false;
}

// 모든 알림 읽음 처리
function markAllAlertsRead() {
    const data = loadAlerts();
    data.alerts.forEach(a => { a.read = true; });
    saveAlerts(data);
    return data.alerts.length;
}

// 알림 해제
function dismissAlert(alertId) {
    const data = loadAlerts();
    const alert = data.alerts.find(a => a.id === alertId);
    if (alert) {
        alert.dismissed = true;
        saveAlerts(data);
        return true;
    }
    return false;
}

// 규칙별 알림 무시 설정
function muteRule(ruleId) {
    const settings = loadSettings();
    if (!settings.muted.includes(ruleId)) {
        settings.muted.push(ruleId);
        saveSettings(settings);
    }
}

function unmuteRule(ruleId) {
    const settings = loadSettings();
    settings.muted = settings.muted.filter(r => r !== ruleId);
    saveSettings(settings);
}

// 규칙 임계값 업데이트
function updateRuleThreshold(ruleId, threshold) {
    const settings = loadSettings();
    if (settings.rules[ruleId]) {
        settings.rules[ruleId].threshold = threshold;
        saveSettings(settings);
        return settings.rules[ruleId];
    }
    return null;
}

// 알림 통계
function getAlertStats() {
    const data = loadAlerts();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const todayAlerts = data.alerts.filter(a =>
        a.timestamp.startsWith(today)
    );

    const bySeverity = {};
    const byType = {};

    data.alerts.forEach(a => {
        bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
        byType[a.type] = (byType[a.type] || 0) + 1;
    });

    return {
        total: data.alerts.length,
        unread: data.alerts.filter(a => !a.read && !a.dismissed).length,
        todayCount: todayAlerts.length,
        bySeverity,
        byType,
        lastAlert: data.alerts.length > 0 ? data.alerts[data.alerts.length - 1] : null
    };
}

// 설정 조회
function getAlertSettings() {
    return loadSettings();
}

module.exports = {
    createAlert,
    checkCostAlert,
    checkAgentDurationAlert,
    checkTokenUsageAlert,
    checkToolFailureAlert,
    checkRunningAgentsAlert,
    getRecentAlerts,
    getUnreadCount,
    markAlertRead,
    markAllAlertsRead,
    dismissAlert,
    muteRule,
    unmuteRule,
    updateRuleThreshold,
    getAlertStats,
    getAlertSettings,
    DEFAULT_ALERT_RULES
};
