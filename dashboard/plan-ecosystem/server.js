/**
 * Plan Ecosystem Dashboard Server
 * 플랜과 구현 산출물 현황 대시보드
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const { collectAllPlans, getPlanDetail } = require('./collectors/plan-collector');
const { collectRecentLogs, loadShrimpTasks, getStats } = require('./collectors/log-collector');
// v2.0 새 collectors
const { collectRecentPrompts, getPromptStats, searchPrompts, recordPrompt } = require('./collectors/prompt-collector');
const { collectToolStats, getToolsByCategory, getTopTools, getTopChainingPatterns, getToolTimeline, recordToolCall } = require('./collectors/tool-collector');
const { collectRecentAgents, getAgentStats, getAgentTimeline, recordAgentStart, recordAgentComplete, getRunningAgents } = require('./collectors/agent-collector');
// v2.0 Phase 7-8 collectors
const { collectSkillStats, recordSkillUsage, getTopSkills, getSkillDetail } = require('./collectors/skill-collector');
const { collectAllTasks, buildTaskHierarchy, buildDependencyGraph, getTasksByStatus, getTaskDetail, getTaskSummary } = require('./collectors/task-collector');
// v2.0 Phase 9, 11 collectors
const { collectSystemGraph, getNodesByCategory, getNodeConnections, getSystemStatus, generateMermaidDiagram, getD3GraphData } = require('./collectors/system-graph');
const { collectCostStats, getTodayCostSummary, getRecentSessions, getMonthlyCostStats, getTokenTrend, getProjectedMonthlyCost, recordSessionCost } = require('./collectors/cost-collector');
// v3.0 Phase 13 collector
const {
    createAlert, checkCostAlert, checkAgentDurationAlert, checkTokenUsageAlert,
    checkToolFailureAlert, checkRunningAgentsAlert, getRecentAlerts, getUnreadCount,
    markAlertRead, markAllAlertsRead, dismissAlert, muteRule, unmuteRule,
    updateRuleThreshold, getAlertStats, getAlertSettings
} = require('./collectors/alert-manager');
// v3.0 Phase 14 collector
const {
    EVENT_TYPES, startSession, endSession, addSessionEvent,
    recordPromptEvent, recordToolEvent, recordAgentEvent,
    listSessions, getSessionDetail, getSessionEvents,
    getReplayData, getSessionsStats, deleteSession
} = require('./collectors/session-recorder');
// v3.0 Phase 7 collector
const {
    PHASES, PHASE_ORDER, loadLifecycle, startPhase, completePhase,
    updatePhaseProgress, linkPromptToPhase, addGoal, updateGoalProgress,
    extractGoalsFromPlan, collectAllLifecycles, getLifecycleDetail,
    getCurrentPhase, generateLifecycleMermaid
} = require('./collectors/lifecycle-collector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 7847;
const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const PLUGINS_DIR = path.join(__dirname, 'plugins');

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Add io to request for plugins
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ===== v3.0: Plugin System (Phase 20) =====

const loadedPlugins = [];

function loadPlugins() {
    if (!fs.existsSync(PLUGINS_DIR)) {
        console.log('[*] No plugins directory found');
        return;
    }

    const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const pluginName of pluginDirs) {
        const pluginPath = path.join(PLUGINS_DIR, pluginName);
        const manifestPath = path.join(pluginPath, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
            console.log(`[!] Plugin ${pluginName}: Missing manifest.json`);
            continue;
        }

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

            if (manifest.enabled === false) {
                console.log(`[-] Plugin ${manifest.name}: Disabled`);
                continue;
            }

            // Load router if specified
            if (manifest.router) {
                const routerPath = path.join(pluginPath, manifest.router);
                if (fs.existsSync(routerPath)) {
                    const router = require(routerPath);
                    app.use(manifest.api || `/api/plugins/${manifest.name}`, router);
                    console.log(`[+] Plugin loaded: ${manifest.name} (v${manifest.version}) - ${manifest.api}`);
                }
            }

            loadedPlugins.push(manifest);
        } catch (error) {
            console.error(`[!] Plugin ${pluginName} load error:`, error.message);
        }
    }
}

// Load plugins on startup
loadPlugins();

// Plugin list API
app.get('/api/plugins', (req, res) => {
    res.json(loadedPlugins);
});

// ===== REST API =====

// 플랜 목록
app.get('/api/plans', (req, res) => {
    try {
        const data = collectAllPlans();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 플랜 상세
app.get('/api/plans/:id', (req, res) => {
    try {
        const plan = getPlanDetail(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 로그 조회
app.get('/api/logs', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = collectRecentLogs(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Shrimp 작업
app.get('/api/tasks', (req, res) => {
    try {
        const data = loadShrimpTasks();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 통합 통계
app.get('/api/stats', (req, res) => {
    try {
        const plans = collectAllPlans();
        const stats = getStats();
        const toolStats = collectToolStats();
        const agentStats = getAgentStats(7);
        const promptStats = getPromptStats(7);
        const skillStats = collectSkillStats();
        const taskSummary = getTaskSummary();

        res.json({
            plans: plans.stats,
            tasks: taskSummary,
            recentActivity: stats.recentLogs.count,
            tools: {
                totalCalls: toolStats.totalCalls,
                uniqueTools: toolStats.totalUniqueTools
            },
            agents: {
                total: agentStats.totalAgents,
                byType: agentStats.byType
            },
            prompts: {
                total: promptStats.totalPrompts,
                avgToolsPerPrompt: promptStats.avgToolsPerPrompt
            },
            skills: {
                registered: skillStats.registeredCount,
                totalActivations: skillStats.totalActivations
            },
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 프롬프트 =====

// 프롬프트 목록
app.get('/api/prompts', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = collectRecentPrompts(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프롬프트 통계
app.get('/api/prompts/stats', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = getPromptStats(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프롬프트 검색
app.get('/api/prompts/search', (req, res) => {
    try {
        const { q, days = 30, limit = 100 } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" required' });
        }
        const data = searchPrompts(q, { days: parseInt(days), limit: parseInt(limit) });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프롬프트 기록 (Hook에서 호출)
app.post('/api/prompts', (req, res) => {
    try {
        const record = recordPrompt(req.body);
        res.json({ success: true, record });
        // 실시간 알림
        io.emit('prompt-recorded', record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 도구 =====

// 도구 통계
app.get('/api/tools', (req, res) => {
    try {
        const data = collectToolStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 카테고리별 도구
app.get('/api/tools/categories', (req, res) => {
    try {
        const data = getToolsByCategory();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 상위 도구
app.get('/api/tools/top', (req, res) => {
    try {
        const n = parseInt(req.query.n) || 10;
        const data = getTopTools(n);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 체이닝 패턴
app.get('/api/tools/chains', (req, res) => {
    try {
        const n = parseInt(req.query.n) || 10;
        const data = getTopChainingPatterns(n);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 도구 타임라인
app.get('/api/tools/timeline', (req, res) => {
    try {
        const { date } = req.query;
        const data = getToolTimeline(date);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 도구 호출 기록 (Hook에서 호출)
app.post('/api/tools/record', (req, res) => {
    try {
        const { tool, success, responseTime, context } = req.body;
        recordToolCall(tool, success, responseTime, context);
        res.json({ success: true });
        // 실시간 알림
        io.emit('tool-called', { tool, success, responseTime, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 에이전트 =====

// 에이전트 목록
app.get('/api/agents', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = collectRecentAgents(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 에이전트 통계
app.get('/api/agents/stats', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = getAgentStats(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 실행 중인 에이전트
app.get('/api/agents/running', (req, res) => {
    try {
        const data = getRunningAgents();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 에이전트 타임라인
app.get('/api/agents/timeline', (req, res) => {
    try {
        const { date } = req.query;
        const data = getAgentTimeline(date);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 에이전트 시작 기록
app.post('/api/agents/start', (req, res) => {
    try {
        const record = recordAgentStart(req.body);
        res.json({ success: true, record });
        // 실시간 알림
        io.emit('agent-started', record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 에이전트 완료 기록
app.post('/api/agents/complete', (req, res) => {
    try {
        const { agentId, ...result } = req.body;
        const record = recordAgentComplete(agentId, result);
        res.json({ success: true, record });
        // 실시간 알림
        io.emit('agent-completed', record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 스킬 (Phase 7) =====

// 스킬 통계
app.get('/api/skills', (req, res) => {
    try {
        const data = collectSkillStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 상위 스킬
app.get('/api/skills/top', (req, res) => {
    try {
        const n = parseInt(req.query.n) || 10;
        const data = getTopSkills(n);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 스킬 상세
app.get('/api/skills/:name', (req, res) => {
    try {
        const skill = getSkillDetail(req.params.name);
        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        res.json(skill);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 스킬 사용 기록
app.post('/api/skills/record', (req, res) => {
    try {
        const { skill, success, trigger, context } = req.body;
        recordSkillUsage(skill, success, trigger, context);
        res.json({ success: true });
        io.emit('skill-used', { skill, success, trigger, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 통합 작업 (Phase 8) =====

// 통합 작업 목록
app.get('/api/tasks/all', (req, res) => {
    try {
        const data = collectAllTasks();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 작업 계층 구조
app.get('/api/tasks/hierarchy', (req, res) => {
    try {
        const data = buildTaskHierarchy();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 작업 의존성 그래프
app.get('/api/tasks/dependencies', (req, res) => {
    try {
        const data = buildDependencyGraph();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 상태별 작업
app.get('/api/tasks/status/:status', (req, res) => {
    try {
        const data = getTasksByStatus(req.params.status);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 작업 상세
app.get('/api/tasks/:id', (req, res) => {
    try {
        const task = getTaskDetail(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 작업 요약 통계
app.get('/api/tasks/summary', (req, res) => {
    try {
        const data = getTaskSummary();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 시스템 그래프 (Phase 9) =====

// 시스템 그래프 전체
app.get('/api/system-graph', (req, res) => {
    try {
        const data = collectSystemGraph();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// D3.js용 그래프 데이터
app.get('/api/system-graph/d3', (req, res) => {
    try {
        const data = getD3GraphData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mermaid 다이어그램
app.get('/api/system-graph/mermaid', (req, res) => {
    try {
        const mermaid = generateMermaidDiagram();
        res.type('text/plain').send(mermaid);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 카테고리별 노드
app.get('/api/system-graph/categories', (req, res) => {
    try {
        const data = getNodesByCategory();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 노드 연결 조회
app.get('/api/system-graph/node/:nodeId', (req, res) => {
    try {
        const data = getNodeConnections(req.params.nodeId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 시스템 상태 요약
app.get('/api/system-graph/status', (req, res) => {
    try {
        const data = getSystemStatus();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v2.0 API: 비용 추적 (Phase 11) =====

// 비용 통계
app.get('/api/costs', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = collectCostStats(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 오늘의 비용
app.get('/api/costs/today', (req, res) => {
    try {
        const data = getTodayCostSummary();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 최근 세션 비용
app.get('/api/costs/sessions', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const limit = parseInt(req.query.limit) || 50;
        const data = getRecentSessions(days, limit);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 월별 비용
app.get('/api/costs/monthly', (req, res) => {
    try {
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || now.getMonth() + 1;
        const data = getMonthlyCostStats(year, month);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 토큰 추세
app.get('/api/costs/trend', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const data = getTokenTrend(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 예상 월간 비용
app.get('/api/costs/projected', (req, res) => {
    try {
        const projected = getProjectedMonthlyCost();
        const today = getTodayCostSummary();
        res.json({
            projectedMonthlyCost: projected,
            currentMonthCost: today.totalCost,
            formattedProjected: `$${projected.toFixed(2)}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 비용 기록 (Hook에서 호출)
app.post('/api/costs/record', (req, res) => {
    try {
        const record = recordSessionCost(req.body);
        res.json({ success: true, record });
        io.emit('cost-recorded', record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 API: Hook 자동 연동 (Phase 12) =====

// 프롬프트 Hook (Claude Code에서 자동 호출) - Phase 8E 확장
app.post('/api/hooks/prompt', (req, res) => {
    try {
        const { prompt, sessionId, timestamp, context, activePlan, toolsUsed, agentsSpawned, duration, success } = req.body;

        // Phase 8E: Lifecycle 연동
        let lifecycle = null;
        let lifecyclePhase = null;
        if (activePlan) {
            try {
                lifecycle = loadLifecycle(activePlan);
                lifecyclePhase = getCurrentPhase(lifecycle);
            } catch (e) {
                // Lifecycle not found, continue without it
            }
        }

        const record = recordPrompt({
            prompt: prompt || '',
            sessionId: sessionId || `session-${Date.now()}`,
            timestamp: timestamp || new Date().toISOString(),
            activePlan: activePlan || null,
            toolsUsed: toolsUsed || [],
            agentsSpawned: agentsSpawned || [],
            duration: duration || 0,
            success: success !== false,
            context: context || {},
            lifecycle: activePlan ? {
                planId: activePlan,
                phase: lifecyclePhase,
                isImplementation: lifecyclePhase === 'implementation'
            } : null
        });

        // Phase 8E: 프롬프트를 Lifecycle에 연결
        if (activePlan && lifecyclePhase && record.id) {
            try {
                linkPromptToPhase(activePlan, lifecyclePhase, record.id);
            } catch (e) {
                console.log('[*] Failed to link prompt to lifecycle');
            }
        }

        res.json({ success: true, record });
        io.emit('hook-prompt', record);

        // Phase 8E: Lifecycle 업데이트 알림
        if (lifecycle) {
            io.emit('lifecycle-prompt-added', {
                planId: activePlan,
                phase: lifecyclePhase,
                promptId: record.id
            });
        }
    } catch (error) {
        console.error('[!] Hook prompt error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 비용 Hook (Claude Code에서 자동 호출)
app.post('/api/hooks/cost', (req, res) => {
    try {
        const { inputTokens, outputTokens, sessionId, model, timestamp } = req.body;
        const record = recordSessionCost({
            sessionId: sessionId || `session-${Date.now()}`,
            inputTokens: inputTokens || 0,
            outputTokens: outputTokens || 0,
            model: model || 'claude-opus-4-5',
            timestamp: timestamp || new Date().toISOString()
        });
        res.json({ success: true, record });
        io.emit('hook-cost', record);
    } catch (error) {
        console.error('[!] Hook cost error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 도구 Hook (Claude Code에서 자동 호출)
app.post('/api/hooks/tool', (req, res) => {
    try {
        const { tool, success, responseTime, sessionId, context } = req.body;
        if (!tool) {
            return res.status(400).json({ error: 'Tool name required' });
        }
        recordToolCall(tool, success !== false, responseTime || 0, context || {});
        res.json({ success: true });
        io.emit('hook-tool', {
            tool,
            success: success !== false,
            responseTime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[!] Hook tool error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 에이전트 Hook (Claude Code에서 자동 호출)
app.post('/api/hooks/agent', (req, res) => {
    try {
        const { agentId, type, action, prompt, status, result, sessionId, timestamp } = req.body;

        if (action === 'start') {
            const record = recordAgentStart({
                agentId: agentId || `agent-${Date.now()}`,
                type: type || 'unknown',
                prompt: prompt || '',
                sessionId: sessionId || `session-${Date.now()}`,
                timestamp: timestamp || new Date().toISOString()
            });
            res.json({ success: true, record });
            io.emit('hook-agent-start', record);
        } else if (action === 'complete') {
            const record = recordAgentComplete(agentId, {
                status: status || 'completed',
                result: result || '',
                timestamp: timestamp || new Date().toISOString()
            });
            res.json({ success: true, record });
            io.emit('hook-agent-complete', record);
        } else {
            res.status(400).json({ error: 'Invalid action. Use "start" or "complete"' });
        }
    } catch (error) {
        console.error('[!] Hook agent error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 Hook 확장: Session & Response (Phase 9) =====

// 세션 시작 Hook
app.post('/api/hooks/session-start', (req, res) => {
    try {
        const { sessionId, startedAt, source, model, cwd } = req.body;

        const record = startSession({
            sessionId: sessionId || `session-${Date.now()}`,
            source: source || 'cli',
            cwd: cwd || process.cwd()
        });

        res.json({ success: true, record });
        io.emit('hook-session-start', record);
    } catch (error) {
        console.error('[!] Hook session-start error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 세션 종료 Hook
app.post('/api/hooks/session-end', (req, res) => {
    try {
        const { sessionId, endedAt } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId required' });
        }

        const record = endSession(sessionId);
        res.json({ success: true, record });
        io.emit('hook-session-end', record);
    } catch (error) {
        console.error('[!] Hook session-end error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 응답 완료 Hook
app.post('/api/hooks/response', (req, res) => {
    try {
        const { sessionId, duration, success, toolsUsed, timestamp } = req.body;

        const record = {
            sessionId: sessionId || null,
            duration: duration || 0,
            success: success !== false,
            toolsUsed: toolsUsed || [],
            timestamp: timestamp || new Date().toISOString()
        };

        res.json({ success: true, record });
        io.emit('hook-response', record);
    } catch (error) {
        console.error('[!] Hook response error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 커스텀 이벤트 Hook
app.post('/api/hooks/event', (req, res) => {
    try {
        const { type, data, sessionId, timestamp } = req.body;

        const record = {
            type: type || 'unknown',
            data: data || {},
            sessionId: sessionId || null,
            timestamp: timestamp || new Date().toISOString()
        };

        res.json({ success: true, record });
        io.emit('hook-event', { type, data: record });
    } catch (error) {
        console.error('[!] Hook event error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===== v4.0 API: 프로젝트 관리 (Phase 9) =====

const projectManager = require('./collectors/project-manager');

// 프로젝트 목록 조회
app.get('/api/projects', (req, res) => {
    try {
        const options = {
            status: req.query.status,
            priority: req.query.priority,
            sortBy: req.query.sortBy || 'updatedAt'
        };
        const data = projectManager.listProjects(options);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 개요 (대시보드용)
app.get('/api/projects/overview', (req, res) => {
    try {
        const data = projectManager.getProjectsOverview();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 생성
app.post('/api/projects', (req, res) => {
    try {
        const project = projectManager.createProject(req.body);
        res.json({ success: true, project });
        io.emit('project-created', project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 상세 조회
app.get('/api/projects/:id', (req, res) => {
    try {
        const project = projectManager.getProject(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 업데이트
app.put('/api/projects/:id', (req, res) => {
    try {
        const project = projectManager.updateProject(req.params.id, req.body);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, project });
        io.emit('project-updated', project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 삭제
app.delete('/api/projects/:id', (req, res) => {
    try {
        const success = projectManager.deleteProject(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true });
        io.emit('project-deleted', { projectId: req.params.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트의 플랜 목록
app.get('/api/projects/:id/plans', (req, res) => {
    try {
        const plans = projectManager.getProjectPlans(req.params.id);
        if (plans === null) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ plans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트에 플랜 연결
app.post('/api/projects/:id/plans', (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) {
            return res.status(400).json({ error: 'planId required' });
        }
        const project = projectManager.linkPlanToProject(req.params.id, planId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, project });
        io.emit('project-plan-linked', { projectId: req.params.id, planId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트에서 플랜 연결 해제
app.delete('/api/projects/:id/plans/:planId', (req, res) => {
    try {
        const project = projectManager.unlinkPlanFromProject(req.params.id, req.params.planId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, project });
        io.emit('project-plan-unlinked', { projectId: req.params.id, planId: req.params.planId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 메트릭 조회
app.get('/api/projects/:id/metrics', (req, res) => {
    try {
        const metrics = projectManager.calculateProjectMetrics(req.params.id);
        if (!metrics) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 목표 추가
app.post('/api/projects/:id/goals', (req, res) => {
    try {
        const goal = projectManager.addProjectGoal(req.params.id, req.body);
        if (!goal) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, goal });
        io.emit('project-goal-added', { projectId: req.params.id, goal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프로젝트 목표 업데이트
app.put('/api/projects/:id/goals/:goalId', (req, res) => {
    try {
        const goal = projectManager.updateProjectGoal(req.params.id, req.params.goalId, req.body);
        if (!goal) {
            return res.status(404).json({ error: 'Project or goal not found' });
        }
        res.json({ success: true, goal });
        io.emit('project-goal-updated', { projectId: req.params.id, goal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 API: 알림 시스템 (Phase 13) =====

// 최근 알림 조회
app.get('/api/alerts', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const includeRead = req.query.includeRead === 'true';
        const data = getRecentAlerts(limit, includeRead);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 알림 통계
app.get('/api/alerts/stats', (req, res) => {
    try {
        const data = getAlertStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 읽지 않은 알림 수
app.get('/api/alerts/unread', (req, res) => {
    try {
        const count = getUnreadCount();
        res.json({ unread: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 알림 설정 조회
app.get('/api/alerts/settings', (req, res) => {
    try {
        const data = getAlertSettings();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 알림 읽음 처리
app.post('/api/alerts/:id/read', (req, res) => {
    try {
        const success = markAlertRead(req.params.id);
        res.json({ success });
        if (success) {
            io.emit('alert-read', { alertId: req.params.id });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 모든 알림 읽음 처리
app.post('/api/alerts/read-all', (req, res) => {
    try {
        const count = markAllAlertsRead();
        res.json({ success: true, count });
        io.emit('alerts-all-read');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 알림 해제
app.post('/api/alerts/:id/dismiss', (req, res) => {
    try {
        const success = dismissAlert(req.params.id);
        res.json({ success });
        if (success) {
            io.emit('alert-dismissed', { alertId: req.params.id });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 규칙 무시 설정
app.post('/api/alerts/rules/:ruleId/mute', (req, res) => {
    try {
        muteRule(req.params.ruleId);
        res.json({ success: true, ruleId: req.params.ruleId, muted: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 규칙 무시 해제
app.post('/api/alerts/rules/:ruleId/unmute', (req, res) => {
    try {
        unmuteRule(req.params.ruleId);
        res.json({ success: true, ruleId: req.params.ruleId, muted: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 규칙 임계값 업데이트
app.put('/api/alerts/rules/:ruleId/threshold', (req, res) => {
    try {
        const { threshold } = req.body;
        if (threshold === undefined) {
            return res.status(400).json({ error: 'Threshold required' });
        }
        const rule = updateRuleThreshold(req.params.ruleId, threshold);
        if (rule) {
            res.json({ success: true, rule });
        } else {
            res.status(404).json({ error: 'Rule not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 수동 알림 테스트 (개발용)
app.post('/api/alerts/test', (req, res) => {
    try {
        const { type, message, severity } = req.body;
        const alert = createAlert('costThreshold', {
            value: '$5.00'
        });
        res.json({ success: true, alert });
        if (alert) {
            io.emit('alert', alert);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 비용 임계값 체크 (Hook에서 호출)
app.post('/api/alerts/check/cost', (req, res) => {
    try {
        const { todayCost } = req.body;
        if (todayCost === undefined) {
            return res.status(400).json({ error: 'todayCost required' });
        }
        const alerts = checkCostAlert(parseFloat(todayCost));
        res.json({ alerts });
        alerts.forEach(alert => {
            io.emit('alert', alert);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 API: 세션 리플레이 (Phase 14) =====

// 세션 목록 조회
app.get('/api/sessions', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const days = parseInt(req.query.days) || 30;
        const status = req.query.status || null;
        const data = listSessions({ limit, days, status });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 통계
app.get('/api/sessions/stats', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const data = getSessionsStats(days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 상세 조회
app.get('/api/sessions/:id', (req, res) => {
    try {
        const session = getSessionDetail(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 이벤트 목록
app.get('/api/sessions/:id/events', (req, res) => {
    try {
        const options = {
            type: req.query.type,
            offset: parseInt(req.query.offset) || 0,
            limit: parseInt(req.query.limit) || 100
        };
        const events = getSessionEvents(req.params.id, options);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 리플레이 데이터
app.get('/api/sessions/:id/replay', (req, res) => {
    try {
        const data = getReplayData(req.params.id);
        if (!data) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 시작 (Hook에서 호출)
app.post('/api/sessions/start', (req, res) => {
    try {
        const { sessionId, metadata } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId required' });
        }
        const session = startSession(sessionId, metadata || {});
        res.json({ success: true, session });
        io.emit('session-started', { sessionId, startTime: session.startTime });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 종료 (Hook에서 호출)
app.post('/api/sessions/:id/end', (req, res) => {
    try {
        const session = endSession(req.params.id, req.body);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true, session });
        io.emit('session-ended', {
            sessionId: session.sessionId,
            endTime: session.endTime,
            stats: session.stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션에 이벤트 추가 (Hook에서 호출)
app.post('/api/sessions/:id/events', (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type) {
            return res.status(400).json({ error: 'Event type required' });
        }
        const event = addSessionEvent(req.params.id, type, data || {});
        res.json({ success: true, event });
        io.emit('session-event', {
            sessionId: req.params.id,
            event
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 세션 삭제
app.delete('/api/sessions/:id', (req, res) => {
    try {
        const success = deleteSession(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true });
        io.emit('session-deleted', { sessionId: req.params.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 API: 통합 검색 (Phase 16) =====

app.get('/api/search', (req, res) => {
    try {
        const { q, type = 'all', limit = 50 } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const query = q.toLowerCase();
        const results = { plans: [], tools: [], agents: [], prompts: [], tasks: [], total: 0 };

        // Search plans
        if (type === 'all' || type === 'plans') {
            const plans = collectAllPlans();
            results.plans = plans.plans.filter(plan =>
                plan.name?.toLowerCase().includes(query) ||
                plan.title?.toLowerCase().includes(query) ||
                plan.description?.toLowerCase().includes(query)
            ).slice(0, parseInt(limit) / 5).map(p => ({
                type: 'plan',
                id: p.id,
                title: p.title || p.name,
                description: p.description,
                status: p.status,
                highlight: highlightMatch(p.title || p.name, query)
            }));
        }

        // Search tools
        if (type === 'all' || type === 'tools') {
            const tools = collectToolStats();
            results.tools = Object.entries(tools.tools || {})
                .filter(([name]) => name.toLowerCase().includes(query))
                .slice(0, parseInt(limit) / 5)
                .map(([name, data]) => ({
                    type: 'tool',
                    id: name,
                    title: name,
                    description: `${data.calls} calls, ${(data.successRate * 100).toFixed(0)}% success`,
                    highlight: highlightMatch(name, query)
                }));
        }

        // Search agents
        if (type === 'all' || type === 'agents') {
            const agents = collectRecentAgents(30);
            results.agents = agents.agents.filter(agent =>
                agent.type?.toLowerCase().includes(query) ||
                agent.prompt?.toLowerCase().includes(query)
            ).slice(0, parseInt(limit) / 5).map(a => ({
                type: 'agent',
                id: a.agentId,
                title: `${a.type} Agent`,
                description: (a.prompt || '').substring(0, 100),
                status: a.status,
                highlight: highlightMatch(a.type || 'Agent', query)
            }));
        }

        // Search prompts
        if (type === 'all' || type === 'prompts') {
            const promptResult = searchPrompts(query, { days: 30, limit: parseInt(limit) / 5 });
            results.prompts = (promptResult.results || []).map(p => ({
                type: 'prompt',
                id: p.id,
                title: (p.prompt || '').substring(0, 60) + '...',
                description: `${timeAgo(p.timestamp)}`,
                highlight: highlightMatch((p.prompt || '').substring(0, 60), query)
            }));
        }

        // Search tasks
        if (type === 'all' || type === 'tasks') {
            const tasks = collectAllTasks();
            results.tasks = tasks.tasks.filter(task =>
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query) ||
                task.subject?.toLowerCase().includes(query)
            ).slice(0, parseInt(limit) / 5).map(t => ({
                type: 'task',
                id: t.id,
                title: t.title || t.subject,
                description: (t.description || '').substring(0, 100),
                status: t.status,
                highlight: highlightMatch(t.title || t.subject || 'Task', query)
            }));
        }

        results.total = results.plans.length + results.tools.length +
            results.agents.length + results.prompts.length + results.tasks.length;

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for search highlighting
function highlightMatch(text, query) {
    if (!text) return '';
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Simple timeAgo helper
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ===== v3.0 API: 데이터 내보내기 (Phase 17) =====

// Export plans
app.get('/api/export/plans', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const plans = collectAllPlans();

        if (format === 'csv') {
            const csv = convertToCSV(plans.plans, ['id', 'title', 'status', 'progress', 'createdAt', 'updatedAt']);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=plans.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=plans.json');
            res.json(plans.plans);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export tools
app.get('/api/export/tools', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const tools = collectToolStats();
        const toolsArray = Object.entries(tools.tools || {}).map(([name, data]) => ({
            name,
            calls: data.calls,
            successRate: data.successRate,
            avgResponseTime: data.avgResponseTime,
            lastUsed: data.lastUsed
        }));

        if (format === 'csv') {
            const csv = convertToCSV(toolsArray, ['name', 'calls', 'successRate', 'avgResponseTime', 'lastUsed']);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=tools.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=tools.json');
            res.json(toolsArray);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export costs
app.get('/api/export/costs', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const days = parseInt(req.query.days) || 30;
        const costs = collectCostStats(days);

        if (format === 'csv') {
            const csv = convertToCSV(costs.dailyStats || [], ['date', 'cost', 'inputTokens', 'outputTokens', 'sessions']);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=costs.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=costs.json');
            res.json(costs);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export sessions
app.get('/api/export/sessions', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const days = parseInt(req.query.days) || 30;
        const sessions = listSessions({ days, limit: 500 });

        if (format === 'csv') {
            const csv = convertToCSV(sessions, ['sessionId', 'startTime', 'endTime', 'status']);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=sessions.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=sessions.json');
            res.json(sessions);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CSV converter helper
function convertToCSV(data, columns) {
    if (!data || !data.length) return columns.join(',') + '\n';

    const header = columns.join(',');
    const rows = data.map(item =>
        columns.map(col => {
            let val = item[col];
            if (val === null || val === undefined) val = '';
            if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
            return val;
        }).join(',')
    );

    return header + '\n' + rows.join('\n');
}

// ===== v3.0 API: 워크플로우 (Phase 6 - Advanced Integration) =====

const {
    recordWorkflowStart, recordPhaseChange, recordWorkflowComplete,
    getCurrentWorkflow, getActiveWorkflows, getWorkflowHistory,
    getWorkflowStats, generateRIPERMermaid, getWorkflowTimelineData,
    collectWorkflowData, RIPER_PHASES
} = require('./collectors/workflow-collector');

// 워크플로우 전체 데이터
app.get('/api/workflows', (req, res) => {
    try {
        const data = collectWorkflowData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 활성 워크플로우 목록
app.get('/api/workflows/active', (req, res) => {
    try {
        const data = getActiveWorkflows();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 통계
app.get('/api/workflows/stats', (req, res) => {
    try {
        const data = getWorkflowStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 히스토리
app.get('/api/workflows/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type || null;
        const data = getWorkflowHistory({ limit, type });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RIPER+ Mermaid 다이어그램
app.get('/api/workflows/mermaid', (req, res) => {
    try {
        const workflowId = req.query.workflowId || null;
        const mermaid = generateRIPERMermaid(workflowId);
        res.type('text/plain').send(mermaid);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 워크플로우 상세
app.get('/api/workflows/:id', (req, res) => {
    try {
        const workflow = getCurrentWorkflow(req.params.id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 타임라인 데이터
app.get('/api/workflows/:id/timeline', (req, res) => {
    try {
        const data = getWorkflowTimelineData(req.params.id);
        if (!data) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 시작 (Hook에서 호출)
app.post('/api/workflows/start', (req, res) => {
    try {
        const { workflowId, taskId, metadata } = req.body;
        if (!workflowId || !taskId) {
            return res.status(400).json({ error: 'workflowId and taskId required' });
        }
        const workflow = recordWorkflowStart(workflowId, taskId, metadata || {});
        res.json({ success: true, workflow });
        io.emit('workflow-started', workflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Phase 변경 (Hook에서 호출)
app.post('/api/workflows/:id/phase', (req, res) => {
    try {
        const { phase, gateResult } = req.body;
        if (!phase || !RIPER_PHASES.includes(phase)) {
            return res.status(400).json({ error: 'Invalid phase' });
        }
        const workflow = recordPhaseChange(req.params.id, phase, gateResult);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json({ success: true, workflow });
        io.emit('workflow-phase-changed', { workflowId: req.params.id, phase, gateResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 완료 (Hook에서 호출)
app.post('/api/workflows/:id/complete', (req, res) => {
    try {
        const result = req.body;
        const workflow = recordWorkflowComplete(req.params.id, result);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json({ success: true, workflow });
        io.emit('workflow-completed', { workflowId: req.params.id, workflow });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 워크플로우 Mermaid (Phase 9 Week 3)
app.get('/api/workflows/:id/mermaid', (req, res) => {
    try {
        const mermaid = generateRIPERMermaid(req.params.id);
        res.json({ mermaid, workflowId: req.params.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v4.0 API: 인사이트 엔진 (Phase 9 Week 3) =====

const {
    INSIGHT_TYPES, createInsight, analyzeWorkflowPatterns, predictCompletion,
    analyzeGoalProgress, generateSuggestions, getInsights, acknowledgeInsight,
    getInsightStats, collectInsightData
} = require('./collectors/insight-engine');

// 인사이트 전체 데이터
app.get('/api/insights', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type || null;
        const acknowledged = req.query.acknowledged === 'true' ? true :
                             req.query.acknowledged === 'false' ? false : null;
        const insights = getInsights({ limit, type, acknowledged });
        res.json({ insights });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 인사이트 통계
app.get('/api/insights/stats', (req, res) => {
    try {
        const stats = getInsightStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 인사이트 확인 처리
app.post('/api/insights/:id/acknowledge', (req, res) => {
    try {
        const insight = acknowledgeInsight(req.params.id);
        if (!insight) {
            return res.status(404).json({ error: 'Insight not found' });
        }
        res.json({ success: true, insight });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 수동 인사이트 생성
app.post('/api/insights', (req, res) => {
    try {
        const { type, title, description, data } = req.body;
        if (!type || !title) {
            return res.status(400).json({ error: 'type and title required' });
        }
        const insight = createInsight(type, title, description, data);
        res.json({ success: true, insight });
        io.emit('insight-created', insight);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 워크플로우 패턴 분석
app.post('/api/insights/analyze/workflow', (req, res) => {
    try {
        const workflowHistory = getWorkflowHistory({ limit: 200 });
        const analysis = analyzeWorkflowPatterns(workflowHistory);
        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 완료 예측
app.get('/api/insights/predict/completion', (req, res) => {
    try {
        const tasks = collectAllTasks().tasks || [];
        const prediction = predictCompletion(tasks);
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 스마트 제안
app.get('/api/insights/suggestions', (req, res) => {
    try {
        const active = getActiveWorkflows();
        const currentPhase = active.length > 0 ? active[0].currentPhase : null;
        const tasks = collectAllTasks().tasks || [];

        const suggestions = generateSuggestions({
            currentPhase,
            tasks
        });
        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v4.0 API: MCP Bridge (Phase 9 Week 4) =====

const {
    getVibekanbanProjects, getVibekanbanTickets, getVibekanbanKanbanStatus,
    getKiroMemoryTasks, getKiroProjectSummary, getKiroThinkingChains,
    collectMCPTasks, getMCPStatus
} = require('./collectors/mcp-bridge');

// MCP 서버 상태
app.get('/api/mcp/status', (req, res) => {
    try {
        const status = getMCPStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 통합 MCP 태스크 목록
app.get('/api/mcp/tasks', (req, res) => {
    try {
        const data = collectMCPTasks();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vibekanban 프로젝트 목록
app.get('/api/mcp/vibekanban/projects', (req, res) => {
    try {
        const projects = getVibekanbanProjects();
        res.json({ projects, count: projects.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vibekanban 티켓 목록
app.get('/api/mcp/vibekanban/tickets', (req, res) => {
    try {
        const projectId = req.query.projectId || null;
        const tickets = getVibekanbanTickets(projectId);
        res.json({ tickets, count: tickets.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vibekanban 칸반 보드 상태
app.get('/api/mcp/vibekanban/kanban/:projectId', (req, res) => {
    try {
        const status = getVibekanbanKanbanStatus(req.params.projectId);
        res.json(status || { error: 'Project not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kiro Memory 태스크 목록
app.get('/api/mcp/kiro/tasks', (req, res) => {
    try {
        const tasks = getKiroMemoryTasks();
        res.json({ tasks, count: tasks.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kiro Memory 프로젝트 요약
app.get('/api/mcp/kiro/summary', (req, res) => {
    try {
        const summary = getKiroProjectSummary();
        res.json(summary || { message: 'No project summary available' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kiro Memory Thinking Chains
app.get('/api/mcp/kiro/thinking-chains', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const chains = getKiroThinkingChains(limit);
        res.json({ chains, count: chains.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== v3.0 API: 라이프사이클 (Phase 7) =====

// 라이프사이클 전체 목록
app.get('/api/lifecycle', (req, res) => {
    try {
        const data = collectAllLifecycles();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 플랜 라이프사이클 상세
app.get('/api/lifecycle/:planId', (req, res) => {
    try {
        const data = getLifecycleDetail(req.params.planId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 라이프사이클 Mermaid 다이어그램
app.get('/api/lifecycle/:planId/mermaid', (req, res) => {
    try {
        const lifecycle = getLifecycleDetail(req.params.planId);
        const mermaid = generateLifecycleMermaid(lifecycle);
        res.type('text/plain').send(mermaid);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Phase 시작
app.post('/api/lifecycle/:planId/phase/start', (req, res) => {
    try {
        const { phase, goals } = req.body;
        const lifecycle = startPhase(req.params.planId, phase, goals || []);
        res.json({ success: true, lifecycle });
        io.emit('lifecycle-phase-started', { planId: req.params.planId, phase, lifecycle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Phase 완료
app.post('/api/lifecycle/:planId/phase/complete', (req, res) => {
    try {
        const { phase } = req.body;
        const lifecycle = completePhase(req.params.planId, phase);
        res.json({ success: true, lifecycle });
        io.emit('lifecycle-phase-completed', { planId: req.params.planId, phase, lifecycle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Phase 진행률 업데이트
app.post('/api/lifecycle/:planId/phase/progress', (req, res) => {
    try {
        const { phase, progress, implementedGoals } = req.body;
        const lifecycle = updatePhaseProgress(req.params.planId, phase, progress, implementedGoals);
        res.json({ success: true, lifecycle });
        io.emit('lifecycle-progress-updated', { planId: req.params.planId, phase, progress, lifecycle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 목표 추가
app.post('/api/lifecycle/:planId/goals', (req, res) => {
    try {
        const lifecycle = addGoal(req.params.planId, req.body);
        res.json({ success: true, lifecycle });
        io.emit('lifecycle-goal-added', { planId: req.params.planId, goal: req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 목표 진행률 업데이트
app.post('/api/lifecycle/:planId/goals/:goalId/progress', (req, res) => {
    try {
        const { progress, status } = req.body;
        const lifecycle = updateGoalProgress(req.params.planId, req.params.goalId, progress, status);
        res.json({ success: true, lifecycle });
        io.emit('goal-progress-updated', { planId: req.params.planId, goalId: req.params.goalId, progress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 프롬프트 라이프사이클 연결
app.post('/api/lifecycle/:planId/prompts', (req, res) => {
    try {
        const { phase, promptId } = req.body;
        const lifecycle = linkPromptToPhase(req.params.planId, phase, promptId);
        res.json({ success: true, lifecycle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Goal Evaluator API (Phase 8F) =====
let goalEvaluator;
try {
    goalEvaluator = require('./collectors/goal-evaluator');
} catch (e) {
    console.log('[*] Goal evaluator not available');
}

// All goals summary (must be before :planId routes)
app.get('/api/goals/summary', (req, res) => {
    if (!goalEvaluator) return res.status(503).json({ error: 'Goal evaluator not available' });
    try {
        const result = goalEvaluator.getAllGoalsSummary();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Goal evaluation for a plan
app.get('/api/goals/:planId/evaluate', (req, res) => {
    if (!goalEvaluator) return res.status(503).json({ error: 'Goal evaluator not available' });
    try {
        const result = goalEvaluator.evaluateGoalProgress(req.params.planId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add goal to a plan
app.post('/api/goals/:planId', (req, res) => {
    if (!goalEvaluator) return res.status(503).json({ error: 'Goal evaluator not available' });
    try {
        const goal = goalEvaluator.addGoal(req.params.planId, req.body);
        io.emit('goal-added', { planId: req.params.planId, goal });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update goal progress
app.put('/api/goals/:planId/:goalId', (req, res) => {
    if (!goalEvaluator) return res.status(503).json({ error: 'Goal evaluator not available' });
    try {
        const { progress, status } = req.body;
        const lifecycle = goalEvaluator.updateGoalManually(req.params.planId, req.params.goalId, progress, status);
        io.emit('goal-updated', { planId: req.params.planId, goalId: req.params.goalId, progress, status });
        res.json(lifecycle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete goal
app.delete('/api/goals/:planId/:goalId', (req, res) => {
    if (!goalEvaluator) return res.status(503).json({ error: 'Goal evaluator not available' });
    try {
        const success = goalEvaluator.removeGoal(req.params.planId, req.params.goalId);
        if (success) {
            io.emit('goal-removed', { planId: req.params.planId, goalId: req.params.goalId });
        }
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== File Watcher (Real-time) =====
const watcher = chokidar.watch([
    path.join(BASE_PATH, 'plans'),
    path.join(BASE_PATH, 'planning-log'),
    path.join(BASE_PATH, 'ShrimpData/tasks'),
    path.join(BASE_PATH, 'atos/usage-stats.json'),
    path.join(BASE_PATH, 'atos/logs'),
    path.join(BASE_PATH, '.claude/skills'),
    path.join(BASE_PATH, 'unified-task-system'),
    path.join(BASE_PATH, 'data/tasks.json')
], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
});

watcher.on('all', (event, filePath) => {
    console.log(`[*] File ${event}: ${filePath}`);

    // 클라이언트에 변경 알림
    io.emit('file-change', {
        event,
        path: filePath,
        timestamp: new Date().toISOString()
    });

    // 변경 유형에 따라 데이터 전송
    if (filePath.includes('plans')) {
        io.emit('plans-updated', collectAllPlans());
        // Lifecycle 업데이트도 함께 전송 (Phase 8G)
        io.emit('lifecycles-updated', collectAllLifecycles());
    } else if (filePath.includes('ShrimpData') || filePath.includes('unified-task-system') || filePath.includes('data/tasks')) {
        io.emit('tasks-updated', collectAllTasks());
    } else if (filePath.includes('atos')) {
        io.emit('tools-updated', collectToolStats());
    } else if (filePath.includes('prompts')) {
        io.emit('prompts-updated', collectRecentPrompts(7));
    } else if (filePath.includes('agents')) {
        io.emit('agents-updated', collectRecentAgents(7));
    } else if (filePath.includes('skills')) {
        io.emit('skills-updated', collectSkillStats());
    } else if (filePath.includes('lifecycles') || filePath.includes('lifecycle')) {
        // Lifecycle 파일 변경 감지 (Phase 8G)
        io.emit('lifecycles-updated', collectAllLifecycles());
        if (goalEvaluator) {
            io.emit('goals-updated', goalEvaluator.getAllGoalsSummary());
        }
    }
});

// ===== WebSocket =====
io.on('connection', (socket) => {
    console.log('[+] Client connected');
    
    // 초기 데이터 전송
    socket.emit('init', {
        plans: collectAllPlans(),
        tasks: collectAllTasks(),
        stats: getStats(),
        tools: collectToolStats(),
        agents: collectRecentAgents(7),
        prompts: collectRecentPrompts(7),
        skills: collectSkillStats(),
        alerts: {
            recent: getRecentAlerts(20),
            unread: getUnreadCount(),
            stats: getAlertStats()
        }
    });
    
    socket.on('disconnect', () => {
        console.log('[-] Client disconnected');
    });
});

// ===== Server Start =====
server.listen(PORT, () => {
    console.log('========================================');
    console.log('  Plan Ecosystem Dashboard v3.0');
    console.log('  AI Agent Observability Platform');
    console.log('========================================');
    console.log(`[+] Server: http://localhost:${PORT}`);
    console.log('[*] Watching: plans/, planning-log/, ShrimpData/, atos/');
    console.log('[*] API Endpoints:');
    console.log('    -- Plans --');
    console.log('    GET  /api/plans      - All plans');
    console.log('    GET  /api/plans/:id  - Plan detail');
    console.log('    GET  /api/logs       - Recent logs');
    console.log('    GET  /api/tasks      - Shrimp tasks');
    console.log('    GET  /api/stats      - Statistics');
    console.log('    -- Prompts (v2.0) --');
    console.log('    GET  /api/prompts         - Prompt history');
    console.log('    GET  /api/prompts/stats   - Prompt statistics');
    console.log('    GET  /api/prompts/search  - Search prompts');
    console.log('    POST /api/prompts         - Record prompt');
    console.log('    -- Tools (v2.0) --');
    console.log('    GET  /api/tools           - Tool statistics');
    console.log('    GET  /api/tools/categories- By category');
    console.log('    GET  /api/tools/top       - Top tools');
    console.log('    GET  /api/tools/chains    - Chaining patterns');
    console.log('    GET  /api/tools/timeline  - Tool timeline');
    console.log('    POST /api/tools/record    - Record tool call');
    console.log('    -- Agents (v2.0) --');
    console.log('    GET  /api/agents          - Agent history');
    console.log('    GET  /api/agents/stats    - Agent statistics');
    console.log('    GET  /api/agents/running  - Running agents');
    console.log('    GET  /api/agents/timeline - Agent timeline');
    console.log('    POST /api/agents/start    - Record agent start');
    console.log('    POST /api/agents/complete - Record agent complete');
    console.log('    -- System Graph (v2.0 Phase 9) --');
    console.log('    GET  /api/system-graph         - Full graph');
    console.log('    GET  /api/system-graph/d3      - D3.js format');
    console.log('    GET  /api/system-graph/mermaid - Mermaid diagram');
    console.log('    GET  /api/system-graph/categories - By category');
    console.log('    GET  /api/system-graph/node/:id   - Node connections');
    console.log('    GET  /api/system-graph/status     - System status');
    console.log('    -- Costs (v2.0 Phase 11) --');
    console.log('    GET  /api/costs           - Cost statistics');
    console.log('    GET  /api/costs/today     - Today cost');
    console.log('    GET  /api/costs/sessions  - Recent sessions');
    console.log('    GET  /api/costs/monthly   - Monthly stats');
    console.log('    GET  /api/costs/trend     - Token trend');
    console.log('    GET  /api/costs/projected - Projected cost');
    console.log('    POST /api/costs/record    - Record session cost');
    console.log('    -- Hooks (v3.0 Phase 12 + v4.0 Phase 9) --');
    console.log('    POST /api/hooks/prompt       - Auto prompt tracking');
    console.log('    POST /api/hooks/cost         - Auto cost tracking');
    console.log('    POST /api/hooks/tool         - Auto tool tracking');
    console.log('    POST /api/hooks/agent        - Auto agent tracking');
    console.log('    POST /api/hooks/session-start- Session start');
    console.log('    POST /api/hooks/session-end  - Session end');
    console.log('    POST /api/hooks/response     - Response completion');
    console.log('    POST /api/hooks/event        - Custom event');
    console.log('    -- Projects (v4.0 Phase 9) --');
    console.log('    GET  /api/projects          - Project list');
    console.log('    GET  /api/projects/overview - Dashboard overview');
    console.log('    POST /api/projects          - Create project');
    console.log('    GET  /api/projects/:id      - Project detail');
    console.log('    PUT  /api/projects/:id      - Update project');
    console.log('    DELETE /api/projects/:id    - Delete project');
    console.log('    GET  /api/projects/:id/plans- Project plans');
    console.log('    POST /api/projects/:id/plans- Link plan');
    console.log('    DELETE /api/projects/:id/plans/:planId - Unlink plan');
    console.log('    GET  /api/projects/:id/metrics - Project metrics');
    console.log('    POST /api/projects/:id/goals- Add goal');
    console.log('    PUT  /api/projects/:id/goals/:goalId - Update goal');
    console.log('    -- Alerts (v3.0 Phase 13) --');
    console.log('    GET  /api/alerts          - Recent alerts');
    console.log('    GET  /api/alerts/stats    - Alert statistics');
    console.log('    GET  /api/alerts/unread   - Unread count');
    console.log('    POST /api/alerts/:id/read - Mark as read');
    console.log('    POST /api/alerts/:id/dismiss - Dismiss alert');
    console.log('    -- Sessions (v3.0 Phase 14) --');
    console.log('    GET  /api/sessions           - Session list');
    console.log('    GET  /api/sessions/:id       - Session detail');
    console.log('    GET  /api/sessions/:id/replay- Replay data');
    console.log('    POST /api/sessions/start     - Start session');
    console.log('    POST /api/sessions/:id/end   - End session');
    console.log('    -- Search (v3.0 Phase 16) --');
    console.log('    GET  /api/search             - Unified search');
    console.log('    -- Export (v3.0 Phase 17) --');
    console.log('    GET  /api/export/plans       - Export plans');
    console.log('    GET  /api/export/tools       - Export tools');
    console.log('    GET  /api/export/costs       - Export costs');
    console.log('    GET  /api/export/sessions    - Export sessions');
    console.log('    -- Workflows (v3.0 Phase 6) --');
    console.log('    GET  /api/workflows          - Workflow data');
    console.log('    GET  /api/workflows/active   - Active workflows');
    console.log('    GET  /api/workflows/stats    - Workflow stats');
    console.log('    GET  /api/workflows/history  - Workflow history');
    console.log('    GET  /api/workflows/mermaid  - RIPER+ Mermaid');
    console.log('    GET  /api/workflows/:id      - Workflow detail');
    console.log('    POST /api/workflows/start    - Start workflow');
    console.log('    POST /api/workflows/:id/phase- Change phase');
    console.log('    POST /api/workflows/:id/complete - Complete workflow');
    console.log('    -- Lifecycle (v3.0 Phase 7) --');
    console.log('    GET  /api/lifecycle            - All lifecycles');
    console.log('    GET  /api/lifecycle/:planId    - Lifecycle detail');
    console.log('    GET  /api/lifecycle/:planId/mermaid - Mermaid diagram');
    console.log('    POST /api/lifecycle/:planId/phase/start - Start phase');
    console.log('    POST /api/lifecycle/:planId/phase/complete - Complete phase');
    console.log('    POST /api/lifecycle/:planId/phase/progress - Update progress');
    console.log('    POST /api/lifecycle/:planId/goals - Add goal');
    console.log('    POST /api/lifecycle/:planId/goals/:goalId/progress - Update goal');
    console.log('========================================');
});
