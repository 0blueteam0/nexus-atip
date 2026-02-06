/**
 * context-monitor.js
 * FIC (Frequent Intentional Compaction) 컨텍스트 모니터링 시스템
 * 
 * 컨텍스트 사용량을 추적하고 40-80% 활용률 유지를 위해
 * 자동 압축 트리거 및 관리
 * 
 * Hook 연동: before-response, after-tool-call
 * 
 * @module systems/context-monitor
 * @version 1.0.0
 * @date 2025-12-25
 */

const fs = require('fs');
const path = require('path');

// 상수 정의
const CONTEXT_LIMITS = {
  WARNING_THRESHOLD: 0.6,    // 60% - 경고 시작
  COMPACT_THRESHOLD: 0.8,    // 80% - 자동 압축 트리거
  TARGET_AFTER_COMPACT: 0.5, // 50% - 압축 후 목표
  MAX_TOKENS_ESTIMATE: 200000 // Claude 최대 컨텍스트 추정
};

// 압축 우선순위 (높을수록 먼저 압축)
const COMPACTION_PRIORITIES = {
  'file_search_results': 10,
  'code_output': 8,
  'edit_history': 7,
  'test_logs': 6,
  'json_blobs': 5,
  'tool_outputs': 4,
  'general': 1
};

/**
 * ContextMonitor 클래스
 * 싱글톤 패턴으로 세션 내 컨텍스트 추적
 */
class ContextMonitor {
  constructor() {
    this.sessionStart = Date.now();
    this.tokenEstimate = 0;
    this.contentLog = [];      // { type, size, timestamp }
    this.compactionHistory = [];
    this.currentStage = 'specify';  // specify -> explore -> plan -> implement
  }

  /**
   * 컨텐츠의 토큰 수 추정
   * @param {string} content - 텍스트 컨텐츠
   * @returns {number} 추정 토큰 수
   */
  estimateTokens(content) {
    if (!content) return 0;
    // 간단한 휴리스틱: 4문자 = 1토큰 (영어 기준)
    // 한국어는 더 많은 토큰 사용하므로 보정
    const hasKorean = /[가-힣]/.test(content);
    const baseEstimate = Math.ceil(content.length / 4);
    return hasKorean ? Math.ceil(baseEstimate * 1.5) : baseEstimate;
  }

  /**
   * 컨텐츠 유형 감지
   * @param {string} content - 컨텐츠
   * @returns {string} 컨텐츠 유형
   */
  detectContentType(content) {
    if (!content) return 'general';
    
    // 파일 검색 결과 패턴
    if (content.includes('[FILE]') || content.includes('[DIR]') || 
        /Found \d+ files/.test(content)) {
      return 'file_search_results';
    }
    
    // 코드 출력 패턴
    if (/^[\s\S]*```[\s\S]*```[\s\S]*$/.test(content) ||
        /function|class|const|let|var|import|export/.test(content)) {
      return 'code_output';
    }
    
    // 테스트 로그 패턴
    if (/PASS|FAIL|test|expect|assert/i.test(content)) {
      return 'test_logs';
    }
    
    // JSON blob 패턴
    if (/^\s*[\[{]/.test(content) && /[\]}]\s*$/.test(content)) {
      return 'json_blobs';
    }
    
    return 'general';
  }

  /**
   * 컨텐츠 추가 및 추적
   * @param {string} content - 추가된 컨텐츠
   * @param {string} source - 소스 (tool, user, assistant)
   */
  addContent(content, source = 'unknown') {
    const tokens = this.estimateTokens(content);
    const type = this.detectContentType(content);
    
    this.tokenEstimate += tokens;
    this.contentLog.push({
      type,
      source,
      tokens,
      timestamp: Date.now()
    });

    // 임계치 체크
    const utilization = this.getCurrentUtilization();
    if (utilization >= CONTEXT_LIMITS.COMPACT_THRESHOLD) {
      console.log(`[!] Context at ${(utilization * 100).toFixed(1)}% - Compaction recommended`);
    }

    return { tokens, type, utilization };
  }

  /**
   * 현재 컨텍스트 활용률 조회
   * @returns {number} 0-1 사이의 활용률
   */
  getCurrentUtilization() {
    return Math.min(1, this.tokenEstimate / CONTEXT_LIMITS.MAX_TOKENS_ESTIMATE);
  }

  /**
   * 압축 필요 여부 확인
   * @returns {object} { needed, reason, utilization }
   */
  shouldTriggerCompaction() {
    const utilization = this.getCurrentUtilization();
    
    if (utilization >= CONTEXT_LIMITS.COMPACT_THRESHOLD) {
      return {
        needed: true,
        reason: 'threshold_exceeded',
        utilization,
        priority: 'high'
      };
    }
    
    if (utilization >= CONTEXT_LIMITS.WARNING_THRESHOLD) {
      return {
        needed: false,
        reason: 'approaching_threshold',
        utilization,
        priority: 'medium'
      };
    }
    
    return {
      needed: false,
      reason: 'within_limits',
      utilization,
      priority: 'low'
    };
  }

  /**
   * 압축 대상 분석 및 제안
   * @returns {Array} 압축 제안 목록
   */
  getCompactionSuggestions() {
    const suggestions = [];
    const byType = {};
    
    // 유형별 토큰 집계
    this.contentLog.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + entry.tokens;
    });
    
    // 우선순위에 따라 정렬
    const sorted = Object.entries(byType)
      .map(([type, tokens]) => ({
        type,
        tokens,
        priority: COMPACTION_PRIORITIES[type] || 1
      }))
      .sort((a, b) => b.priority - a.priority);
    
    sorted.forEach(item => {
      const percentage = (item.tokens / this.tokenEstimate * 100).toFixed(1);
      suggestions.push({
        type: item.type,
        tokens: item.tokens,
        percentage: `${percentage}%`,
        action: this.getCompactionAction(item.type)
      });
    });
    
    return suggestions;
  }

  /**
   * 유형별 압축 액션 반환
   * @param {string} type - 컨텐츠 유형
   * @returns {string} 압축 액션 설명
   */
  getCompactionAction(type) {
    const actions = {
      'file_search_results': '경로만 유지 (상위 20개)',
      'code_output': '핵심 함수 시그니처만 유지',
      'edit_history': '최종 상태만 유지 (최근 5개)',
      'test_logs': '실패/경고만 유지',
      'json_blobs': '스키마만 추출',
      'tool_outputs': '핵심 결과만 유지',
      'general': '요약 생성'
    };
    return actions[type] || '수동 검토 필요';
  }

  /**
   * 4-Stage 파이프라인 단계 전환
   * @param {string} newStage - 새 단계
   */
  transitionStage(newStage) {
    const previousStage = this.currentStage;
    this.currentStage = newStage;
    
    console.log(`[*] Stage transition: ${previousStage} -> ${newStage}`);
    
    // 단계 전환 시 이전 단계 컨텐츠 압축 권장
    return {
      previousStage,
      newStage,
      recommendation: `이전 ${previousStage} 단계 정보 압축 권장`
    };
  }

  /**
   * 세션 통계 조회
   * @returns {object} 세션 통계
   */
  getStats() {
    const duration = Math.floor((Date.now() - this.sessionStart) / 1000);
    const utilization = this.getCurrentUtilization();
    
    return {
      sessionDuration: `${duration}s`,
      estimatedTokens: this.tokenEstimate,
      utilization: `${(utilization * 100).toFixed(1)}%`,
      contentEntries: this.contentLog.length,
      currentStage: this.currentStage,
      compactionsTriggered: this.compactionHistory.length,
      status: utilization >= CONTEXT_LIMITS.COMPACT_THRESHOLD ? 'CRITICAL' :
              utilization >= CONTEXT_LIMITS.WARNING_THRESHOLD ? 'WARNING' : 'OK'
    };
  }

  /**
   * 모니터 리셋
   */
  reset() {
    this.sessionStart = Date.now();
    this.tokenEstimate = 0;
    this.contentLog = [];
    this.compactionHistory = [];
    this.currentStage = 'specify';
  }
}

// 싱글톤 인스턴스
const monitor = new ContextMonitor();

// CLI 인터페이스
if (require.main === module) {
  const cmd = process.argv[2];
  
  switch (cmd) {
    case 'status':
      console.log(JSON.stringify(monitor.getStats(), null, 2));
      break;
      
    case 'test':
      // 테스트 시나리오
      monitor.addContent('Found 50 files in src/ directory\n[FILE] src/index.js\n[FILE] src/app.js', 'tool');
      monitor.addContent('function test() { return true; }', 'assistant');
      monitor.addContent('PASS: all tests passed', 'tool');
      console.log('Stats:', monitor.getStats());
      console.log('Should Compact:', monitor.shouldTriggerCompaction());
      console.log('Suggestions:', monitor.getCompactionSuggestions());
      break;
      
    case 'suggestions':
      console.log(JSON.stringify(monitor.getCompactionSuggestions(), null, 2));
      break;
      
    case 'reset':
      monitor.reset();
      console.log('[+] Context monitor reset');
      break;
      
    default:
      console.log('Usage: node context-monitor.js <status|test|suggestions|reset>');
  }
}

module.exports = { ContextMonitor, monitor, CONTEXT_LIMITS };
