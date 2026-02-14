/**
 * Insight Engine
 *
 * 위치: K:/PortableApps/genai/dashboard/plan-ecosystem/collectors/insight-engine.js
 *
 * 목적:
 * - 작업 패턴 분석 및 예측 인사이트 생성
 * - 스마트 제안 시스템
 * - 리스크 감지 및 경고
 *
 * @module collectors/insight-engine
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const INSIGHT_DATA_PATH = path.join(BASE_PATH, 'data', 'insights.json');

// 인사이트 유형
const INSIGHT_TYPES = {
  SUGGESTION: 'suggestion',
  WARNING: 'warning',
  OPTIMIZATION: 'optimization',
  MILESTONE: 'milestone',
  PREDICTION: 'prediction'
};

// 인사이트 저장소
let insights = [];
let patterns = {};

/**
 * 데이터 로드
 */
function loadInsightData() {
  try {
    if (fs.existsSync(INSIGHT_DATA_PATH)) {
      const raw = fs.readFileSync(INSIGHT_DATA_PATH, 'utf8');
      const data = JSON.parse(raw);
      insights = data.insights || [];
      patterns = data.patterns || {};
      return data;
    }
  } catch (error) {
    console.error('[!] Insight data load error:', error.message);
  }
  return { insights: [], patterns: {} };
}

/**
 * 데이터 저장
 */
function saveInsightData() {
  try {
    const dir = path.dirname(INSIGHT_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      lastUpdated: new Date().toISOString(),
      insights: insights.slice(-200), // 최근 200개만 유지
      patterns
    };

    fs.writeFileSync(INSIGHT_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[!] Insight data save error:', error.message);
  }
}

// 초기 로드
loadInsightData();


/**
 * 인사이트 생성
 */
function createInsight(type, title, description, data = {}) {
  const insight = {
    id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type,
    title,
    description,
    data,
    createdAt: new Date().toISOString(),
    acknowledged: false
  };

  insights.push(insight);
  saveInsightData();

  return insight;
}

/**
 * 워크플로우 패턴 분석
 */
function analyzeWorkflowPatterns(workflowHistory) {
  const phaseTransitions = {};
  const phaseDurations = {};
  const bottlenecks = [];

  for (const event of workflowHistory) {
    if (event.type === 'phase_changed') {
      // 전환 패턴 기록
      const key = `${event.fromPhase}->${event.toPhase}`;
      phaseTransitions[key] = (phaseTransitions[key] || 0) + 1;
    }
  }

  // 병목 감지 (같은 phase로 3번 이상 회귀)
  for (const [transition, count] of Object.entries(phaseTransitions)) {
    const [from, to] = transition.split('->');
    if (from === to || (from && to && count >= 3)) {
      bottlenecks.push({ transition, count });
    }
  }

  patterns.phaseTransitions = phaseTransitions;
  patterns.bottlenecks = bottlenecks;
  patterns.lastAnalyzed = new Date().toISOString();

  saveInsightData();

  // 병목 인사이트 생성
  for (const bn of bottlenecks) {
    createInsight(
      INSIGHT_TYPES.WARNING,
      'Workflow Bottleneck Detected',
      `Phase transition "${bn.transition}" occurred ${bn.count} times. Consider reviewing the process.`,
      { bottleneck: bn }
    );
  }

  return { phaseTransitions, bottlenecks };
}

/**
 * 태스크 진행률 기반 예측
 */
function predictCompletion(tasks) {
  if (!tasks || tasks.length === 0) return null;

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const progress = (completed / total) * 100;

  // 완료된 태스크의 평균 소요 시간 계산
  const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);
  let avgDuration = 0;

  if (completedTasks.length > 0) {
    const totalDuration = completedTasks.reduce((sum, t) => {
      return sum + (new Date(t.completedAt) - new Date(t.createdAt));
    }, 0);
    avgDuration = totalDuration / completedTasks.length;
  }

  // 남은 태스크 완료 예측
  const remaining = total - completed;
  const estimatedTimeRemaining = remaining * avgDuration;
  const estimatedCompletion = new Date(Date.now() + estimatedTimeRemaining);

  const prediction = {
    total,
    completed,
    remaining,
    progress: Math.round(progress),
    avgDurationMs: Math.round(avgDuration),
    estimatedCompletion: estimatedCompletion.toISOString(),
    confidence: completedTasks.length >= 3 ? 'high' : 'low'
  };

  // 마일스톤 인사이트
  if (progress >= 25 && progress < 26) {
    createInsight(INSIGHT_TYPES.MILESTONE, '25% Complete', `Reached 25% completion milestone with ${completed} tasks done.`);
  } else if (progress >= 50 && progress < 51) {
    createInsight(INSIGHT_TYPES.MILESTONE, '50% Complete', `Halfway there! ${completed} of ${total} tasks completed.`);
  } else if (progress >= 75 && progress < 76) {
    createInsight(INSIGHT_TYPES.MILESTONE, '75% Complete', `Almost there! ${remaining} tasks remaining.`);
  }

  return prediction;
}

/**
 * Goal 달성률 분석
 */
function analyzeGoalProgress(goals) {
  if (!goals || goals.length === 0) return null;

  const analysis = {
    total: goals.length,
    completed: 0,
    inProgress: 0,
    atRisk: 0,
    avgProgress: 0,
    recommendations: []
  };

  let totalProgress = 0;

  for (const goal of goals) {
    totalProgress += goal.progress || 0;

    if (goal.status === 'completed' || goal.progress >= 100) {
      analysis.completed++;
    } else if (goal.progress >= 50) {
      analysis.inProgress++;
    } else if (goal.progress < 30 && goal.createdAt) {
      // 오래된 목표 + 낮은 진행률 = 위험
      const age = Date.now() - new Date(goal.createdAt).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      if (daysOld > 7) {
        analysis.atRisk++;
        analysis.recommendations.push({
          goalId: goal.id,
          title: goal.title,
          issue: 'Low progress on old goal',
          suggestion: 'Consider breaking down into smaller tasks or re-evaluating scope'
        });
      }
    }
  }

  analysis.avgProgress = Math.round(totalProgress / goals.length);

  // 리스크 인사이트
  if (analysis.atRisk > 0) {
    createInsight(
      INSIGHT_TYPES.WARNING,
      `${analysis.atRisk} Goals at Risk`,
      `Some goals have low progress and may need attention.`,
      { atRiskGoals: analysis.recommendations }
    );
  }

  return analysis;
}

/**
 * 도구 사용 패턴 분석
 */
function analyzeToolUsage(toolHistory) {
  const usage = {};
  const sequences = [];

  for (let i = 0; i < toolHistory.length; i++) {
    const tool = toolHistory[i].tool;
    usage[tool] = (usage[tool] || 0) + 1;

    // 연속 사용 패턴
    if (i > 0) {
      const prevTool = toolHistory[i - 1].tool;
      sequences.push(`${prevTool}->${tool}`);
    }
  }

  // 빈번한 시퀀스 찾기
  const sequenceCounts = {};
  for (const seq of sequences) {
    sequenceCounts[seq] = (sequenceCounts[seq] || 0) + 1;
  }

  // 자동화 제안
  const frequentSequences = Object.entries(sequenceCounts)
    .filter(([_, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1]);

  if (frequentSequences.length > 0) {
    createInsight(
      INSIGHT_TYPES.OPTIMIZATION,
      'Automation Opportunity',
      `Frequent tool sequences detected. Consider automating these patterns.`,
      { sequences: frequentSequences.slice(0, 5) }
    );
  }

  return { usage, frequentSequences };
}

/**
 * 스마트 제안 생성
 */
function generateSuggestions(context = {}) {
  const suggestions = [];
  const { currentPhase, tasks, goals, recentActivity } = context;

  // Phase 기반 제안
  if (currentPhase) {
    const phaseSuggestions = {
      specify: 'Consider documenting acceptance criteria for each goal.',
      explore: 'Use the Explore agent to map code dependencies.',
      plan: 'Break down tasks into smaller, testable units.',
      implement: 'Write tests before implementation (TDD).',
      verify: 'Run security scans before finalizing.',
      release: 'Update CHANGELOG and create a backup point.'
    };

    if (phaseSuggestions[currentPhase]) {
      suggestions.push({
        type: 'phase-tip',
        message: phaseSuggestions[currentPhase],
        phase: currentPhase
      });
    }
  }

  // 태스크 기반 제안
  if (tasks) {
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    if (blockedTasks.length > 0) {
      suggestions.push({
        type: 'blocked-tasks',
        message: `${blockedTasks.length} tasks are blocked. Review dependencies.`,
        tasks: blockedTasks.map(t => t.id)
      });
    }
  }

  // 목표 기반 제안
  if (goals) {
    const analysis = analyzeGoalProgress(goals);
    if (analysis && analysis.recommendations.length > 0) {
      suggestions.push({
        type: 'goal-risk',
        message: 'Some goals need attention.',
        recommendations: analysis.recommendations
      });
    }
  }

  return suggestions;
}

/**
 * 인사이트 조회
 */
function getInsights(options = {}) {
  const { limit = 20, type = null, acknowledged = null } = options;

  let result = [...insights];

  if (type) {
    result = result.filter(i => i.type === type);
  }
  if (acknowledged !== null) {
    result = result.filter(i => i.acknowledged === acknowledged);
  }

  return result.slice(-limit).reverse();
}

/**
 * 인사이트 확인 처리
 */
function acknowledgeInsight(insightId) {
  const insight = insights.find(i => i.id === insightId);
  if (insight) {
    insight.acknowledged = true;
    insight.acknowledgedAt = new Date().toISOString();
    saveInsightData();
  }
  return insight;
}

/**
 * 통계 조회
 */
function getInsightStats() {
  const byType = {};
  for (const type of Object.values(INSIGHT_TYPES)) {
    byType[type] = insights.filter(i => i.type === type).length;
  }

  return {
    total: insights.length,
    unacknowledged: insights.filter(i => !i.acknowledged).length,
    byType,
    patterns: {
      bottlenecks: patterns.bottlenecks?.length || 0,
      lastAnalyzed: patterns.lastAnalyzed
    }
  };
}

/**
 * 전체 인사이트 데이터 수집
 */
function collectInsightData() {
  return {
    insights: getInsights({ limit: 10 }),
    stats: getInsightStats(),
    patterns
  };
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  INSIGHT_TYPES,
  createInsight,
  analyzeWorkflowPatterns,
  predictCompletion,
  analyzeGoalProgress,
  analyzeToolUsage,
  generateSuggestions,
  getInsights,
  acknowledgeInsight,
  getInsightStats,
  collectInsightData
};
