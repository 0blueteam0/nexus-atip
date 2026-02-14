/**
 * loop-guard.js
 * Self-Trigger Pipeline - 무한 루프 방지 (3-Layer Protection)
 * 
 * Layer 1: Trigger Depth - 최대 2단계 중첩
 * Layer 2: Keyword Cooldown - 동일 키워드 30초 쿨다운
 * Layer 3: Session Limit - 세션당 최대 50회 트리거
 */

const DEFAULT_CONFIG = {
  maxDepth: 2,           // Layer 1: 최대 중첩 깊이
  cooldownMs: 30000,     // Layer 2: 키워드 쿨다운 (30초)
  sessionLimit: 50       // Layer 3: 세션당 최대 트리거
};

class LoopGuard {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentDepth = 0;
    this.keywordHistory = new Map();  // keyword -> lastTriggerTime
    this.sessionTriggerCount = 0;
    this.stats = {
      blocked: { depth: 0, cooldown: 0, limit: 0 },
      allowed: 0
    };
  }

  /**
   * 트리거 가능 여부 확인 (3-Layer 검사)
   * @param {string} keyword - 검사할 키워드
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canTrigger(keyword = '') {
    // Layer 1: Depth 검사
    if (this.currentDepth >= this.config.maxDepth) {
      this.stats.blocked.depth++;
      return { allowed: false, reason: `depth_exceeded (${this.currentDepth}/${this.config.maxDepth})` };
    }

    // Layer 2: Cooldown 검사
    if (keyword && this.keywordHistory.has(keyword)) {
      const lastTime = this.keywordHistory.get(keyword);
      const elapsed = Date.now() - lastTime;
      if (elapsed < this.config.cooldownMs) {
        this.stats.blocked.cooldown++;
        const remaining = Math.ceil((this.config.cooldownMs - elapsed) / 1000);
        return { allowed: false, reason: `cooldown (${remaining}s remaining)` };
      }
    }

    // Layer 3: Session Limit 검사
    if (this.sessionTriggerCount >= this.config.sessionLimit) {
      this.stats.blocked.limit++;
      return { allowed: false, reason: `session_limit (${this.sessionTriggerCount}/${this.config.sessionLimit})` };
    }

    this.stats.allowed++;
    return { allowed: true };
  }

  /**
   * 트리거 깊이 증가 (중첩 시작)
   */
  incrementDepth() {
    this.currentDepth++;
    return this.currentDepth;
  }

  /**
   * 트리거 깊이 감소 (중첩 종료)
   */
  decrementDepth() {
    if (this.currentDepth > 0) {
      this.currentDepth--;
    }
    return this.currentDepth;
  }

  /**
   * 트리거 기록 (cooldown 및 session count 업데이트)
   * @param {string} keyword - 트리거된 키워드
   */
  recordTrigger(keyword) {
    if (keyword) {
      this.keywordHistory.set(keyword, Date.now());
    }
    this.sessionTriggerCount++;
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      currentDepth: this.currentDepth,
      sessionTriggerCount: this.sessionTriggerCount,
      trackedKeywords: this.keywordHistory.size
    };
  }

  /**
   * 세션 리셋
   */
  reset() {
    this.currentDepth = 0;
    this.keywordHistory.clear();
    this.sessionTriggerCount = 0;
    this.stats = { blocked: { depth: 0, cooldown: 0, limit: 0 }, allowed: 0 };
  }
}

// Singleton instance
let instance = null;

function getLoopGuard(config) {
  if (!instance) {
    instance = new LoopGuard(config);
  }
  return instance;
}

module.exports = { LoopGuard, getLoopGuard, DEFAULT_CONFIG };
