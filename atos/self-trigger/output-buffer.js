/**
 * output-buffer.js
 * Self-Trigger Pipeline - Claude 출력 버퍼
 * 
 * Ring buffer로 Claude의 출력을 캡처하여 키워드 분석에 제공
 * 최대 50KB, 최근 5분 내 출력만 유지
 */

const DEFAULT_CONFIG = {
  maxSizeBytes: 50 * 1024,  // 50KB
  maxAgeMs: 5 * 60 * 1000,  // 5분
  maxEntries: 100           // 최대 엔트리 수
};

class OutputBuffer {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.buffer = [];       // { content, phase, timestamp }
    this.currentPhase = 'default';
    this.totalSize = 0;
  }

  /**
   * 출력 내용을 버퍼에 추가
   * @param {string} content - 출력 내용
   * @param {string} phase - 현재 페이즈 (plan/implement/execute)
   */
  push(content, phase = null) {
    if (!content || typeof content !== 'string') return;

    const entry = {
      content: content.substring(0, 10000),  // 단일 엔트리 최대 10KB
      phase: phase || this.currentPhase,
      timestamp: Date.now()
    };

    this.buffer.push(entry);
    this.totalSize += entry.content.length;

    // 용량 초과 시 오래된 항목 제거
    this._cleanup();
  }

  /**
   * 최근 출력 조회
   * @param {number} maxAgeMs - 최대 경과 시간 (ms)
   * @returns {Array} 최근 출력 배열
   */
  getRecent(maxAgeMs = null) {
    const cutoff = Date.now() - (maxAgeMs || this.config.maxAgeMs);
    return this.buffer.filter(e => e.timestamp >= cutoff);
  }

  /**
   * 특정 페이즈의 출력만 조회
   * @param {string} phase - 페이즈 이름
   * @returns {Array} 해당 페이즈 출력
   */
  getByPhase(phase) {
    return this.buffer.filter(e => e.phase === phase);
  }

  /**
   * 전체 출력을 하나의 문자열로 결합
   * @param {number} maxAgeMs - 최대 경과 시간
   * @returns {string} 결합된 출력
   */
  getCombined(maxAgeMs = null) {
    return this.getRecent(maxAgeMs)
      .map(e => e.content)
      .join('\n');
  }

  /**
   * 현재 페이즈 설정
   * @param {string} phase - 페이즈 이름
   */
  setPhase(phase) {
    if (['plan', 'implement', 'execute', 'default'].includes(phase)) {
      this.currentPhase = phase;
    }
  }

  /**
   * 버퍼 비우기
   */
  flush() {
    this.buffer = [];
    this.totalSize = 0;
  }

  /**
   * 버퍼 상태 조회
   */
  getStatus() {
    return {
      entries: this.buffer.length,
      totalSize: this.totalSize,
      currentPhase: this.currentPhase,
      oldestEntry: this.buffer[0]?.timestamp || null,
      newestEntry: this.buffer[this.buffer.length - 1]?.timestamp || null
    };
  }

  /**
   * 내부: 용량/시간 기반 정리
   */
  _cleanup() {
    const now = Date.now();
    const cutoff = now - this.config.maxAgeMs;

    // 시간 기반 제거
    this.buffer = this.buffer.filter(e => e.timestamp >= cutoff);

    // 엔트리 수 제한
    while (this.buffer.length > this.config.maxEntries) {
      this.buffer.shift();
    }

    // 용량 제한
    while (this.totalSize > this.config.maxSizeBytes && this.buffer.length > 0) {
      const removed = this.buffer.shift();
      this.totalSize -= removed.content.length;
    }

    // totalSize 재계산
    this.totalSize = this.buffer.reduce((sum, e) => sum + e.content.length, 0);
  }
}

// Singleton
let instance = null;

function getOutputBuffer(config) {
  if (!instance) {
    instance = new OutputBuffer(config);
  }
  return instance;
}

module.exports = { OutputBuffer, getOutputBuffer, DEFAULT_CONFIG };
