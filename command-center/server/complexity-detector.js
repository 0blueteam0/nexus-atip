/**
 * Complexity Detector (Observer Port)
 *
 * Ported from: atos/complexity-detector.js
 * Analyzes user input complexity to help UI show Plan Mode recommendations.
 *
 * Scoring: 0-4 Direct | 5-7 Suggest | 8+ Auto-recommend
 */

const SIGNALS = {
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

const THRESHOLDS = {
  direct: { max: 4, action: 'direct' },
  suggest: { min: 5, max: 7, action: 'suggest' },
  auto: { min: 8, action: 'auto' }
};

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
  return Math.min(count, 20);
}

function analyze(input) {
  if (!input || typeof input !== 'string') {
    return { score: 0, level: 'trivial_or_simple', action: 'direct', reasons: [], fileCount: 0 };
  }

  let totalScore = 0;
  const reasons = [];

  for (const [key, signal] of Object.entries(SIGNALS)) {
    for (const pattern of signal.patterns) {
      if (pattern.test(input)) {
        totalScore += signal.score;
        reasons.push({ signal: signal.label, score: signal.score });
        break;
      }
    }
  }

  const fileCount = countFileReferences(input);
  if (fileCount >= 5) {
    totalScore += 3;
    reasons.push({ signal: 'many_files_referenced', score: 3 });
  } else if (fileCount >= 3) {
    totalScore += 2;
    reasons.push({ signal: 'some_files_referenced', score: 2 });
  }

  if (input.length > 500) {
    totalScore += 1;
    reasons.push({ signal: 'long_input', score: 1 });
  }

  totalScore = Math.max(0, totalScore);

  let action, level;
  if (totalScore <= THRESHOLDS.direct.max) {
    action = 'direct';
    level = 'trivial_or_simple';
  } else if (totalScore <= THRESHOLDS.suggest.max) {
    action = 'suggest';
    level = 'medium';
  } else {
    action = 'auto';
    level = 'complex_or_critical';
  }

  return { score: totalScore, level, action, reasons, fileCount };
}

module.exports = { analyze, SIGNALS, THRESHOLDS };
