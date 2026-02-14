/**
 * ATOS Execution Monitor
 * 도구 실행 추적 및 통계 업데이트
 *
 * 위치: K:/PortableApps/genai/atos/execution-monitor.js
 *
 * 기능:
 * - 도구 호출 전/후 추적
 * - 실행 시간 측정
 * - 성공/실패 기록
 * - 체이닝 패턴 감지
 * - usage-stats.json 자동 업데이트
 *
 * 사용법:
 *   const monitor = require('./execution-monitor.js');
 *   monitor.beforeCall('firecrawl_search', { query: 'AI' });
 *   // ... 도구 실행 ...
 *   monitor.afterCall('firecrawl_search', true, result);
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 경로 설정
const BASE_PATH = path.resolve(__dirname);

// Dashboard 연동 설정
const DASHBOARD_HOST = process.env.DASHBOARD_HOST || 'localhost';
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 7847;

/**
 * Dashboard에 도구 호출 기록 전송 (비동기, 실패 무시)
 */
function notifyDashboard(endpoint, data) {
    try {
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: DASHBOARD_HOST,
            port: DASHBOARD_PORT,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        });
        req.on('error', () => {}); // 실패 시 조용히 무시
        req.setTimeout(2000, () => req.destroy());
        req.write(postData);
        req.end();
    } catch (e) {
        // Dashboard 미실행 시 무시
    }
}
const USAGE_STATS_FILE = path.join(BASE_PATH, 'usage-stats.json');
const TOOL_REGISTRY_FILE = path.join(BASE_PATH, 'tool-registry.json');
const SESSION_LOG_DIR = path.join(BASE_PATH, 'logs');

// 세션 상태
let currentSession = {
  id: null,
  startTime: null,
  toolCalls: [],
  chainingSequence: []
};

// 활성 호출 추적 (실행 시간 측정용)
const activeCalls = new Map();

/**
 * 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`[!] 파일 읽기 실패 (${path.basename(filePath)}):`, error.message);
  }
  return defaultValue;
}

/**
 * 파일 안전하게 쓰기
 */
function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] 파일 쓰기 실패:`, error.message);
    return false;
  }
}

/**
 * 세션 ID 생성
 */
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * 도구 이름 정규화 (mcp__ 접두사 처리)
 */
function normalizeToolName(toolName) {
  // mcp__server__tool 형식을 server.tool로 변환
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.replace('mcp__', '').split('__');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts.slice(1).join('_')}`;
    }
  }
  return toolName;
}

/**
 * 도구 카테고리 조회
 */
function getToolCategory(toolName) {
  const registry = safeReadJSON(TOOL_REGISTRY_FILE);
  const normalized = normalizeToolName(toolName);
  const [server] = normalized.split('.');

  // MCP 서버에서 찾기
  for (const [serverName, serverInfo] of Object.entries(registry.mcpServers || {})) {
    if (serverName === server || serverName.includes(server)) {
      return serverInfo.category || 'general';
    }
  }

  return 'general';
}

// ============================================
// 세션 관리
// ============================================

/**
 * 새 세션 시작
 */
function startSession() {
  currentSession = {
    id: generateSessionId(),
    startTime: new Date().toISOString(),
    toolCalls: [],
    chainingSequence: []
  };

  // 전역 통계 업데이트
  const stats = safeReadJSON(USAGE_STATS_FILE);
  stats.globalStats = stats.globalStats || {};
  stats.globalStats.totalSessions = (stats.globalStats.totalSessions || 0) + 1;
  stats.lastUpdated = new Date().toISOString();
  safeWriteJSON(USAGE_STATS_FILE, stats);

  console.log(`[+] 새 세션 시작: ${currentSession.id}`);
  return currentSession.id;
}

/**
 * 세션 종료 및 저장
 */
function endSession() {
  if (!currentSession.id) {
    console.log('[!] 활성 세션 없음');
    return null;
  }

  const sessionData = {
    ...currentSession,
    endTime: new Date().toISOString(),
    toolCount: currentSession.toolCalls.length,
    uniqueTools: [...new Set(currentSession.toolCalls.map(c => c.tool))]
  };

  // 세션 히스토리에 저장
  const stats = safeReadJSON(USAGE_STATS_FILE);
  stats.sessions = stats.sessions || { history: [], maxHistorySize: 100 };

  // 세션 요약만 저장 (전체 호출 로그는 별도 파일)
  stats.sessions.history.unshift({
    id: sessionData.id,
    startTime: sessionData.startTime,
    endTime: sessionData.endTime,
    toolCount: sessionData.toolCount,
    uniqueTools: sessionData.uniqueTools
  });

  // 최대 히스토리 크기 유지
  if (stats.sessions.history.length > stats.sessions.maxHistorySize) {
    stats.sessions.history = stats.sessions.history.slice(0, stats.sessions.maxHistorySize);
  }

  // 평균 도구 사용 수 업데이트
  const totalCalls = stats.sessions.history.reduce((sum, s) => sum + (s.toolCount || 0), 0);
  stats.globalStats.averageToolsPerSession =
    Math.round((totalCalls / stats.sessions.history.length) * 100) / 100;

  stats.lastUpdated = new Date().toISOString();
  safeWriteJSON(USAGE_STATS_FILE, stats);

  // 상세 로그 별도 저장
  saveSessionLog(sessionData);

  console.log(`[+] 세션 종료: ${currentSession.id} (${sessionData.toolCount}개 도구 호출)`);

  const result = { ...currentSession };
  currentSession = { id: null, startTime: null, toolCalls: [], chainingSequence: [] };

  return result;
}

/**
 * 세션 로그 파일 저장
 */
function saveSessionLog(sessionData) {
  if (!fs.existsSync(SESSION_LOG_DIR)) {
    fs.mkdirSync(SESSION_LOG_DIR, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(SESSION_LOG_DIR, `session-${date}.jsonl`);

  try {
    fs.appendFileSync(logFile, JSON.stringify(sessionData) + '\n', 'utf8');
  } catch (error) {
    console.error('[!] 세션 로그 저장 실패:', error.message);
  }
}

// ============================================
// 도구 호출 추적
// ============================================

/**
 * 도구 호출 전 기록
 */
function beforeCall(toolName, params = {}) {
  // 세션 없으면 자동 시작
  if (!currentSession.id) {
    startSession();
  }

  const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const normalized = normalizeToolName(toolName);

  activeCalls.set(callId, {
    tool: normalized,
    originalName: toolName,
    params: params,
    startTime: Date.now(),
    context: extractContext(params)
  });

  console.log(`[*] 도구 호출 시작: ${normalized}`);

  return callId;
}

/**
 * 도구 호출 후 기록
 */
function afterCall(callIdOrToolName, success = true, result = null, error = null) {
  let callInfo;
  let callId;

  // callId로 조회 또는 도구 이름으로 마지막 호출 찾기
  if (activeCalls.has(callIdOrToolName)) {
    callId = callIdOrToolName;
    callInfo = activeCalls.get(callId);
  } else {
    // 도구 이름으로 마지막 활성 호출 찾기
    const normalized = normalizeToolName(callIdOrToolName);
    for (const [id, info] of activeCalls) {
      if (info.tool === normalized) {
        callId = id;
        callInfo = info;
        break;
      }
    }
  }

  if (!callInfo) {
    // 호출 정보 없으면 새로 생성
    callInfo = {
      tool: normalizeToolName(callIdOrToolName),
      originalName: callIdOrToolName,
      params: {},
      startTime: Date.now() - 100, // 기본 100ms
      context: {}
    };
  }

  const endTime = Date.now();
  const responseTime = endTime - callInfo.startTime;

  const callRecord = {
    tool: callInfo.tool,
    success: success,
    responseTime: responseTime,
    timestamp: new Date().toISOString(),
    context: callInfo.context,
    error: error ? String(error) : null
  };

  // 세션에 기록
  currentSession.toolCalls.push(callRecord);

  // 체이닝 시퀀스 업데이트
  currentSession.chainingSequence.push(callInfo.tool);

  // usage-stats.json 업데이트
  updateToolStats(callInfo.tool, success, responseTime, callInfo.context);

  // 체이닝 패턴 감지
  detectChainingPattern();

  // 활성 호출에서 제거
  if (callId) {
    activeCalls.delete(callId);
  }

  const status = success ? '[+]' : '[-]';
  console.log(`${status} 도구 호출 완료: ${callInfo.tool} (${responseTime}ms)`);

  // Dashboard에 실시간 알림
  notifyDashboard('/api/tools/record', {
    tool: callInfo.tool,
    success: success,
    responseTime: responseTime,
    context: callInfo.context
  });

  return callRecord;
}

/**
 * 파라미터에서 컨텍스트 추출
 */
function extractContext(params) {
  const context = {};

  if (!params || typeof params !== 'object') {
    return context;
  }

  // URL 컨텍스트
  if (params.url || params.urls) {
    context.hasUrl = true;
  }

  // 파일 경로 컨텍스트
  if (params.path || params.file_path || params.filePath) {
    context.hasFilePath = true;
  }

  // 쿼리 컨텍스트
  if (params.query || params.q || params.search) {
    context.hasQuery = true;
  }

  // GitHub 컨텍스트
  if (params.owner || params.repo) {
    context.hasGithub = true;
  }

  return context;
}

/**
 * 도구 통계 업데이트
 */
function updateToolStats(toolName, success, responseTime, context) {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  // 도구 통계 초기화
  if (!stats.tools) {
    stats.tools = {};
  }

  if (!stats.tools[toolName]) {
    stats.tools[toolName] = {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastUsed: null,
      commonContexts: [],
      chainedWith: [],
      recommendedCount: 0,
      recommendedAcceptedCount: 0,
      inputExamples: []
    };
  }

  const toolStats = stats.tools[toolName];

  // 기본 통계 업데이트
  toolStats.totalCalls++;
  if (success) {
    toolStats.successCount++;
  } else {
    toolStats.failureCount++;
  }
  toolStats.successRate = Math.round((toolStats.successCount / toolStats.totalCalls) * 100);

  // 평균 응답 시간 업데이트 (이동 평균)
  toolStats.averageResponseTime = Math.round(
    (toolStats.averageResponseTime * (toolStats.totalCalls - 1) + responseTime) / toolStats.totalCalls
  );

  toolStats.lastUsed = new Date().toISOString();

  // 컨텍스트 기록
  if (Object.keys(context).length > 0) {
    const contextKey = Object.keys(context).sort().join('+');
    if (!toolStats.commonContexts.includes(contextKey)) {
      toolStats.commonContexts.push(contextKey);
      // 최대 10개 컨텍스트 유지
      if (toolStats.commonContexts.length > 10) {
        toolStats.commonContexts = toolStats.commonContexts.slice(-10);
      }
    }
  }

  // 전역 통계 업데이트
  stats.globalStats = stats.globalStats || {};
  stats.globalStats.totalToolCalls = (stats.globalStats.totalToolCalls || 0) + 1;
  stats.lastUpdated = new Date().toISOString();

  safeWriteJSON(USAGE_STATS_FILE, stats);
}

/**
 * 체이닝 패턴 감지
 */
function detectChainingPattern() {
  const sequence = currentSession.chainingSequence;

  if (sequence.length < 2) {
    return;
  }

  // 마지막 2개 도구로 체이닝 패턴 기록
  const prevTool = sequence[sequence.length - 2];
  const currTool = sequence[sequence.length - 1];

  if (prevTool === currTool) {
    return; // 같은 도구 연속 호출은 무시
  }

  const stats = safeReadJSON(USAGE_STATS_FILE);

  // 이전 도구의 chainedWith 업데이트
  if (stats.tools && stats.tools[prevTool]) {
    if (!stats.tools[prevTool].chainedWith) {
      stats.tools[prevTool].chainedWith = [];
    }

    // 체이닝 카운트
    const existingChain = stats.tools[prevTool].chainedWith.find(c => c.tool === currTool);
    if (existingChain) {
      existingChain.count++;
    } else {
      stats.tools[prevTool].chainedWith.push({ tool: currTool, count: 1 });
    }

    // 상위 5개만 유지 (빈도순)
    stats.tools[prevTool].chainedWith.sort((a, b) => b.count - a.count);
    stats.tools[prevTool].chainedWith = stats.tools[prevTool].chainedWith.slice(0, 5);
  }

  // 체이닝 패턴 기록
  if (!stats.chainingPatterns) {
    stats.chainingPatterns = { patterns: [] };
  }

  const patternKey = `${prevTool} -> ${currTool}`;
  const existingPattern = stats.chainingPatterns.patterns.find(p => p.pattern === patternKey);

  if (existingPattern) {
    existingPattern.count++;
    existingPattern.lastOccurrence = new Date().toISOString();
  } else {
    stats.chainingPatterns.patterns.push({
      pattern: patternKey,
      from: prevTool,
      to: currTool,
      count: 1,
      firstOccurrence: new Date().toISOString(),
      lastOccurrence: new Date().toISOString()
    });
  }

  // 상위 20개 패턴만 유지
  stats.chainingPatterns.patterns.sort((a, b) => b.count - a.count);
  stats.chainingPatterns.patterns = stats.chainingPatterns.patterns.slice(0, 20);

  safeWriteJSON(USAGE_STATS_FILE, stats);
}

// ============================================
// 피드백 기록
// ============================================

/**
 * 추천 수락 기록
 */
function recordRecommendationAccepted(toolName) {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  if (stats.tools && stats.tools[toolName]) {
    stats.tools[toolName].recommendedAcceptedCount =
      (stats.tools[toolName].recommendedAcceptedCount || 0) + 1;
  }

  stats.globalStats = stats.globalStats || {};
  const totalRec = stats.globalStats.totalRecommendations || 1;
  const accepted = (stats.globalStats.recommendationAcceptRate || 0) * totalRec + 1;
  stats.globalStats.recommendationAcceptRate = Math.round((accepted / totalRec) * 100) / 100;

  stats.lastUpdated = new Date().toISOString();
  safeWriteJSON(USAGE_STATS_FILE, stats);
}

/**
 * 워크플로우 실행 기록
 */
function recordWorkflowTrigger(workflowName, completed = false) {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  if (!stats.workflows) {
    stats.workflows = {};
  }

  if (!stats.workflows[workflowName]) {
    stats.workflows[workflowName] = {
      triggerCount: 0,
      completionRate: 0,
      averageSteps: 0,
      lastTriggered: null
    };
  }

  const workflow = stats.workflows[workflowName];
  workflow.triggerCount++;
  workflow.lastTriggered = new Date().toISOString();

  if (completed) {
    const completedCount = Math.round(workflow.completionRate * (workflow.triggerCount - 1) / 100) + 1;
    workflow.completionRate = Math.round((completedCount / workflow.triggerCount) * 100);
  }

  stats.lastUpdated = new Date().toISOString();
  safeWriteJSON(USAGE_STATS_FILE, stats);
}

/**
 * 스킬 활성화 기록
 */
function recordSkillActivation(skillName, success = true) {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  if (!stats.skills) {
    stats.skills = {};
  }

  if (!stats.skills[skillName]) {
    stats.skills[skillName] = {
      activationCount: 0,
      successRate: 0,
      lastActivated: null
    };
  }

  const skill = stats.skills[skillName];
  skill.activationCount++;
  skill.lastActivated = new Date().toISOString();

  if (success) {
    const successCount = Math.round(skill.successRate * (skill.activationCount - 1) / 100) + 1;
    skill.successRate = Math.round((successCount / skill.activationCount) * 100);
  }

  stats.lastUpdated = new Date().toISOString();
  safeWriteJSON(USAGE_STATS_FILE, stats);
}

// ============================================
// 통계 조회
// ============================================

/**
 * 현재 세션 정보 조회
 */
function getCurrentSession() {
  return { ...currentSession };
}

/**
 * 전체 통계 요약
 */
function getStatsSummary() {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  return {
    global: stats.globalStats || {},
    topTools: getTopTools(5),
    topChains: getTopChains(5),
    recentSessions: (stats.sessions?.history || []).slice(0, 5)
  };
}

/**
 * 상위 N개 도구 조회
 */
function getTopTools(n = 10) {
  const stats = safeReadJSON(USAGE_STATS_FILE);
  const tools = stats.tools || {};

  return Object.entries(tools)
    .filter(([name]) => name !== '_template')
    .map(([name, data]) => ({
      name,
      calls: data.totalCalls || 0,
      successRate: data.successRate || 0,
      avgResponseTime: data.averageResponseTime || 0
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, n);
}

/**
 * 상위 N개 체이닝 패턴 조회
 */
function getTopChains(n = 10) {
  const stats = safeReadJSON(USAGE_STATS_FILE);
  const patterns = stats.chainingPatterns?.patterns || [];

  return patterns.slice(0, n);
}

// ============================================
// CLI 처리
// ============================================

function printHelp() {
  console.log(`
ATOS Execution Monitor - 도구 실행 추적

사용법:
  node execution-monitor.js [command] [args]

Commands:
  start                 새 세션 시작
  end                   현재 세션 종료
  status                현재 세션 상태
  stats                 전체 통계 요약
  top [n]               상위 N개 도구 (기본: 10)
  chains [n]            상위 N개 체이닝 패턴 (기본: 10)

Examples:
  node execution-monitor.js start
  node execution-monitor.js stats
  node execution-monitor.js top 5
`);
}

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      startSession();
      break;

    case 'end':
      const session = endSession();
      if (session) {
        console.log('\n--- 세션 요약 ---');
        console.log(`도구 호출: ${session.toolCalls.length}개`);
        console.log(`체이닝: ${session.chainingSequence.join(' -> ')}`);
      }
      break;

    case 'status':
      const current = getCurrentSession();
      console.log('\n--- 현재 세션 ---');
      if (current.id) {
        console.log(`ID: ${current.id}`);
        console.log(`시작: ${current.startTime}`);
        console.log(`도구 호출: ${current.toolCalls.length}개`);
      } else {
        console.log('활성 세션 없음');
      }
      break;

    case 'stats':
      const summary = getStatsSummary();
      console.log('\n--- ATOS 통계 요약 ---');
      console.log(`총 세션: ${summary.global.totalSessions || 0}`);
      console.log(`총 도구 호출: ${summary.global.totalToolCalls || 0}`);
      console.log(`평균 도구/세션: ${summary.global.averageToolsPerSession || 0}`);
      console.log(`추천 수락률: ${summary.global.recommendationAcceptRate || 0}%`);
      break;

    case 'top':
      const topN = parseInt(args[1]) || 10;
      const topTools = getTopTools(topN);
      console.log(`\n--- 상위 ${topN}개 도구 ---`);
      topTools.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name}: ${t.calls}회 (성공률: ${t.successRate}%)`);
      });
      break;

    case 'chains':
      const chainN = parseInt(args[1]) || 10;
      const chains = getTopChains(chainN);
      console.log(`\n--- 상위 ${chainN}개 체이닝 패턴 ---`);
      chains.forEach((c, i) => {
        console.log(`${i + 1}. ${c.pattern}: ${c.count}회`);
      });
      break;

    case 'help':
    default:
      printHelp();
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 세션 관리
  startSession,
  endSession,
  getCurrentSession,

  // 도구 추적
  beforeCall,
  afterCall,
  normalizeToolName,

  // 피드백 기록
  recordRecommendationAccepted,
  recordWorkflowTrigger,
  recordSkillActivation,

  // 통계 조회
  getStatsSummary,
  getTopTools,
  getTopChains
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
