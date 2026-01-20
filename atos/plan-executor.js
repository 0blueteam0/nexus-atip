#!/usr/bin/env node
/**
 * Plan Executor - Planning System과 ATOS 연동 모듈
 * 
 * 위치: K:/PortableApps/Claude-Code/atos/plan-executor.js
 * 
 * 핵심 기능:
 * - 현재 활성 플랜의 Phase 정보 반환
 * - Phase별 도구 가중치 조정
 * - 다음 태스크 기반 도구 사전 추천
 * 
 * 사용법:
 *   const PlanExecutor = require('./plan-executor');
 *   const executor = new PlanExecutor();
 *   const phase = executor.getCurrentPhase();
 *   const weights = executor.getPhaseWeights(phase);
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const BASE_PATH = path.resolve(__dirname, '..');
const PLANS_DIR = path.join(BASE_PATH, 'plans');
const ACTIVE_PLAN_FILE = path.join(PLANS_DIR, 'ACTIVE-PLAN.md');

// Phase 유형별 도구 가중치 프로필
const PHASE_PROFILES = {
  // 연구/조사 단계
  'research': {
    search: 1.5,
    web: 1.4,
    ai: 1.3,
    file: 0.8,
    git: 0.6
  },
  // 계획 단계
  'planning': {
    search: 1.2,
    file: 1.0,
    web: 1.0,
    ai: 1.3,
    git: 0.7
  },
  // 구현 단계
  'implementation': {
    file: 1.5,
    development: 1.4,
    git: 1.3,
    search: 0.8,
    web: 0.7
  },
  // 테스트 단계
  'testing': {
    development: 1.5,
    file: 1.2,
    git: 1.2,
    search: 0.6,
    web: 0.5
  },
  // 문서화 단계
  'documentation': {
    file: 1.4,
    search: 1.0,
    web: 0.9,
    git: 1.2,
    ai: 1.1
  },
  // 검증 단계
  'verification': {
    development: 1.3,
    file: 1.2,
    git: 1.4,
    search: 0.7,
    web: 0.6
  },
  // 배포 단계
  'deployment': {
    git: 1.5,
    development: 1.3,
    file: 1.0,
    automation: 1.4,
    web: 0.8
  }
};

// 태스크 키워드 → 도구 카테고리 매핑
const TASK_KEYWORD_TOOLS = {
  '검색': ['search', 'web'],
  '조사': ['search', 'web', 'ai'],
  'research': ['search', 'web', 'ai'],
  '파일': ['file', 'filesystem'],
  '생성': ['file', 'filesystem'],
  '수정': ['file', 'filesystem'],
  'create': ['file', 'filesystem'],
  'edit': ['file', 'filesystem'],
  '커밋': ['git', 'development'],
  'commit': ['git', 'development'],
  '테스트': ['development'],
  'test': ['development'],
  '배포': ['git', 'automation'],
  'deploy': ['git', 'automation'],
  '분석': ['ai', 'search'],
  'analyze': ['ai', 'search'],
  '동기화': ['git', 'file'],
  'sync': ['git', 'file']
};

/**
 * 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // 파싱 실패 시 기본값 반환
  }
  return defaultValue;
}

/**
 * 활성 플랜 찾기
 */
function findActivePlan() {
  try {
    const files = fs.readdirSync(PLANS_DIR)
      .filter(f => f.endsWith('-progress.json'));
    
    for (const file of files) {
      const data = safeReadJSON(path.join(PLANS_DIR, file));
      if (data && data.status === 'active') {
        return data;
      }
    }
  } catch (error) {
    // 디렉토리 없거나 읽기 실패
  }
  return null;
}

// ============================================
// PlanExecutor 클래스
// ============================================

class PlanExecutor {
  constructor() {
    this.activePlan = null;
    this.lastCheck = null;
    this.cacheValidityMs = 30000; // 30초 캐시
  }

  /**
   * 활성 플랜 로드 (캐싱)
   */
  loadActivePlan() {
    const now = Date.now();
    if (this.activePlan && this.lastCheck && 
        (now - this.lastCheck) < this.cacheValidityMs) {
      return this.activePlan;
    }
    
    this.activePlan = findActivePlan();
    this.lastCheck = now;
    return this.activePlan;
  }

  /**
   * 현재 활성 플랜의 Phase 정보 반환
   * @returns {object|null} 현재 진행 중인 Phase 정보
   */
  getCurrentPhase() {
    const plan = this.loadActivePlan();
    if (!plan || !plan.phases) return null;
    
    // currentPhase로 찾기
    if (plan.currentPhase) {
      const phase = plan.phases.find(p => p.id === plan.currentPhase);
      if (phase) return phase;
    }
    
    // in_progress 상태인 Phase 찾기
    return plan.phases.find(p => p.status === 'in_progress') || null;
  }

  /**
   * Phase 유형 추론
   * @param {object} phase - Phase 객체
   * @returns {string} Phase 유형 (research, implementation, etc.)
   */
  getPhaseType(phase) {
    if (!phase) return 'implementation'; // 기본값
    
    const name = (phase.name || phase.id || '').toLowerCase();
    
    // 키워드 기반 유형 추론
    if (/research|조사|연구|탐색/.test(name)) return 'research';
    if (/plan|계획|설계|design/.test(name)) return 'planning';
    if (/implement|구현|개발|build|코딩/.test(name)) return 'implementation';
    if (/test|테스트|검증|verify/.test(name)) return 'testing';
    if (/doc|문서|작성/.test(name)) return 'documentation';
    if (/verify|확인|검증|validation/.test(name)) return 'verification';
    if (/deploy|배포|release/.test(name)) return 'deployment';
    
    // phase.type이 명시되어 있으면 사용
    if (phase.type && PHASE_PROFILES[phase.type]) {
      return phase.type;
    }
    
    return 'implementation'; // 기본값
  }

  /**
   * Phase별 도구 가중치 반환
   * @param {object} phase - Phase 객체
   * @returns {object} 카테고리별 가중치 맵
   */
  getPhaseWeights(phase) {
    const phaseType = this.getPhaseType(phase);
    return PHASE_PROFILES[phaseType] || PHASE_PROFILES['implementation'];
  }

  /**
   * 다음 태스크 가져오기
   * @returns {object|null} 다음 수행할 태스크
   */
  getNextTask() {
    const phase = this.getCurrentPhase();
    if (!phase || !phase.tasks) return null;
    
    // pending 또는 in_progress 상태인 첫 번째 태스크
    return phase.tasks.find(t => 
      t.status === 'pending' || t.status === 'in_progress'
    ) || null;
  }

  /**
   * 다음 태스크 기반 도구 사전 추천
   * @param {object} nextTask - 다음 태스크 객체
   * @returns {string[]} 추천 도구 카테고리 목록
   */
  suggestToolsForNextTask(nextTask) {
    if (!nextTask) return [];
    
    const title = (nextTask.title || '').toLowerCase();
    const suggestedCategories = new Set();
    
    // 태스크 제목에서 키워드 매칭
    for (const [keyword, categories] of Object.entries(TASK_KEYWORD_TOOLS)) {
      if (title.includes(keyword.toLowerCase())) {
        categories.forEach(cat => suggestedCategories.add(cat));
      }
    }
    
    return Array.from(suggestedCategories);
  }

  /**
   * 전체 플랜 컨텍스트 반환 (추천 엔진용)
   * @returns {object} 플랜 컨텍스트
   */
  getContext() {
    const plan = this.loadActivePlan();
    const phase = this.getCurrentPhase();
    const nextTask = this.getNextTask();
    
    return {
      hasPlan: !!plan,
      planId: plan?.planId || null,
      planStatus: plan?.status || null,
      progressPercent: plan?.metadata?.progressPercent || 0,
      currentPhase: phase ? {
        id: phase.id,
        name: phase.name,
        type: this.getPhaseType(phase),
        status: phase.status
      } : null,
      phaseWeights: this.getPhaseWeights(phase),
      nextTask: nextTask ? {
        id: nextTask.id,
        title: nextTask.title,
        suggestedTools: this.suggestToolsForNextTask(nextTask)
      } : null
    };
  }

  /**
   * 플랜 상태 요약 출력 (CLI용)
   */
  printStatus() {
    const ctx = this.getContext();
    
    if (!ctx.hasPlan) {
      console.log('[*] 활성 플랜 없음');
      return ctx;
    }
    
    console.log(`\n[PLAN] ${ctx.planId} (${ctx.progressPercent}%)`);
    if (ctx.currentPhase) {
      console.log(`[PHASE] ${ctx.currentPhase.id} - ${ctx.currentPhase.name} (${ctx.currentPhase.type})`);
      console.log(`[WEIGHTS] ${JSON.stringify(ctx.phaseWeights)}`);
    }
    if (ctx.nextTask) {
      console.log(`[NEXT] ${ctx.nextTask.id} - ${ctx.nextTask.title}`);
      if (ctx.nextTask.suggestedTools.length > 0) {
        console.log(`[SUGGEST] ${ctx.nextTask.suggestedTools.join(', ')}`);
      }
    }
    console.log('');
    
    return ctx;
  }
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const executor = new PlanExecutor();
  
  switch (command) {
    case 'status':
    case 's':
      executor.printStatus();
      break;
      
    case 'context':
    case 'c':
      console.log(JSON.stringify(executor.getContext(), null, 2));
      break;
      
    case 'weights':
    case 'w':
      const phase = executor.getCurrentPhase();
      const weights = executor.getPhaseWeights(phase);
      console.log(`[PHASE TYPE] ${executor.getPhaseType(phase)}`);
      console.log('[WEIGHTS]', JSON.stringify(weights, null, 2));
      break;
      
    default:
      console.log('Plan Executor - Planning-ATOS Bridge');
      console.log('');
      console.log('Usage: node plan-executor.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  status, s   현재 플랜/Phase 상태 출력');
      console.log('  context, c  전체 컨텍스트 JSON 출력');
      console.log('  weights, w  현재 Phase 도구 가중치 출력');
      console.log('');
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = PlanExecutor;

// CLI 실행
if (require.main === module) {
  handleCLI();
}
