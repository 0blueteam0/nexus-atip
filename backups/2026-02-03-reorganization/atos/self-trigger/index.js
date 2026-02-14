/**
 * atos/self-trigger/index.js
 * Self-Trigger Pipeline - Claude 자체 출력 키워드 감지 오케스트레이터
 * 
 * 핵심 기능:
 * - Claude의 Plan/Implement/Execute 출력에서 키워드 감지
 * - 감지된 키워드 → 리소스 자동 로드 (Skills, Tools, Commands)
 * - 3-Layer 무한 루프 방지 적용
 * 
 * Usage:
 *   const { getSelfTriggerOrchestrator } = require('./atos/self-trigger');
 *   const orchestrator = getSelfTriggerOrchestrator();
 *   await orchestrator.process(claudeOutput, 'plan');
 * 
 * CLI:
 *   node atos/self-trigger/index.js process "출력 내용" [phase]
 *   node atos/self-trigger/index.js status
 *   node atos/self-trigger/index.js reset
 */

const fs = require('fs');
const path = require('path');

// 기반 모듈 로드
const { getLoopGuard } = require('./loop-guard');
const { getOutputBuffer } = require('./output-buffer');
const { getPhaseDetector } = require('./phase-detector');

// ATOS context-analyzer 연동 (기존 STL 인프라)
let contextAnalyzer = null;
try {
  contextAnalyzer = require('../context-analyzer');
} catch (e) {
  console.warn('[!] context-analyzer 로드 실패 - 독립 모드로 실행');
}

// 트리거 프로필 로드
const PROFILES_PATH = path.join(__dirname, 'trigger-profiles.json');
let triggerProfiles = { profiles: { default: { maxPriority: 1, enabledCategories: ['tools'] } } };
try {
  triggerProfiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
} catch (e) {
  console.warn('[!] trigger-profiles.json 로드 실패 - 기본 프로필 사용');
}


/**
 * SelfTriggerOrchestrator
 * Claude 출력 분석 → 키워드 감지 → 리소스 로드 오케스트레이션
 */
class SelfTriggerOrchestrator {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.loopGuard = getLoopGuard();
    this.outputBuffer = getOutputBuffer();
    this.phaseDetector = getPhaseDetector();
    this.profiles = triggerProfiles.profiles;
    
    // 통계
    this.stats = {
      processedCount: 0,
      triggeredCount: 0,
      blockedByLoopGuard: 0,
      resourcesLoaded: [],
      lastProcessed: null
    };
  }

  /**
   * 메인 처리 함수
   * @param {string} output - Claude 출력 내용
   * @param {string} phaseHint - 페이즈 힌트 (plan/implement/execute)
   * @returns {object} 처리 결과
   */
  async process(output, phaseHint = null) {
    if (!this.enabled) {
      return { success: false, reason: 'disabled' };
    }

    if (!output || typeof output !== 'string' || output.trim().length === 0) {
      return { success: false, reason: 'empty_output' };
    }

    this.stats.processedCount++;
    this.stats.lastProcessed = new Date().toISOString();

    // 1. 페이즈 감지
    const phase = this.phaseDetector.resolve(output, phaseHint);
    const profile = this.profiles[phase] || this.profiles.default;

    // 2. 출력 버퍼에 저장
    this.outputBuffer.push(output, phase);

    // 3. 루프 가드 깊이 증가
    this.loopGuard.incrementDepth();

    try {
      // 4. 키워드 분석 (기존 STL 인프라 활용)
      const source = this.phaseToSource(phase);
      let analysisResult = { triggers: [], resources: [] };

      if (contextAnalyzer && typeof contextAnalyzer.analyzeAnyText === 'function') {
        analysisResult = contextAnalyzer.analyzeAnyText(output, source);
      } else {
        // 폴백: 기본 키워드 매칭
        analysisResult = this.basicKeywordMatch(output, profile);
      }

      // 5. 루프 가드 검사 및 리소스 로드
      const loadedResources = [];
      const blockedKeywords = [];

      for (const trigger of (analysisResult.triggers || [])) {
        const keyword = trigger.keyword || trigger;
        
        if (this.loopGuard.canTrigger(keyword)) {
          this.loopGuard.recordTrigger(keyword);
          loadedResources.push({
            keyword,
            resource: trigger.resource || trigger,
            phase,
            timestamp: new Date().toISOString()
          });
        } else {
          blockedKeywords.push(keyword);
          this.stats.blockedByLoopGuard++;
        }
      }

      // 6. 통계 업데이트
      if (loadedResources.length > 0) {
        this.stats.triggeredCount++;
        this.stats.resourcesLoaded.push(...loadedResources);
      }

      return {
        success: true,
        phase,
        profile: profile.enabledCategories,
        triggered: loadedResources.length,
        blocked: blockedKeywords.length,
        resources: loadedResources,
        blockedKeywords
      };

    } finally {
      // 7. 깊이 복원
      this.loopGuard.decrementDepth();
    }
  }


  /**
   * 페이즈 → STL 소스 변환
   */
  phaseToSource(phase) {
    const mapping = {
      plan: 'claude_plan',
      implement: 'claude_impl',
      execute: 'claude_exec'
    };
    return mapping[phase] || 'claude_plan';
  }

  /**
   * 기본 키워드 매칭 (context-analyzer 없을 때 폴백)
   */
  basicKeywordMatch(output, profile) {
    const triggers = [];
    const keywords = [
      { pattern: /검색|search|찾아/gi, resource: 'firecrawl_search' },
      { pattern: /파일.*작성|write.*file/gi, resource: 'desktop-commander' },
      { pattern: /차트|graph|chart/gi, resource: 'antv-chart' },
      { pattern: /GitHub|깃허브/gi, resource: 'github' },
      { pattern: /테스트|test/gi, resource: 'playwright' }
    ];

    for (const kw of keywords) {
      if (kw.pattern.test(output)) {
        triggers.push({ keyword: kw.pattern.source, resource: kw.resource });
      }
    }

    return { triggers, resources: triggers.map(t => t.resource) };
  }

  /**
   * 활성화/비활성화
   */
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      loopGuard: this.loopGuard.getStats(),
      buffer: this.outputBuffer.getStatus(),
      enabled: this.enabled
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.stats = {
      processedCount: 0,
      triggeredCount: 0,
      blockedByLoopGuard: 0,
      resourcesLoaded: [],
      lastProcessed: null
    };
    this.loopGuard.reset();
    this.outputBuffer.flush();
  }
}

// Singleton 인스턴스
let orchestratorInstance = null;

function getSelfTriggerOrchestrator(options = {}) {
  if (!orchestratorInstance) {
    orchestratorInstance = new SelfTriggerOrchestrator(options);
  }
  return orchestratorInstance;
}

/**
 * CLI 처리 함수
 */
async function processSelfTrigger(output, phaseHint = null) {
  const orchestrator = getSelfTriggerOrchestrator();
  return await orchestrator.process(output, phaseHint);
}


// CLI 인터페이스
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const orchestrator = getSelfTriggerOrchestrator();

  switch (command) {
    case 'process':
      const output = process.argv[3];
      const phase = process.argv[4] || null;
      if (!output) {
        console.log('Usage: node index.js process "output text" [phase]');
        process.exit(1);
      }
      processSelfTrigger(output, phase).then(result => {
        console.log('[*] Self-Trigger 처리 결과:');
        console.log(JSON.stringify(result, null, 2));
      });
      break;

    case 'status':
      console.log('[*] Self-Trigger 상태:');
      console.log(JSON.stringify(orchestrator.getStats(), null, 2));
      break;

    case 'reset':
      orchestrator.reset();
      console.log('[+] Self-Trigger 리셋 완료');
      break;

    case 'enable':
      orchestrator.enable();
      console.log('[+] Self-Trigger 활성화됨');
      break;

    case 'disable':
      orchestrator.disable();
      console.log('[+] Self-Trigger 비활성화됨');
      break;

    default:
      console.log('Self-Trigger Pipeline - Claude 출력 키워드 감지');
      console.log('');
      console.log('Commands:');
      console.log('  process "text" [phase]  - 출력 분석 및 트리거');
      console.log('  status                  - 현재 상태 조회');
      console.log('  reset                   - 통계 및 버퍼 리셋');
      console.log('  enable                  - 파이프라인 활성화');
      console.log('  disable                 - 파이프라인 비활성화');
      console.log('');
      console.log('Phases: plan, implement, execute');
  }
}

// 모듈 내보내기
module.exports = {
  SelfTriggerOrchestrator,
  getSelfTriggerOrchestrator,
  processSelfTrigger,
  // 하위 모듈 재export
  getLoopGuard,
  getOutputBuffer,
  getPhaseDetector
};
