/**
 * phase-detector.js
 * Self-Trigger Pipeline - 페이즈 감지
 * 
 * Claude 출력 내용에서 현재 작업 단계(Plan/Implement/Execute) 감지
 */

const PHASE_KEYWORDS = {
  plan: {
    korean: ['계획', '설계', '분석', '요구사항', '아키텍처', '구조', '플랜', '검토', '탐색', '조사'],
    english: ['plan', 'design', 'analyze', 'requirement', 'architecture', 'structure', 'explore', 'research', 'investigate']
  },
  implement: {
    korean: ['구현', '작성', '코드', '파일', '생성', '수정', '편집', '만들', '개발'],
    english: ['implement', 'write', 'code', 'file', 'create', 'modify', 'edit', 'develop', 'build']
  },
  execute: {
    korean: ['실행', '테스트', '검증', '확인', '빌드', '배포', '런', '시작'],
    english: ['execute', 'test', 'verify', 'check', 'build', 'deploy', 'run', 'start', 'launch']
  }
};

// 파이프라인 스테이지 -> 페이즈 매핑
const PIPELINE_STAGE_MAP = {
  'Specify': 'plan',
  'Explore': 'plan',
  'Plan': 'plan',
  'Implement': 'implement',
  'Execute': 'execute',
  'Verify': 'execute'
};

class PhaseDetector {
  constructor() {
    this.lastDetected = null;
    this.confidence = 0;
  }

  /**
   * 텍스트에서 페이즈 감지
   * @param {string} content - 분석할 텍스트
   * @returns {{ phase: string, confidence: number, matches: string[] }}
   */
  detect(content) {
    if (!content || typeof content !== 'string') {
      return { phase: 'default', confidence: 0, matches: [] };
    }

    const lowerContent = content.toLowerCase();
    const scores = { plan: 0, implement: 0, execute: 0 };
    const matches = { plan: [], implement: [], execute: [] };

    // 각 페이즈별 키워드 매칭
    for (const [phase, keywords] of Object.entries(PHASE_KEYWORDS)) {
      const allKeywords = [...keywords.korean, ...keywords.english];
      
      for (const keyword of allKeywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          scores[phase]++;
          matches[phase].push(keyword);
        }
      }
    }

    // 최고 점수 페이즈 선택
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return { phase: 'default', confidence: 0, matches: [] };
    }

    const detectedPhase = Object.entries(scores)
      .find(([_, score]) => score === maxScore)[0];

    // 신뢰도 계산 (다른 페이즈와의 점수 차이 기반)
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    this.lastDetected = detectedPhase;
    this.confidence = confidence;

    return {
      phase: detectedPhase,
      confidence: Math.round(confidence * 100) / 100,
      matches: matches[detectedPhase]
    };
  }

  /**
   * 파이프라인 스테이지를 페이즈로 매핑
   * @param {string} stage - 파이프라인 스테이지 (Specify/Explore/Plan/Implement/Execute)
   * @returns {string} 매핑된 페이즈
   */
  mapPipelineStage(stage) {
    return PIPELINE_STAGE_MAP[stage] || 'default';
  }

  /**
   * 명시적 페이즈 힌트와 감지 결과 결합
   * @param {string} content - 분석할 텍스트
   * @param {string} hint - 명시적 힌트 (optional)
   * @returns {string} 최종 페이즈
   */
  resolve(content, hint = null) {
    // 명시적 힌트가 있으면 우선
    if (hint && ['plan', 'implement', 'execute'].includes(hint)) {
      return hint;
    }

    // 파이프라인 스테이지 힌트
    if (hint && PIPELINE_STAGE_MAP[hint]) {
      return PIPELINE_STAGE_MAP[hint];
    }

    // 컨텐츠 기반 감지
    const detected = this.detect(content);
    return detected.confidence >= 0.4 ? detected.phase : 'default';
  }

  /**
   * 마지막 감지 결과 조회
   */
  getLastDetection() {
    return {
      phase: this.lastDetected,
      confidence: this.confidence
    };
  }
}

// Singleton
let instance = null;

function getPhaseDetector() {
  if (!instance) {
    instance = new PhaseDetector();
  }
  return instance;
}

module.exports = { 
  PhaseDetector, 
  getPhaseDetector, 
  PHASE_KEYWORDS, 
  PIPELINE_STAGE_MAP 
};
