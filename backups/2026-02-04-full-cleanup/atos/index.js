/**
 * ATOS - Active Tool Orchestration System
 * 메인 통합 엔진
 *
 * 위치: K:/PortableApps/genai/atos/index.js
 *
 * 핵심 기능:
 * - 모든 ATOS 모듈 통합 및 오케스트레이션
 * - 세션 라이프사이클 관리 (init, track, learn)
 * - 맥락 분석 → 추천 → 실행 추적 → 학습 파이프라인
 * - Auto-Discovery 시스템 연동
 * - CLI 인터페이스 제공
 *
 * Hook 연동:
 * - session-start → init
 * - before-response → recommend
 * - after-tool-call → track
 * - session-end → learn
 *
 * 사용법:
 *   node atos/index.js init       # 세션 초기화
 *   node atos/index.js recommend  # 도구 추천
 *   node atos/index.js track      # 도구 호출 추적
 *   node atos/index.js learn      # 세션 학습
 *   node atos/index.js status     # 시스템 상태
 *   node atos/index.js discover   # Auto-Discovery 실행
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Bootstrap Loader 통합 (Phase 3 - Context Optimization)
// ============================================
const { bootstrapLoader, bootstrap, loadModule, loadCategory, findByKeyword, getStats } = require('./bootstrap-loader');

// ============================================
// 경로 설정
// ============================================

const ATOS_DIR = path.resolve(__dirname);
const BASE_DIR = path.resolve(__dirname, '..');

const PATHS = {
  toolRegistry: path.join(ATOS_DIR, 'tool-registry.json'),
  usageStats: path.join(ATOS_DIR, 'usage-stats.json'),
  watchers: path.join(ATOS_DIR, 'watchers.json'),
  discoveryLog: path.join(ATOS_DIR, 'discovery-log.json'),
  contextAnalyzer: path.join(ATOS_DIR, 'context-analyzer.js'),
  recommendationEngine: path.join(ATOS_DIR, 'recommendation-engine.js'),
  executionMonitor: path.join(ATOS_DIR, 'execution-monitor.js'),
  feedbackLoop: path.join(ATOS_DIR, 'feedback-loop.js'),
  autoDiscovery: path.join(ATOS_DIR, 'auto-discovery.js'),
  claudeMd: path.join(BASE_DIR, 'CLAUDE.md'),
  sessionData: path.join(ATOS_DIR, 'current-session.json')
};

// ============================================
// 모듈 로딩 (안전하게)
// ============================================

let contextAnalyzer = null;
let recommendationEngine = null;
let executionMonitor = null;
let feedbackLoop = null;
let autoDiscovery = null;
let selfTrigger = null;

// Self-Trigger 파이프라인 로드
try {
  selfTrigger = require('./self-trigger');
} catch (e) {
  // Self-Trigger 모듈 선택적 로드
}

function loadModules() {
    // ============================================
    // Phase 3: Bootstrap-based Lazy Loading
    // 초기 로드 최소화 - 필요 시점에 모듈 로드
    // ============================================
    
    const loadedModules = [];
    const failedModules = [];
    
    // 부트스트랩 실행 (load-tracker만 즉시 로드)
    try {
      bootstrap();
      loadedModules.push('bootstrap-loader');
      loadedModules.push('load-tracker');
    } catch (e) {
      failedModules.push('bootstrap-loader');
    }
    
    return { loadedModules, failedModules };
  }
  
  // ============================================
  // 모듈 게터 (On-Demand Loading)
  // ============================================
  
  function getContextAnalyzer() {
    if (!contextAnalyzer) {
      try {
        const mod = loadModule('context-analyzer');
        if (mod) {
          const ContextAnalyzer = mod.ContextAnalyzer || mod;
          contextAnalyzer = new ContextAnalyzer();
        }
      } catch (e) {
        console.error('[!] context-analyzer 로드 실패:', e.message);
      }
    }
    return contextAnalyzer;
  }
  
  function getRecommendationEngine() {
    if (!recommendationEngine) {
      try {
        const RecommendationEngine = loadModule('recommendation-engine');
        if (RecommendationEngine) {
          recommendationEngine = new RecommendationEngine();
        }
      } catch (e) {
        console.error('[!] recommendation-engine 로드 실패:', e.message);
      }
    }
    return recommendationEngine;
  }
  
  function getExecutionMonitor() {
    if (!executionMonitor) {
      try {
        executionMonitor = loadModule('execution-monitor');
      } catch (e) {
        console.error('[!] execution-monitor 로드 실패:', e.message);
      }
    }
    return executionMonitor;
  }
  
  function getFeedbackLoop() {
    if (!feedbackLoop) {
      try {
        feedbackLoop = loadModule('feedback-loop');
      } catch (e) {
        console.error('[!] feedback-loop 로드 실패:', e.message);
      }
    }
    return feedbackLoop;
  }
  
  function getAutoDiscovery() {
    if (!autoDiscovery) {
      try {
        autoDiscovery = loadModule('auto-discovery');
      } catch (e) {
        console.error('[!] auto-discovery 로드 실패:', e.message);
      }
    }
    return autoDiscovery;
  }

// ============================================
// JSON 파일 유틸리티
// ============================================

function safeReadJSON(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`[!] JSON 읽기 실패 (${path.basename(filePath)}):`, error.message);
  }
  return defaultValue;
}

function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] JSON 쓰기 실패:`, error.message);
    return false;
  }
}

// ============================================
// 세션 관리
// ============================================

/**
 * 새 세션 초기화
 */
function initSession() {
  const sessionId = `session-${Date.now()}`;
  const sessionData = {
    id: sessionId,
    startTime: new Date().toISOString(),
    endTime: null,
    toolCalls: [],
    recommendations: [],
    patterns: [],
    metadata: {
      platform: process.platform,
      nodeVersion: process.version,
      atosVersion: '1.0.0'
    }
  };

  safeWriteJSON(PATHS.sessionData, sessionData);
  return sessionData;
}

/**
 * 현재 세션 가져오기
 */
function getCurrentSession() {
  return safeReadJSON(PATHS.sessionData, null);
}

/**
 * 세션 업데이트
 */
function updateSession(updates) {
  const session = getCurrentSession();
  if (session) {
    const updated = { ...session, ...updates };
    safeWriteJSON(PATHS.sessionData, updated);
    return updated;
  }
  return null;
}

/**
 * 세션 종료
 */
function endSession() {
  const session = getCurrentSession();
  if (session) {
    session.endTime = new Date().toISOString();
    safeWriteJSON(PATHS.sessionData, session);
    return session;
  }
  return null;
}

// ============================================
// 핵심 명령어
// ============================================

/**
 * init - 세션 시작 시 실행
 * Hook: session-start
 */
async function commandInit() {
  console.log('\n========================================');
  console.log('  ATOS - Active Tool Orchestration System');
  console.log('  세션 초기화');
  console.log('========================================\n');

  // 1. 모듈 로드
  const { loadedModules, failedModules } = loadModules();
  console.log(`[+] 모듈 로드: ${loadedModules.length}개 성공`);
  if (failedModules.length > 0) {
    console.log(`[!] 모듈 로드 실패: ${failedModules.join(', ')}`);
  }

  // 2. 세션 초기화
  const session = initSession();
  console.log(`[+] 세션 시작: ${session.id}`);

  // 3. Auto-Discovery 실행 (새 도구 감지)
  if (autoDiscovery && typeof autoDiscovery.runScan === 'function') {
    console.log('[*] Auto-Discovery 스캔 중...');
    try {
      const discovered = await autoDiscovery.runScan();
      if (discovered && discovered.newItems > 0) {
        console.log(`[+] 새로 발견: ${discovered.newItems}개`);
      } else {
        console.log('[=] 새로 발견된 도구 없음');
      }
    } catch (e) {
      console.log('[!] Auto-Discovery 실행 실패:', e.message);
    }
  }

  // 4. Tool Registry 로드
  const registry = safeReadJSON(PATHS.toolRegistry, { mcpServers: {} });
  const serverCount = Object.keys(registry.mcpServers || {}).length;
  console.log(`[+] Tool Registry: ${serverCount}개 MCP 서버`);

  // 5. Usage Stats 로드
  const stats = safeReadJSON(PATHS.usageStats, { globalStats: {} });
  console.log(`[+] 누적 통계: ${stats.globalStats?.totalToolCalls || 0}회 도구 호출`);

  // 6. 초기 추천 생성 (최근 사용 패턴 기반)
  console.log('\n--- 초기 추천 ---');
  if (recommendationEngine && typeof recommendationEngine.getTopRecommendations === 'function') {
    const recommendations = recommendationEngine.getTopRecommendations(5);
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.type}] ${rec.name} (점수: ${rec.score?.toFixed(2) || 'N/A'})`);
      });
    } else {
      console.log('  (사용 이력 없음 - 도구 사용 후 추천 생성됨)');
    }
  } else {
    console.log('  (추천 엔진 준비 중)');
  }

  console.log('\n[+] ATOS 초기화 완료\n');
  return { success: true, session, loadedModules };
}

/**
 * recommend - 맥락 기반 도구 추천
 * Hook: before-response, user-input
 */
async function commandRecommend(input) {
  // 원본 입력 문자열 보존 (recommend()가 자체 분석 수행)
  const userInput = input || '';

  // 맥락 분석 (세션 기록용으로만 사용)
  let context = null;
  if (contextAnalyzer && typeof contextAnalyzer.analyzeContext === 'function') {
    context = contextAnalyzer.analyzeContext(userInput);
  }

  // 추천 생성 - 원본 문자열 전달 (detectContext, detectImportantKeywords 활성화)
  if (recommendationEngine && typeof recommendationEngine.recommend === 'function') {
    const recommendations = recommendationEngine.recommend(userInput);

    // 세션에 추천 기록
    const session = getCurrentSession();
    if (session) {
      session.recommendations.push({
        timestamp: new Date().toISOString(),
        context,
        recommendations
      });
      safeWriteJSON(PATHS.sessionData, session);
    }

    return recommendations;
  }

  return [];
}

/**
 * track - 도구 호출 추적
 * Hook: after-tool-call
 */
async function commandTrack(toolData) {
  // 실행 모니터로 추적
  if (executionMonitor && typeof executionMonitor.trackToolCall === 'function') {
    executionMonitor.trackToolCall(toolData);
  }

  // 세션에 도구 호출 기록
  const session = getCurrentSession();
  if (session && toolData) {
    session.toolCalls.push({
      timestamp: new Date().toISOString(),
      ...toolData
    });
    safeWriteJSON(PATHS.sessionData, session);
  }

  return { tracked: true };
}

/**
 * learn - 세션 종료 시 학습
 * Hook: session-end
 */
async function commandLearn() {
  console.log('\n========================================');
  console.log('  ATOS - 세션 학습');
  console.log('========================================\n');

  // 세션 종료
  const session = endSession();
  if (!session) {
    console.log('[!] 활성 세션 없음');
    return { success: false };
  }

  console.log(`[*] 세션 분석 중: ${session.id}`);
  console.log(`    - 도구 호출: ${session.toolCalls?.length || 0}회`);
  console.log(`    - 추천 생성: ${session.recommendations?.length || 0}회`);

  // Feedback Loop로 학습
  if (feedbackLoop && typeof feedbackLoop.processSession === 'function') {
    const learnResult = feedbackLoop.processSession(session);
    console.log(`[+] 학습 완료: ${learnResult.patternsLearned || 0}개 패턴`);
  }

  // Usage Stats 업데이트
  const stats = safeReadJSON(PATHS.usageStats, { globalStats: { totalSessions: 0 } });
  stats.globalStats.totalSessions = (stats.globalStats.totalSessions || 0) + 1;
  stats.globalStats.lastSession = session.id;
  safeWriteJSON(PATHS.usageStats, stats);

  console.log('[+] 세션 학습 완료\n');
  return { success: true, session };
}

/**
 * discover - Auto-Discovery 수동 실행
 */
async function commandDiscover() {
  console.log('\n========================================');
  console.log('  ATOS - Auto-Discovery');
  console.log('========================================\n');

  if (!autoDiscovery) {
    console.log('[!] Auto-Discovery 모듈 로드 실패');
    return { success: false };
  }

  if (typeof autoDiscovery.runScan === 'function') {
    const result = await autoDiscovery.runScan();
    console.log(`[+] 스캔 완료`);
    return result;
  }

  if (typeof autoDiscovery.handleCLI === 'function') {
    autoDiscovery.handleCLI(['scan']);
    return { success: true };
  }

  console.log('[!] Auto-Discovery 실행 함수 없음');
  return { success: false };
}

/**
 * status - 시스템 상태 확인
 */
async function commandStatus() {
  console.log('\n========================================');
  console.log('  ATOS - 시스템 상태');
  console.log('========================================\n');

  // 모듈 상태
  const { loadedModules, failedModules } = loadModules();
  console.log('--- 모듈 상태 ---');
  console.log(`  로드됨: ${loadedModules.join(', ') || '없음'}`);
  console.log(`  실패: ${failedModules.join(', ') || '없음'}`);

  // Registry 상태
  const registry = safeReadJSON(PATHS.toolRegistry, { mcpServers: {} });
  console.log('\n--- Tool Registry ---');
  console.log(`  MCP 서버: ${Object.keys(registry.mcpServers || {}).length}개`);
  console.log(`  Skills: ${Object.keys(registry.skills || {}).length}개`);
  console.log(`  Workflows: ${Object.keys(registry.workflows || {}).length}개`);

  // Usage Stats
  const stats = safeReadJSON(PATHS.usageStats, { globalStats: {} });
  console.log('\n--- 사용 통계 ---');
  console.log(`  총 도구 호출: ${stats.globalStats?.totalToolCalls || 0}회`);
  console.log(`  총 세션: ${stats.globalStats?.totalSessions || 0}회`);
  console.log(`  추천 수락율: ${stats.globalStats?.recommendationAcceptRate || 0}%`);

  // 현재 세션
  const session = getCurrentSession();
  console.log('\n--- 현재 세션 ---');
  if (session) {
    console.log(`  ID: ${session.id}`);
    console.log(`  시작: ${session.startTime}`);
    console.log(`  도구 호출: ${session.toolCalls?.length || 0}회`);
  } else {
    console.log('  (활성 세션 없음)');
  }

  // Discovery 상태
  const discoveryLog = safeReadJSON(PATHS.discoveryLog, { discoveries: [] });
  console.log('\n--- Auto-Discovery ---');
  console.log(`  발견 기록: ${discoveryLog.discoveries?.length || 0}개`);

  console.log('\n');
  return {
    modules: { loaded: loadedModules, failed: failedModules },
    registry: {
      mcpServers: Object.keys(registry.mcpServers || {}).length,
      skills: Object.keys(registry.skills || {}).length
    },
    stats: stats.globalStats,
    session: session ? session.id : null
  };
}

// ============================================
// 통합 API
// ============================================

const ATOS = {
  // 초기화
  init: commandInit,

  // 추천
  recommend: commandRecommend,
  getRecommendations: (input) => commandRecommend(input),

  // 추적
  track: commandTrack,
  trackTool: (toolData) => commandTrack(toolData),

  // 학습
  learn: commandLearn,
  processSession: commandLearn,

  // 발견
  discover: commandDiscover,
  runDiscovery: commandDiscover,

  // 상태
  status: commandStatus,
  getStatus: commandStatus,

  // 세션 관리
  session: {
    init: initSession,
    get: getCurrentSession,
    update: updateSession,
    end: endSession
  },

  // 모듈 접근
  modules: {
    get contextAnalyzer() { return contextAnalyzer; },
    get recommendationEngine() { return recommendationEngine; },
    get executionMonitor() { return executionMonitor; },
    get feedbackLoop() { return feedbackLoop; },
    get autoDiscovery() { return autoDiscovery; }
  },

  // 유틸리티
  utils: {
    readJSON: safeReadJSON,
    writeJSON: safeWriteJSON,
    paths: PATHS
  },

  // 버전
  version: '1.0.0'
};

// ============================================
// CLI 처리
// ============================================

async function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const input = args.slice(1).join(' ');

  // 모든 CLI 명령어 실행 전 모듈 로딩 보장
  loadModules();

  switch (command) {
    case 'init':
      await commandInit();
      break;

    case 'recommend':
      const recs = await commandRecommend(input);
      console.log('\n--- 추천 결과 ---');
      if (recs && recs.success && recs.recommendations) {
        const { tools, skills, workflows } = recs.recommendations;

        // 도구 추천 출력
        if (tools && tools.length > 0) {
          console.log('[도구 추천]');
          tools.forEach((t, i) => {
            console.log(`  ${t.rank}. ${t.server} (점수: ${t.score.toFixed(2)}, 카테고리: ${t.category})`);
          });
        }

        // 스킬 추천 출력
        if (skills && skills.length > 0) {
          console.log('[스킬 추천]');
          skills.forEach((s, i) => {
            console.log(`  - ${s.skill} (신뢰도: ${(s.confidence * 100).toFixed(0)}%)`);
          });
        }

        // 컨텍스트 감지 정보 출력
        if (recs.contextDetection && recs.contextDetection.keywords.length > 0) {
          console.log(`[컨텍스트] 키워드: ${recs.contextDetection.keywords.join(', ')}`);
        }

        // 중요 키워드 감지 정보 출력
        if (recs.importantDetection) {
          console.log(`[중요 키워드] ${recs.importantDetection.keywords.join(', ')} - 자동 저장 트리거`);
        }

        if ((!tools || tools.length === 0) && (!skills || skills.length === 0)) {
          console.log('  (추천 없음)');
        }
      } else {
        console.log('  (추천 없음)');
      }
      console.log('');
      break;

    case 'track':
      // 테스트용 도구 추적
      if (input) {
        await commandTrack({ toolId: input, timestamp: new Date().toISOString() });
        console.log(`[+] 추적됨: ${input}`);
      } else {
        console.log('[!] 사용법: node index.js track <tool_id>');
      }
      break;

    case 'learn':
      await commandLearn();
      break;

    case 'discover':
      await commandDiscover();
      break;

    case 'self-trigger':
      if (selfTrigger && selfTrigger.getSelfTriggerOrchestrator) {
        const stOrch = selfTrigger.getSelfTriggerOrchestrator();
        if (input) {
          const phase = args[2] || null;
          const result = await stOrch.process(input, phase);
          console.log('[*] Self-Trigger 결과:');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('[*] Self-Trigger 상태:');
          console.log(JSON.stringify(stOrch.getStats(), null, 2));
        }
      } else {
        console.log('[!] Self-Trigger 모듈 로드 실패');
      }
      break;

    case 'status':
      await commandStatus();
      break;

    case 'help':
    default:
      console.log(`
ATOS - Active Tool Orchestration System v${ATOS.version}

사용법: node index.js <command> [options]

Commands:
  init      세션 초기화 (Hook: session-start)
  recommend 맥락 기반 도구 추천 (Hook: before-response)
  track     도구 호출 추적 (Hook: after-tool-call)
  learn     세션 학습 (Hook: session-end)
  discover  Auto-Discovery 수동 실행
  self-trigger  Self-Trigger 파이프라인 (Claude 출력 키워드 감지)
  status    시스템 상태 확인
  help      도움말 표시

Examples:
  node index.js init
  node index.js recommend "웹 검색해줘"
  node index.js track mcp__firecrawl__search
  node index.js learn
  node index.js status
`);
  }
}

// ============================================
// 모듈 내보내기
// ============================================
module.exports = {
  ...ATOS,
  selfTrigger
};


// CLI 실행
if (require.main === module) {
  handleCLI().catch(console.error);
}
