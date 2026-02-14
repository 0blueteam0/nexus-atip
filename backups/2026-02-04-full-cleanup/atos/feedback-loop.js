/**
 * ATOS Feedback Loop
 * 세션 패턴 학습 + 사용 통계 영구 저장 + 지침 진화 트리거
 *
 * 위치: K:/PortableApps/genai/atos/feedback-loop.js
 *
 * 기능:
 * - 세션 종료 시 사용 패턴 분석
 * - 성공 패턴 추출 및 저장
 * - instruction-evolution.js 연동
 * - kiro-memory 영구 저장
 * - 학습 대기열 처리
 *
 * 사용법:
 *   const feedbackLoop = require('./feedback-loop.js');
 *   feedbackLoop.processSession(sessionData);
 *   feedbackLoop.learnFromSuccess(toolId, context, result);
 *
 * CLI:
 *   node feedback-loop.js process    # 세션 학습 처리
 *   node feedback-loop.js evolve     # 지침 진화 트리거
 *   node feedback-loop.js status     # 학습 상태 확인
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 경로 설정
// ============================================

const BASE_PATH = path.resolve(__dirname);
const USAGE_STATS_FILE = path.join(BASE_PATH, 'usage-stats.json');
const TOOL_REGISTRY_FILE = path.join(BASE_PATH, 'tool-registry.json');
const LEARNING_LOG_FILE = path.join(BASE_PATH, 'learning-log.json');

// 외부 시스템 경로
const EVOLUTION_SYSTEM = path.join(BASE_PATH, '..', 'systems', 'instruction-evolution.js');
const KIRO_ADAPTER = path.join(BASE_PATH, '..', 'unified-task-system', 'kiro-adapter.js');

// ============================================
// 유틸리티 함수
// ============================================

function safeReadJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`[!] 파일 읽기 실패 (${path.basename(filePath)}):`, error.message);
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
    console.error(`[!] 파일 쓰기 실패:`, error.message);
    return false;
  }
}

// ============================================
// 학습 로그 관리
// ============================================

function getLearningLog() {
  return safeReadJSON(LEARNING_LOG_FILE, {
    version: '1.0.0',
    initialized: new Date().toISOString(),
    lastLearning: null,
    totalSessions: 0,
    totalPatterns: 0,
    evolutionTriggers: 0,
    sessions: [],
    learnedPatterns: [],
    pendingEvolutions: []
  });
}

function saveLearningLog(log) {
  log.lastUpdated = new Date().toISOString();
  return safeWriteJSON(LEARNING_LOG_FILE, log);
}

// ============================================
// 세션 패턴 분석
// ============================================

/**
 * 세션 데이터에서 사용 패턴 추출
 */
function extractSessionPatterns(sessionData) {
  const patterns = {
    toolUsage: {},
    toolChains: [],
    successfulContexts: [],
    failureContexts: [],
    intentToolMapping: {}
  };

  if (!sessionData || !sessionData.toolCalls) {
    return patterns;
  }

  const toolCalls = sessionData.toolCalls;
  let previousTool = null;

  for (const call of toolCalls) {
    // 도구 사용 빈도
    if (!patterns.toolUsage[call.toolId]) {
      patterns.toolUsage[call.toolId] = { count: 0, success: 0, failure: 0 };
    }
    patterns.toolUsage[call.toolId].count++;

    if (call.success) {
      patterns.toolUsage[call.toolId].success++;
      if (call.context) {
        patterns.successfulContexts.push({
          toolId: call.toolId,
          context: call.context,
          intent: call.intent
        });
      }
    } else {
      patterns.toolUsage[call.toolId].failure++;
      if (call.context) {
        patterns.failureContexts.push({
          toolId: call.toolId,
          context: call.context,
          error: call.error
        });
      }
    }

    // 도구 체이닝 패턴
    if (previousTool && call.success) {
      patterns.toolChains.push({
        from: previousTool,
        to: call.toolId,
        context: call.context
      });
    }
    previousTool = call.toolId;

    // Intent -> Tool 매핑
    if (call.intent) {
      if (!patterns.intentToolMapping[call.intent]) {
        patterns.intentToolMapping[call.intent] = {};
      }
      if (!patterns.intentToolMapping[call.intent][call.toolId]) {
        patterns.intentToolMapping[call.intent][call.toolId] = { count: 0, success: 0 };
      }
      patterns.intentToolMapping[call.intent][call.toolId].count++;
      if (call.success) {
        patterns.intentToolMapping[call.intent][call.toolId].success++;
      }
    }
  }

  return patterns;
}

/**
 * 패턴 품질 점수 계산
 */
function calculatePatternScore(pattern) {
  let score = 0;

  // 성공률 기반 점수
  if (pattern.successRate) {
    score += pattern.successRate * 50;
  }

  // 반복 횟수 기반 점수
  if (pattern.occurrences) {
    score += Math.min(pattern.occurrences * 5, 30);
  }

  // 최근성 점수
  if (pattern.lastUsed) {
    const daysSince = (Date.now() - new Date(pattern.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(20 - daysSince, 0);
  }

  return Math.min(score, 100);
}

// ============================================
// 사용 통계 업데이트
// ============================================

/**
 * 세션 패턴을 사용 통계에 반영
 */
function updateUsageStats(patterns) {
  const stats = safeReadJSON(USAGE_STATS_FILE, {
    version: '1.0.0',
    tools: {},
    patterns: {},
    chainingPatterns: { patterns: [] }
  });

  // 도구별 통계 업데이트
  for (const [toolId, usage] of Object.entries(patterns.toolUsage)) {
    if (!stats.tools[toolId]) {
      stats.tools[toolId] = {
        totalCalls: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        lastUsed: null,
        commonContexts: [],
        chainedWith: []
      };
    }

    stats.tools[toolId].totalCalls += usage.count;
    stats.tools[toolId].successCount += usage.success;
    stats.tools[toolId].failureCount += usage.failure;
    stats.tools[toolId].successRate = stats.tools[toolId].totalCalls > 0
      ? (stats.tools[toolId].successCount / stats.tools[toolId].totalCalls) * 100
      : 0;
    stats.tools[toolId].lastUsed = new Date().toISOString();
  }

  // 체이닝 패턴 업데이트
  for (const chain of patterns.toolChains) {
    const existingPattern = stats.chainingPatterns.patterns.find(
      p => p.from === chain.from && p.to === chain.to
    );

    if (existingPattern) {
      existingPattern.count++;
      existingPattern.lastUsed = new Date().toISOString();
    } else {
      stats.chainingPatterns.patterns.push({
        from: chain.from,
        to: chain.to,
        count: 1,
        contexts: [chain.context],
        firstSeen: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
    }

    // 도구별 chainedWith 업데이트
    if (stats.tools[chain.from] && !stats.tools[chain.from].chainedWith.includes(chain.to)) {
      stats.tools[chain.from].chainedWith.push(chain.to);
    }
  }

  // Intent-Tool 패턴 업데이트
  for (const [intent, tools] of Object.entries(patterns.intentToolMapping)) {
    for (const [toolId, data] of Object.entries(tools)) {
      const patternKey = `intent:${intent}`;
      if (!stats.patterns[patternKey]) {
        stats.patterns[patternKey] = {
          recommendedTools: [],
          successRate: 0,
          totalOccurrences: 0,
          lastOccurrence: null
        };
      }

      stats.patterns[patternKey].totalOccurrences += data.count;
      stats.patterns[patternKey].lastOccurrence = new Date().toISOString();

      // 추천 도구 목록 업데이트
      if (!stats.patterns[patternKey].recommendedTools.includes(toolId)) {
        stats.patterns[patternKey].recommendedTools.push(toolId);
      }

      // 성공률 재계산
      const totalSuccess = Object.values(tools).reduce((sum, t) => sum + t.success, 0);
      const totalCount = Object.values(tools).reduce((sum, t) => sum + t.count, 0);
      stats.patterns[patternKey].successRate = totalCount > 0
        ? (totalSuccess / totalCount) * 100
        : 0;
    }
  }

  // 글로벌 통계 업데이트
  if (!stats.globalStats) {
    stats.globalStats = {
      totalToolCalls: 0,
      totalSessions: 0,
      totalRecommendations: 0,
      recommendationAcceptRate: 0,
      averageToolsPerSession: 0
    };
  }

  stats.globalStats.totalSessions++;
  const sessionToolCount = Object.values(patterns.toolUsage).reduce((sum, u) => sum + u.count, 0);
  stats.globalStats.totalToolCalls += sessionToolCount;
  stats.globalStats.averageToolsPerSession =
    stats.globalStats.totalToolCalls / stats.globalStats.totalSessions;

  stats.lastUpdated = new Date().toISOString();
  return safeWriteJSON(USAGE_STATS_FILE, stats);
}

// ============================================
// 학습된 패턴 저장
// ============================================

/**
 * 성공 패턴을 학습하여 저장
 */
function learnFromSuccess(toolId, context, result) {
  const log = getLearningLog();

  const pattern = {
    id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    toolId: toolId,
    context: context,
    result: result,
    learnedAt: new Date().toISOString(),
    score: 50, // 초기 점수
    reinforcements: 0
  };

  log.learnedPatterns.push(pattern);
  log.totalPatterns++;

  // 학습 대기열에 추가 (진화 시스템용)
  log.pendingEvolutions.push({
    type: 'success-pattern',
    patternId: pattern.id,
    addedAt: new Date().toISOString()
  });

  saveLearningLog(log);
  return pattern;
}

/**
 * 기존 패턴 강화 (반복 사용 시)
 */
function reinforcePattern(patternId) {
  const log = getLearningLog();

  const pattern = log.learnedPatterns.find(p => p.id === patternId);
  if (pattern) {
    pattern.reinforcements++;
    pattern.score = Math.min(pattern.score + 10, 100);
    pattern.lastReinforced = new Date().toISOString();
    saveLearningLog(log);
    return pattern;
  }

  return null;
}

// ============================================
// 세션 학습 처리
// ============================================

/**
 * 전체 세션 학습 처리
 */
function processSession(sessionData) {
  console.log('[*] 세션 학습 처리 시작...');

  const log = getLearningLog();

  // 1. 패턴 추출
  const patterns = extractSessionPatterns(sessionData);

  // 2. 사용 통계 업데이트
  const statsUpdated = updateUsageStats(patterns);

  // 3. 성공 패턴 학습
  let learnedCount = 0;
  for (const success of patterns.successfulContexts) {
    learnFromSuccess(success.toolId, success.context, { intent: success.intent });
    learnedCount++;
  }

  // 4. 세션 기록
  log.sessions.push({
    id: sessionData.sessionId || `session-${Date.now()}`,
    processedAt: new Date().toISOString(),
    toolCount: Object.keys(patterns.toolUsage).length,
    chainCount: patterns.toolChains.length,
    patternsLearned: learnedCount
  });

  // 최대 100개 세션만 유지
  if (log.sessions.length > 100) {
    log.sessions = log.sessions.slice(-100);
  }

  log.totalSessions++;
  log.lastLearning = new Date().toISOString();

  saveLearningLog(log);

  console.log(`[+] 세션 학습 완료:`);
  console.log(`    - 도구 ${Object.keys(patterns.toolUsage).length}개 사용`);
  console.log(`    - 체이닝 패턴 ${patterns.toolChains.length}개`);
  console.log(`    - 성공 패턴 ${learnedCount}개 학습`);

  // 5. 진화 조건 체크
  checkEvolutionConditions(log);

  return {
    success: true,
    patterns: patterns,
    learned: learnedCount
  };
}

// ============================================
// 지침 진화 시스템 연동
// ============================================

/**
 * 진화 조건 체크
 */
function checkEvolutionConditions(log) {
  const conditions = {
    minPatterns: 10,        // 최소 패턴 수
    minSessions: 5,         // 최소 세션 수
    minPendingItems: 5      // 최소 대기 항목 수
  };

  const shouldEvolve =
    log.totalPatterns >= conditions.minPatterns &&
    log.totalSessions >= conditions.minSessions &&
    log.pendingEvolutions.length >= conditions.minPendingItems;

  if (shouldEvolve) {
    console.log('[!] 진화 조건 충족 - 지침 진화 트리거 예정');
    triggerEvolution(log);
  }

  return shouldEvolve;
}

/**
 * 지침 진화 트리거
 */
function triggerEvolution(log) {
  console.log('[*] 지침 진화 시스템 트리거...');

  // 진화 대상 패턴 수집
  const evolutionData = {
    patterns: log.learnedPatterns.filter(p => p.score >= 70), // 고점수 패턴만
    pendingItems: log.pendingEvolutions,
    timestamp: new Date().toISOString()
  };

  // instruction-evolution.js 호출 시도
  try {
    if (fs.existsSync(EVOLUTION_SYSTEM)) {
      const evolution = require(EVOLUTION_SYSTEM);
      if (typeof evolution.triggerEvolution === 'function') {
        evolution.triggerEvolution(evolutionData);
        console.log('[+] 지침 진화 시스템 호출 완료');
      }
    }
  } catch (error) {
    console.log(`[!] 진화 시스템 호출 실패: ${error.message}`);
    // 실패해도 계속 진행
  }

  // 대기열 정리
  log.pendingEvolutions = [];
  log.evolutionTriggers++;
  saveLearningLog(log);

  return evolutionData;
}

/**
 * 수동 진화 트리거
 */
function forceEvolution() {
  const log = getLearningLog();
  return triggerEvolution(log);
}

// ============================================
// kiro-memory 연동
// ============================================

/**
 * 학습된 패턴을 kiro-memory에 영구 저장
 */
async function persistToKiroMemory() {
  console.log('[*] kiro-memory 영구 저장 시도...');

  const log = getLearningLog();
  const stats = safeReadJSON(USAGE_STATS_FILE);

  // 저장할 데이터 구성
  const memoryData = {
    type: 'atos-learning',
    timestamp: new Date().toISOString(),
    summary: {
      totalSessions: log.totalSessions,
      totalPatterns: log.totalPatterns,
      evolutionTriggers: log.evolutionTriggers
    },
    topPatterns: log.learnedPatterns
      .sort((a, b) => b.score - a.score)
      .slice(0, 20),
    topTools: Object.entries(stats.tools || {})
      .sort((a, b) => b[1].successRate - a[1].successRate)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data })),
    chainingPatterns: (stats.chainingPatterns?.patterns || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };

  // kiro-adapter 호출 시도
  try {
    if (fs.existsSync(KIRO_ADAPTER)) {
      const kiro = require(KIRO_ADAPTER);
      if (typeof kiro.saveToMemory === 'function') {
        await kiro.saveToMemory('atos-learning-data', memoryData);
        console.log('[+] kiro-memory 저장 완료');
        return true;
      }
    }
  } catch (error) {
    console.log(`[!] kiro-memory 저장 실패: ${error.message}`);
  }

  // 실패 시 로컬에 백업
  const backupPath = path.join(BASE_PATH, 'memory-backup.json');
  safeWriteJSON(backupPath, {
    ...memoryData,
    backupReason: 'kiro-memory-unavailable'
  });
  console.log(`[*] 로컬 백업 저장: ${backupPath}`);

  return false;
}

// ============================================
// 학습 대기열 처리
// ============================================

/**
 * 학습 대기열 처리
 */
function processLearningQueue() {
  const stats = safeReadJSON(USAGE_STATS_FILE);

  if (!stats.learningQueue || !stats.learningQueue.pending) {
    console.log('[*] 학습 대기열이 비어있습니다.');
    return { processed: 0 };
  }

  const pending = stats.learningQueue.pending;
  let processed = 0;

  for (const item of pending) {
    if (item.type === 'tool-feedback') {
      // 도구 피드백 처리
      if (item.positive) {
        learnFromSuccess(item.toolId, item.context, item.result);
      }
      processed++;
    } else if (item.type === 'pattern-reinforcement') {
      // 패턴 강화
      reinforcePattern(item.patternId);
      processed++;
    }
  }

  // 처리된 항목 제거
  stats.learningQueue.pending = [];
  safeWriteJSON(USAGE_STATS_FILE, stats);

  console.log(`[+] 학습 대기열 ${processed}개 항목 처리 완료`);
  return { processed };
}

// ============================================
// 상태 조회
// ============================================

/**
 * 학습 상태 조회
 */
function getStatus() {
  const log = getLearningLog();
  const stats = safeReadJSON(USAGE_STATS_FILE);

  return {
    learning: {
      totalSessions: log.totalSessions,
      totalPatterns: log.totalPatterns,
      evolutionTriggers: log.evolutionTriggers,
      lastLearning: log.lastLearning,
      pendingEvolutions: log.pendingEvolutions.length,
      highScorePatterns: log.learnedPatterns.filter(p => p.score >= 70).length
    },
    stats: {
      totalToolCalls: stats.globalStats?.totalToolCalls || 0,
      averageToolsPerSession: stats.globalStats?.averageToolsPerSession || 0,
      chainingPatterns: stats.chainingPatterns?.patterns?.length || 0,
      intentPatterns: Object.keys(stats.patterns || {}).length
    },
    queue: {
      pending: stats.learningQueue?.pending?.length || 0
    }
  };
}

/**
 * 상태 출력
 */
function printStatus() {
  const status = getStatus();

  console.log('\n========================================');
  console.log('  ATOS Feedback Loop - Status');
  console.log('========================================\n');

  console.log('--- 학습 현황 ---');
  console.log(`총 세션: ${status.learning.totalSessions}`);
  console.log(`총 패턴: ${status.learning.totalPatterns}`);
  console.log(`고점수 패턴: ${status.learning.highScorePatterns}`);
  console.log(`진화 트리거: ${status.learning.evolutionTriggers}회`);
  console.log(`대기 중 진화: ${status.learning.pendingEvolutions}개`);
  console.log(`마지막 학습: ${status.learning.lastLearning || 'N/A'}`);

  console.log('\n--- 통계 현황 ---');
  console.log(`총 도구 호출: ${status.stats.totalToolCalls}`);
  console.log(`평균 도구/세션: ${status.stats.averageToolsPerSession.toFixed(1)}`);
  console.log(`체이닝 패턴: ${status.stats.chainingPatterns}개`);
  console.log(`Intent 패턴: ${status.stats.intentPatterns}개`);

  console.log('\n--- 대기열 ---');
  console.log(`처리 대기: ${status.queue.pending}개`);

  console.log('\n========================================\n');
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'process':
      // 테스트용 세션 데이터로 처리
      const testSession = {
        sessionId: `cli-test-${Date.now()}`,
        toolCalls: []
      };
      processSession(testSession);
      break;

    case 'evolve':
    case 'trigger':
      forceEvolution();
      break;

    case 'persist':
    case 'save':
      persistToKiroMemory();
      break;

    case 'queue':
      processLearningQueue();
      break;

    case 'status':
    default:
      printStatus();
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 세션 처리
  processSession,
  extractSessionPatterns,
  updateUsageStats,

  // 학습
  learnFromSuccess,
  reinforcePattern,
  processLearningQueue,

  // 진화
  checkEvolutionConditions,
  triggerEvolution,
  forceEvolution,

  // 영구 저장
  persistToKiroMemory,

  // 상태
  getStatus,
  printStatus,
  getLearningLog
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
