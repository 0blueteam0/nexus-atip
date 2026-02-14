/**
 * ATOS Context Analyzer
 * 사용자 입력에서 의도(Intent)와 엔티티(Entities)를 추출
 *
 * 위치: K:/PortableApps/genai/atos/context-analyzer.js
 *
 * 기능:
 * - 사용자 입력 분석
 * - 의도(Intent) 추출: research, development, file_operation, web_search 등
 * - 엔티티(Entities) 추출: URL, 파일 경로, 키워드 등
 * - tool-registry.json과 매칭하여 관련 도구 식별
 *
 * Anthropic 패턴 적용:
 * - Tool Search Tool: 필요한 도구만 동적 로드
 * - Namespacing: 카테고리 기반 분류
 */

const fs = require('fs');
const path = require('path');

// LoadTracker 로드 (STL 중복 방지)
let loadTracker = null;
try {
  const { tracker } = require('./load-tracker');
  loadTracker = tracker;
} catch (err) {
  console.warn('[!] LoadTracker 로드 실패 - 중복 방지 비활성화');
}

// 경로 설정
const BASE_PATH = path.resolve(__dirname);
const TOOL_REGISTRY_FILE = path.join(BASE_PATH, 'tool-registry.json');
const USAGE_STATS_FILE = path.join(BASE_PATH, 'usage-stats.json');
const UNIFIED_TRIGGERS_FILE = path.join(BASE_PATH, 'unified-triggers.json');
const RULE_INDEX_FILE = path.join(BASE_PATH, '..', '.claude', 'rules', 'rule-index.json');

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
    console.error(`[!] 파일 읽기 실패 (${path.basename(filePath)}):`, error.message);
  }
  return defaultValue;
}

// ============================================
// STL (Self-Triggered Loading) 지원
// ============================================

let unifiedTriggersCache = null;
let unifiedTriggersCacheMtime = null;  // 캐시 무효화용 mtime 추적

// 규칙 인덱스 캐시 (On-Demand Rules)
let ruleIndexCache = null;
let ruleIndexCacheMtime = null;

/**
 * 파일의 수정 시간(mtime) 가져오기
 * @param {string} filePath - 파일 경로
 * @returns {number|null} mtime (밀리초) 또는 null
 */
function getFileMtime(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.mtimeMs;
    }
  } catch (err) {
    // 파일 접근 오류 무시
  }
  return null;
}

/**
 * 통합 트리거 파일 로드 (mtime 기반 자동 캐시 무효화)
 * @returns {Object} 통합 트리거 데이터
 */
function loadUnifiedTriggers() {
  const currentMtime = getFileMtime(UNIFIED_TRIGGERS_FILE);

  // 캐시 유효성 검사: mtime이 변경되면 캐시 무효화
  if (unifiedTriggersCache && unifiedTriggersCacheMtime === currentMtime) {
    return unifiedTriggersCache;
  }

  // 캐시 갱신
  unifiedTriggersCacheMtime = currentMtime;
  unifiedTriggersCache = safeReadJSON(UNIFIED_TRIGGERS_FILE, {
    commands: {},
    tools: {},
    skills: {},
    memory: {}
  });
  return unifiedTriggersCache;
}

/**
 * 트리거 캐시 초기화 (테스트/리로드용)
 */
function clearUnifiedTriggersCache() {
  unifiedTriggersCache = null;
  unifiedTriggersCacheMtime = null;
}

/**
 * rule-index.json 로드 (mtime 기반 캐시)
 * @returns {object} Rule index data
 */
function loadRuleIndex() {
  const RULE_INDEX_PATH = path.join(__dirname, '..', '.claude', 'rules', 'rule-index.json');

  try {
    const stat = fs.statSync(RULE_INDEX_PATH);
    const currentMtime = stat.mtimeMs;

    // 캐시 유효성 확인
    if (ruleIndexCache && ruleIndexCacheMtime === currentMtime) {
      return ruleIndexCache;
    }

    // 캐시 갱신
    const data = JSON.parse(fs.readFileSync(RULE_INDEX_PATH, 'utf8'));
    ruleIndexCache = data;
    ruleIndexCacheMtime = currentMtime;
    return ruleIndexCache;
  } catch (err) {
    console.error('[ContextAnalyzer] rule-index.json load failed:', err.message);
    return { rules: {} };
  }
}

/**
 * Rule index 캐시 초기화 (테스트/리로드용)
 */
function clearRuleIndexCache() {
  ruleIndexCache = null;
  ruleIndexCacheMtime = null;
}

/**
 * 텍스트에서 규칙 트리거 분석
 * @param {string} text - 분석할 텍스트
 * @returns {Array} 매칭된 규칙 목록 [{name, path, triggers}]
 */
function analyzeRuleTriggers(text) {
  if (!text || typeof text !== 'string') return [];

  const ruleIndex = loadRuleIndex();
  const matchedRules = [];
  const lowerText = text.toLowerCase();

  for (const [ruleName, ruleInfo] of Object.entries(ruleIndex.rules || {})) {
    // alwaysApply: true인 규칙은 스킵 (항상 로드됨)
    if (ruleInfo.alwaysApply) continue;

    // 트리거 키워드 매칭
    const triggers = ruleInfo.triggers || [];
    const matched = triggers.some(trigger =>
      lowerText.includes(trigger.toLowerCase())
    );

    if (matched) {
      matchedRules.push({
        name: ruleName,
        path: ruleInfo.path,
        triggers: triggers.filter(t => lowerText.includes(t.toLowerCase()))
      });
    }
  }

  return matchedRules;
}

/**
 * 모든 텍스트에서 키워드 감지 (STL 핵심 함수)
 * - 사용자 입력뿐만 아니라 Claude 자체 출력에서도 키워드 감지
 *
 * @param {string} text - 분석할 텍스트
 * @param {string} source - 텍스트 출처 ('user' | 'claude_plan' | 'claude_impl' | 'claude_exec')
 * @returns {Array} 매칭된 트리거 목록
 */
function analyzeAnyText(text, source = 'user') {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const triggers = loadUnifiedTriggers();
  const matches = [];
  const seenTargets = new Set();
  const metadataKeys = ['$schema', 'version', 'lastUpdated', 'description'];

  for (const [category, patterns] of Object.entries(triggers)) {
    // 메타데이터 키 스킵
    if (metadataKeys.includes(category)) continue;
    if (typeof patterns !== 'object') continue;

    for (const [pattern, config] of Object.entries(patterns)) {
      try {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(text)) {
          // 중복 방지 (같은 타겟은 한 번만)
          const targetKey = `${category}:${config.target}`;
          if (seenTargets.has(targetKey)) continue;
          seenTargets.add(targetKey);

          // STL: LoadTracker로 세션 내 중복 로드 방지
          if (loadTracker) {
            if (loadTracker.isLoaded(targetKey)) {
              // 이미 로드된 리소스는 스킵 (중복 방지)
              continue;
            }
            // 새 리소스로 마킹
            loadTracker.markLoaded(targetKey, config.type || category, source);
          }

          matches.push({
            pattern,
            category,
            type: config.type,
            target: config.target,
            location: config.location || null,
            action: config.action,
            priority: config.priority || 5,
            source,
            timestamp: Date.now()
          });
        }
      } catch (regexError) {
        console.warn(`[!] Invalid regex pattern: ${pattern}`);
      }
    }
  }

  // 우선순위 순 정렬 (낮을수록 높은 우선순위)
  matches.sort((a, b) => a.priority - b.priority);
  return matches;
}

/**
 * Intent 정의 (의도 분류)
 */
const INTENT_PATTERNS = {
  // 연구/조사
  research: {
    keywords: ['연구', '조사', '분석', '찾아', '검색', '알아봐', 'research', 'analyze', 'find', 'search', 'investigate'],
    priority: 'high',
    suggestedCategories: ['web', 'search', 'data']
  },

  // 파일 작업
  file_operation: {
    keywords: ['파일', '작성', '수정', '읽기', '생성', '삭제', 'file', 'write', 'read', 'create', 'edit', 'delete'],
    priority: 'high',
    suggestedCategories: ['filesystem']
  },

  // 웹 스크래핑/크롤링
  web_scraping: {
    keywords: ['크롤링', '스크래핑', '웹페이지', '사이트', 'scrape', 'crawl', 'webpage', 'URL', 'http'],
    priority: 'medium',
    suggestedCategories: ['web', 'scraping']
  },

  // 개발/코딩
  development: {
    keywords: ['개발', '코딩', '구현', '빌드', '테스트', 'develop', 'code', 'implement', 'build', 'test', 'debug'],
    priority: 'high',
    suggestedCategories: ['development', 'automation']
  },

  // Git 작업
  git_operation: {
    keywords: ['git', 'commit', 'push', 'pull', 'branch', 'merge', '커밋', '푸시', '브랜치'],
    priority: 'medium',
    suggestedCategories: ['development', 'git']
  },

  // GitHub 작업
  github_operation: {
    keywords: ['github', 'PR', 'pull request', 'issue', '이슈', '풀리퀘스트', 'repository', '레포'],
    priority: 'medium',
    suggestedCategories: ['development', 'github']
  },

  // 데이터베이스
  database: {
    keywords: ['데이터베이스', 'DB', 'SQL', 'SQLite', '쿼리', 'query', 'database', 'table'],
    priority: 'medium',
    suggestedCategories: ['data', 'database']
  },

  // 시각화/차트
  visualization: {
    keywords: ['차트', '그래프', '시각화', '도표', 'chart', 'graph', 'visualization', 'plot'],
    priority: 'medium',
    suggestedCategories: ['visualization']
  },

  // 브라우저 자동화
  browser_automation: {
    keywords: ['브라우저', '자동화', '스크린샷', 'playwright', 'browser', 'automation', 'screenshot', 'click'],
    priority: 'medium',
    suggestedCategories: ['automation', 'browser']
  },

  // 작업 관리
  task_management: {
    keywords: ['작업', '태스크', '할일', 'todo', 'task', '계획', 'plan', '진행상황', 'status'],
    priority: 'high',
    suggestedCategories: ['task', 'planning']
  },

  // 메모리/저장
  memory: {
    keywords: ['메모리', '저장', '기억', '불러와', 'memory', 'save', 'remember', 'recall', 'context'],
    priority: 'medium',
    suggestedCategories: ['storage', 'memory']
  },

  // 문서 분석 (PDF/이미지)
  document_analysis: {
    keywords: ['PDF', '문서', 'OCR', '이미지', '텍스트 추출', 'document', 'extract', 'image'],
    priority: 'medium',
    suggestedCategories: ['document', 'ocr']
  },

  // 워크플로우 실행
  workflow: {
    keywords: ['워크플로우', '자동화', '프로세스', 'workflow', 'automate', 'process', 'n8n'],
    priority: 'medium',
    suggestedCategories: ['workflow', 'automation']
  },

  // YouTube 분석
  youtube: {
    keywords: ['유튜브', 'youtube', '영상', '비디오', 'video', '채널', 'channel', '트랜스크립트'],
    priority: 'low',
    suggestedCategories: ['media', 'youtube']
  },

  // AI/LLM 관련
  ai_llm: {
    keywords: ['AI', 'LLM', '모델', 'GPT', 'Claude', '추론', 'inference', 'council'],
    priority: 'medium',
    suggestedCategories: ['ai', 'llm']
  },

  // 지도/위치
  mapping: {
    keywords: ['지도', '위치', '경로', 'map', 'location', 'route', 'GPS'],
    priority: 'low',
    suggestedCategories: ['visualization', 'map']
  }
};

/**
 * Entity 추출 패턴
 */
const ENTITY_PATTERNS = {
  url: /https?:\/\/[^\s]+/gi,
  file_path: /[A-Za-z]:[\\\/][^\s]+|\.\/[^\s]+|~\/[^\s]+/gi,
  github_repo: /github\.com\/[\w-]+\/[\w-]+/gi,
  json_path: /[\w-]+\.json/gi,
  js_file: /[\w-]+\.js/gi,
  python_file: /[\w-]+\.py/gi,
  markdown_file: /[\w-]+\.md/gi,
  email: /[\w.-]+@[\w.-]+\.\w+/gi,
  ip_address: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi,
  korean_keywords: /[가-힣]{2,}/g
};

/**
 * ContextAnalyzer 클래스
 */
class ContextAnalyzer {
  constructor() {
    this.registry = safeReadJSON(TOOL_REGISTRY_FILE, { mcpServers: {}, skills: {}, workflows: {} });
    this.usageStats = safeReadJSON(USAGE_STATS_FILE, { tools: {}, patterns: {} });
  }

  /**
   * 메인 분석 함수
   * @param {string} userInput - 사용자 입력 텍스트
   * @returns {object} 분석 결과 (intents, entities, suggestedTools)
   */
  analyze(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      return {
        success: false,
        error: 'Invalid input',
        intents: [],
        entities: {},
        suggestedTools: [],
        suggestedCategories: []
      };
    }

    const normalizedInput = userInput.toLowerCase();

    // 1. Intent 분석
    const intents = this.extractIntents(normalizedInput);

    // 2. Entity 추출
    const entities = this.extractEntities(userInput);

    // 3. 카테고리 추천
    const suggestedCategories = this.getSuggestedCategories(intents);

    // 4. 도구 매칭
    const suggestedTools = this.matchTools(normalizedInput, intents, suggestedCategories);

    // 5. 워크플로우 매칭
    const suggestedWorkflows = this.matchWorkflows(normalizedInput, intents);

    // 6. 스킬 매칭
    const suggestedSkills = this.matchSkills(normalizedInput, intents);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      input: userInput,
      intents: intents,
      entities: entities,
      suggestedCategories: suggestedCategories,
      suggestedTools: suggestedTools,
      suggestedWorkflows: suggestedWorkflows,
      suggestedSkills: suggestedSkills,
      confidence: this.calculateConfidence(intents, suggestedTools)
    };
  }

  /**
   * Intent 추출
   */
  extractIntents(input) {
    const matchedIntents = [];

    for (const [intentName, intentData] of Object.entries(INTENT_PATTERNS)) {
      const matchCount = intentData.keywords.filter(kw => input.includes(kw.toLowerCase())).length;

      if (matchCount > 0) {
        matchedIntents.push({
          intent: intentName,
          confidence: Math.min(matchCount / intentData.keywords.length + 0.3, 1.0),
          priority: intentData.priority,
          matchedKeywords: intentData.keywords.filter(kw => input.includes(kw.toLowerCase()))
        });
      }
    }

    // 신뢰도 순으로 정렬
    return matchedIntents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Entity 추출
   */
  extractEntities(input) {
    const entities = {};

    for (const [entityType, pattern] of Object.entries(ENTITY_PATTERNS)) {
      const matches = input.match(pattern);
      if (matches && matches.length > 0) {
        entities[entityType] = [...new Set(matches)]; // 중복 제거
      }
    }

    return entities;
  }

  /**
   * 추천 카테고리 생성
   */
  getSuggestedCategories(intents) {
    const categories = new Set();

    for (const intent of intents) {
      const intentData = INTENT_PATTERNS[intent.intent];
      if (intentData && intentData.suggestedCategories) {
        intentData.suggestedCategories.forEach(cat => categories.add(cat));
      }
    }

    return Array.from(categories);
  }

  /**
   * 도구 매칭
   */
  matchTools(input, intents, suggestedCategories) {
    const matchedTools = [];
    const servers = this.registry.mcpServers || {};

    for (const [serverName, serverData] of Object.entries(servers)) {
      let score = 0;
      const matchReasons = [];

      // 1. 트리거 키워드 매칭
      if (serverData.triggerKeywords) {
        const keywordMatches = serverData.triggerKeywords.filter(
          kw => input.includes(kw.toLowerCase())
        );
        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 0.3;
          matchReasons.push(`keywords: ${keywordMatches.join(', ')}`);
        }
      }

      // 2. 카테고리 매칭
      if (serverData.category && suggestedCategories.includes(serverData.category)) {
        score += 0.2;
        matchReasons.push(`category: ${serverData.category}`);
      }

      // 3. input_examples 매칭 (Anthropic 패턴)
      if (serverData.input_examples) {
        for (const example of serverData.input_examples) {
          if (input.includes(example.input.toLowerCase())) {
            score += 0.4;
            matchReasons.push(`example_match: "${example.input}"`);
            break;
          }
        }
      }

      // 4. 우선순위 보너스
      if (serverData.priority === 'high') {
        score += 0.1;
      }

      if (score > 0) {
        matchedTools.push({
          server: serverName,
          tools: serverData.tools || [],
          category: serverData.category,
          score: Math.min(score, 1.0),
          matchReasons: matchReasons,
          defer_loading: serverData.defer_loading !== false
        });
      }
    }

    // 점수 순 정렬
    return matchedTools.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * 워크플로우 매칭
   */
  matchWorkflows(input, intents) {
    const matchedWorkflows = [];
    const workflows = this.registry.workflows || {};

    for (const [workflowName, workflowData] of Object.entries(workflows)) {
      if (workflowData.triggers) {
        const matches = workflowData.triggers.filter(t => input.includes(t.toLowerCase()));
        if (matches.length > 0) {
          matchedWorkflows.push({
            workflow: workflowName,
            description: workflowData.description,
            score: matches.length * 0.3,
            matchedTriggers: matches
          });
        }
      }
    }

    return matchedWorkflows.sort((a, b) => b.score - a.score);
  }

  /**
   * 스킬 매칭
   */
  matchSkills(input, intents) {
    const matchedSkills = [];
    const skills = this.registry.skills || {};

    for (const [skillName, skillData] of Object.entries(skills)) {
      if (skillData.triggers) {
        const matches = skillData.triggers.filter(t => input.includes(t.toLowerCase()));
        if (matches.length > 0) {
          matchedSkills.push({
            skill: skillName,
            description: skillData.description,
            score: matches.length * 0.3,
            matchedTriggers: matches,
            autoActivate: skillData.autoActivate || false
          });
        }
      }
    }

    return matchedSkills.sort((a, b) => b.score - a.score);
  }

  /**
   * 전체 신뢰도 계산
   */
  calculateConfidence(intents, tools) {
    if (intents.length === 0) return 0;

    const intentConfidence = intents.reduce((sum, i) => sum + i.confidence, 0) / intents.length;
    const toolConfidence = tools.length > 0 ? Math.min(tools.length * 0.2, 0.5) : 0;

    return Math.min(intentConfidence + toolConfidence, 1.0);
  }

  /**
   * Tool Search Tool 패턴 구현
   * 특정 capability로 도구 검색
   */
  searchToolsByCapability(capability) {
    const results = [];
    const servers = this.registry.mcpServers || {};

    for (const [serverName, serverData] of Object.entries(servers)) {
      // 카테고리 또는 키워드로 매칭
      if (serverData.category === capability ||
          (serverData.triggerKeywords && serverData.triggerKeywords.includes(capability))) {
        results.push({
          server: serverName,
          category: serverData.category,
          tools: serverData.tools,
          defer_loading: serverData.defer_loading
        });
      }
    }

    return results;
  }

  /**
   * 카테고리별 도구 조회
   */
  getToolsByCategory(category) {
    const tools = [];
    const categories = this.registry.categories || {};

    if (categories[category]) {
      const servers = this.registry.mcpServers || {};
      for (const serverName of categories[category].servers || []) {
        if (servers[serverName]) {
          tools.push({
            server: serverName,
            ...servers[serverName]
          });
        }
      }
    }

    return tools;
  }
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const analyzer = new ContextAnalyzer();

  switch (command) {
    case 'analyze':
      if (args[1]) {
        const input = args.slice(1).join(' ');
        const result = analyzer.analyze(input);
        console.log('\n--- 컨텍스트 분석 결과 ---\n');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('사용법: node context-analyzer.js analyze "분석할 텍스트"');
      }
      break;

    case 'search':
      if (args[1]) {
        const results = analyzer.searchToolsByCapability(args[1]);
        console.log(`\n--- "${args[1]}" capability 검색 결과 ---\n`);
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log('사용법: node context-analyzer.js search [capability]');
      }
      break;

    case 'category':
      if (args[1]) {
        const tools = analyzer.getToolsByCategory(args[1]);
        console.log(`\n--- "${args[1]}" 카테고리 도구 ---\n`);
        console.log(JSON.stringify(tools, null, 2));
      } else {
        console.log('사용법: node context-analyzer.js category [category_name]');
      }
      break;

    case 'test':
      // 테스트 케이스 실행
      const testCases = [
        '파일 작성해줘',
        'AI 보안 최신 동향 연구해줘',
        'https://github.com/example/repo 분석해줘',
        '차트 그려줘',
        'Git commit 하고 push 해줘'
      ];

      console.log('\n--- ATOS Context Analyzer 테스트 ---\n');
      for (const testCase of testCases) {
        console.log(`\n입력: "${testCase}"`);
        const result = analyzer.analyze(testCase);
        console.log(`의도: ${result.intents.map(i => `${i.intent}(${i.confidence.toFixed(2)})`).join(', ')}`);
        console.log(`추천 도구: ${result.suggestedTools.map(t => t.server).join(', ')}`);
        console.log(`신뢰도: ${result.confidence.toFixed(2)}`);
      }
      break;

    default:
      console.log('ATOS Context Analyzer - 사용자 입력 분석');
      console.log('');
      console.log('사용법:');
      console.log('  node context-analyzer.js analyze "텍스트"  입력 텍스트 분석');
      console.log('  node context-analyzer.js search [cap]     capability로 도구 검색');
      console.log('  node context-analyzer.js category [cat]   카테고리별 도구 조회');
      console.log('  node context-analyzer.js test             테스트 케이스 실행');
      console.log('');
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  ContextAnalyzer,
  INTENT_PATTERNS,
  ENTITY_PATTERNS,
  safeReadJSON,
  // STL 관련 함수 내보내기
  analyzeAnyText,
  clearUnifiedTriggersCache,
  // Rule 트리거 관련 함수
  loadRuleIndex,
  clearRuleIndexCache,
  analyzeRuleTriggers
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}
