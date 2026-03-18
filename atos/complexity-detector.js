#!/usr/bin/env node
/**
 * Complexity Detector - Plan Mode Auto-Activation Engine
 *
 * Location: K:/PortableApps/genai/atos/complexity-detector.js
 *
 * Analyzes user input to determine task complexity and
 * recommends whether Plan Mode should be activated.
 *
 * Scoring: 0-4 Direct | 5-7 Suggest | 8+ Auto-recommend
 *
 * Usage:
 *   const detector = require('./complexity-detector');
 *   const result = detector.analyze("Migrate auth to JWT");
 *   // { score: 11, level: 'critical', action: 'auto', reasons: [...] }
 *
 *   CLI: node complexity-detector.js test
 *   CLI: node complexity-detector.js analyze "user input here"
 */

const SIGNALS = {
  // Positive signals (increase complexity)
  architecture: {
    score: 4,
    patterns: [
      /리팩토링|refactor/i, /마이그레이션|migrat/i,
      /시스템\s*변경|system\s*change/i, /아키텍처|architect/i,
      /redesign|재설계/i, /overhaul|전면\s*개편/i,
      /모듈화|modulariz/i, /분리|decouple/i
    ],
    label: 'architecture_change'
  },
  security: {
    score: 3,
    patterns: [
      /auth|인증|인가/i, /보안|security/i,
      /password|비밀번호/i, /token|토큰/i,
      /encrypt|암호화/i, /oauth|sso/i,
      /permission|권한/i, /credential/i
    ],
    label: 'security_related'
  },
  multiFile: {
    score: 3,
    patterns: [
      /여러\s*파일|multiple\s*files|across\s*files/i,
      /전체\s*프로젝트|entire\s*project/i,
      /모든\s*파일|all\s*files/i,
      /크로스\s*모듈|cross.?module/i
    ],
    label: 'multi_file'
  },
  newFeatureLarge: {
    score: 3,
    patterns: [
      /새\s*기능.*대규모|new\s*feature.*large/i,
      /새\s*시스템|new\s*system/i,
      /처음부터|from\s*scratch/i,
      /완전히\s*새|brand\s*new/i
    ],
    label: 'large_new_feature'
  },
  scaleModifier: {
    score: 3,
    patterns: [
      /대규모|large.?scale/i, /전체|entire|whole/i,
      /모든|all\s*of/i, /comprehensive|포괄/i,
      /완전|complete|full/i, /대대적|massive/i
    ],
    label: 'large_scale'
  },
  conversionTransform: {
    score: 3,
    patterns: [
      /전환|convert|transition/i, /통일|unif(y|ication)/i,
      /표준화|standardiz/i, /일괄\s*변경|batch\s*change/i,
      /전면\s*교체|full\s*replac/i, /전면\s*개편|개편|overhaul/i
    ],
    label: 'conversion_transform'
  },
  multiTask: {
    score: 2,
    patterns: [
      /하고.*도|하고.*또/i, /and\s*also|as\s*well/i,
      /추가하고.*작성|변경하고.*수정/i,
      /겸|동시에|함께|together/i
    ],
    label: 'multi_task_combined'
  },
  dbApiChange: {
    score: 3,
    patterns: [
      /스키마|schema/i, /migration|마이그레이션/i,
      /API\s*변경|API\s*change/i, /데이터베이스|database/i,
      /테이블\s*변경|table\s*change/i, /엔드포인트/i
    ],
    label: 'db_api_change'
  },
  uncertainty: {
    score: 2,
    patterns: [
      /어떻게.*해야|how\s*should/i, /방법|approach/i,
      /best\s*practice|모범\s*사례/i,
      /비교.*분석|compare.*analyz/i,
      /어떤\s*것이|which\s*one/i
    ],
    label: 'uncertainty'
  },

  // Negative signals (decrease complexity)
  simpleModifier: {
    score: -3,
    patterns: [
      /오타|typo/i, /간단한?\s*수정|simple\s*fix/i,
      /한\s*줄|one\s*line/i, /작은|small|minor/i,
      /빠르게|quick/i, /간단히|simply/i
    ],
    label: 'simple_task'
  },
  explicitDirect: {
    score: -5,
    patterns: [
      /바로\s*해|just\s*do\s*it/i, /그냥|simply\s*do/i,
      /즉시|immediately/i, /빨리|asap/i,
      /설명\s*없이|without\s*explain/i
    ],
    label: 'explicit_direct'
  },
  singleFile: {
    score: -2,
    patterns: [
      /이\s*파일|this\s*file/i, /해당\s*파일|that\s*file/i,
      /파일\s*하나|single\s*file|one\s*file/i
    ],
    label: 'single_file'
  }
};

// Complexity level thresholds
const THRESHOLDS = {
  direct: { min: -Infinity, max: 4, action: 'direct' },
  suggest: { min: 5, max: 7, action: 'suggest' },
  auto: { min: 8, max: Infinity, action: 'auto' }
};

// Level labels
const LEVEL_MAP = {
  direct: { label: 'trivial_or_simple', description: 'Direct execution (Plan Mode unnecessary)' },
  suggest: { label: 'medium', description: 'Plan Mode suggested (user choice)' },
  auto: { label: 'complex_or_critical', description: 'Plan Mode auto-recommended' }
};

/**
 * Count explicit file references in input
 */
function countFileReferences(input) {
  const filePatterns = [
    /[a-zA-Z0-9_-]+\.(js|ts|py|md|json|yaml|yml|css|html|jsx|tsx)/g,
    /src\/[^\s]+/g,
    /[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.[a-z]+/g
  ];
  let count = 0;
  for (const pattern of filePatterns) {
    const matches = input.match(pattern);
    if (matches) count += matches.length;
  }
  return Math.min(count, 20); // cap at 20
}

/**
 * Main analysis function
 * @param {string} input - User input text
 * @returns {Object} Analysis result
 */
function analyze(input) {
  if (!input || typeof input !== 'string') {
    return { score: 0, level: 'trivial_or_simple', action: 'direct', reasons: [], fileCount: 0 };
  }

  let totalScore = 0;
  const reasons = [];

  // Check each signal
  for (const [key, signal] of Object.entries(SIGNALS)) {
    for (const pattern of signal.patterns) {
      if (pattern.test(input)) {
        totalScore += signal.score;
        reasons.push({
          signal: signal.label,
          score: signal.score,
          matched: pattern.toString()
        });
        break; // one match per signal category
      }
    }
  }

  // Bonus for explicit file count
  const fileCount = countFileReferences(input);
  if (fileCount >= 5) {
    totalScore += 3;
    reasons.push({ signal: 'many_files_referenced', score: 3, matched: `${fileCount} files` });
  } else if (fileCount >= 3) {
    totalScore += 2;
    reasons.push({ signal: 'some_files_referenced', score: 2, matched: `${fileCount} files` });
  }

  // Input length bonus (very long inputs often = complex tasks)
  if (input.length > 500) {
    totalScore += 1;
    reasons.push({ signal: 'long_input', score: 1, matched: `${input.length} chars` });
  }

  // Floor at 0
  totalScore = Math.max(0, totalScore);

  // Determine action level
  let action, level;
  if (totalScore <= THRESHOLDS.direct.max) {
    action = 'direct';
    level = LEVEL_MAP.direct;
  } else if (totalScore <= THRESHOLDS.suggest.max) {
    action = 'suggest';
    level = LEVEL_MAP.suggest;
  } else {
    action = 'auto';
    level = LEVEL_MAP.auto;
  }

  return {
    score: totalScore,
    level: level.label,
    action,
    description: level.description,
    reasons,
    fileCount,
    inputLength: input.length
  };
}

/**
 * Generate user-facing recommendation message
 * @param {Object} result - analyze() result
 * @param {string} input - Original user input
 * @returns {string|null} Recommendation message (null if direct)
 */
function getRecommendation(result, input) {
  if (result.action === 'direct') return null;

  const reasonSummary = result.reasons
    .filter(r => r.score > 0)
    .map(r => r.signal.replace(/_/g, ' '))
    .join(', ');

  if (result.action === 'suggest') {
    return [
      `[?] Plan Mode 제안 (복잡도 점수: ${result.score}/10+)`,
      `    감지된 신호: ${reasonSummary}`,
      `    이 작업은 Plan Mode에서 먼저 분석하면 효율적일 수 있습니다.`,
      `    Plan Mode에서 탐색할까요?`
    ].join('\n');
  }

  // action === 'auto'
  return [
    `[!] Plan Mode 권장 (복잡도 점수: ${result.score}/10+)`,
    `    감지된 신호: ${reasonSummary}`,
    `    [작업] 대형 작업 감지 - Plan Mode 진입 권장`,
    `    [목적] 실행 전 탐색으로 재작업 방지 + 토큰 30~40% 절약`,
    `    [방법] Plan Mode에서 영향 분석 → 선택지 제시 → 승인 후 실행`
  ].join('\n');
}

// ============================================
// TEST SUITE
// ============================================
const TEST_CASES = [
  { input: 'README 오타 수정해줘', expect: 'direct', desc: 'Trivial: typo fix' },
  { input: '로그인 함수에 에러 핸들링 추가', expect: 'direct', desc: 'Simple: single function change' },
  { input: '이 파일에서 버그 하나 고쳐줘', expect: 'direct', desc: 'Simple: single file bug fix' },
  { input: '바로 해줘 간단한 수정이야', expect: 'direct', desc: 'Explicit direct request' },
  { input: '새 API 엔드포인트 3개 추가하고 테스트도 작성해줘', expect: 'suggest', desc: 'Medium: multi-endpoint' },
  { input: '인증 시스템을 JWT로 마이그레이션해야 합니다', expect: 'auto', desc: 'Critical: auth migration' },
  { input: '전체 프로젝트를 TypeScript로 전환', expect: 'auto', desc: 'Critical: full project migration' },
  { input: '데이터베이스 스키마 변경하고 API도 리팩토링', expect: 'auto', desc: 'Critical: DB + API refactor' },
  { input: '보안 취약점 점검하고 인증 모듈 전면 개편', expect: 'auto', desc: 'Critical: security overhaul' },
  { input: '여러 파일에 걸쳐 에러 핸들링 패턴 통일', expect: 'suggest', desc: 'Medium: cross-file pattern' }
];

function runTests() {
  console.log('========================================');
  console.log('  Complexity Detector - Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    const result = analyze(tc.input);
    const ok = result.action === tc.expect;
    const status = ok ? '[+] PASS' : '[-] FAIL';
    console.log(`${status} ${tc.desc}`);
    console.log(`       Input: "${tc.input}"`);
    console.log(`       Score: ${result.score} | Action: ${result.action} (expected: ${tc.expect})`);
    if (result.reasons.length > 0) {
      console.log(`       Signals: ${result.reasons.map(r => `${r.signal}(${r.score > 0 ? '+' : ''}${r.score})`).join(', ')}`);
    }
    const rec = getRecommendation(result, tc.input);
    if (rec) console.log(`       Recommendation:\n${rec.split('\n').map(l => '         ' + l).join('\n')}`);
    console.log('');

    if (ok) passed++;
    else failed++;
  }

  console.log('========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed / ${TEST_CASES.length} total`);
  console.log('========================================');
  return failed === 0;
}

// ============================================
// CLI INTERFACE
// ============================================
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'test') {
    const success = runTests();
    process.exit(success ? 0 : 1);
  } else if (command === 'analyze' && args[1]) {
    const input = args.slice(1).join(' ');
    const result = analyze(input);
    console.log(JSON.stringify(result, null, 2));
    const rec = getRecommendation(result, input);
    if (rec) console.log('\n' + rec);
  } else {
    console.log('Usage:');
    console.log('  node complexity-detector.js test');
    console.log('  node complexity-detector.js analyze "user input"');
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  analyze,
  getRecommendation,
  SIGNALS,
  THRESHOLDS,
  runTests
};
