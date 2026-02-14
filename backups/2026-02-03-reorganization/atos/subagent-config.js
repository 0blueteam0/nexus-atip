/**
 * Sub-agent Configuration - ACE-FCA Context Isolation
 *
 * [작업] Sub-agent 프로필 정의 및 컨텍스트 격리 설정
 * [목적] Task 에이전트를 "역할 의인화"가 아닌 "컨텍스트 격리"용으로 활용
 *
 * 핵심 원칙:
 * - 각 Sub-agent는 독립된 컨텍스트 버짓을 가짐
 * - 결과는 반드시 compaction 후 메인 컨텍스트로 반환
 * - 실패 시 graceful degradation
 */

const { getFICManager } = require('./fic-manager');

/**
 * Sub-agent 프로필 정의
 */
const SUBAGENT_PROFILES = {
  file_explorer: {
    name: 'file_explorer',
    purpose: '파일 검색용 컨텍스트 격리',
    description: '코드베이스 탐색 및 파일 검색을 위한 격리된 컨텍스트',

    // 허용 도구
    tools: [
      'Glob',
      'Grep',
      'mcp__filesystem__search_files',
      'mcp__filesystem__list_directory',
      'mcp__desktop-commander__search_files',
      'mcp__desktop-commander__search_code'
    ],

    // 컨텍스트 버짓 (전체의 15%)
    contextBudget: 0.15,

    // 압축 전략
    compactionStrategy: 'summarize_to_paths',

    // Task 에이전트 설정
    taskConfig: {
      subagent_type: 'Explore',
      model: 'haiku',  // 빠른 탐색용
      thoroughness: 'medium'
    }
  },

  code_analyzer: {
    name: 'code_analyzer',
    purpose: '코드 분석용 컨텍스트 격리',
    description: '깊은 코드 분석 및 아키텍처 이해를 위한 격리된 컨텍스트',

    tools: [
      'Read',
      'Grep',
      'mcp__sequential-thinking__sequentialthinking',
      'mcp__filesystem__read_text_file',
      'mcp__desktop-commander__read_file'
    ],

    contextBudget: 0.20,
    compactionStrategy: 'extract_signatures',

    taskConfig: {
      subagent_type: 'Explore',
      model: 'sonnet',  // 분석용
      thoroughness: 'very thorough'
    }
  },

  reference_lookup: {
    name: 'reference_lookup',
    purpose: '외부 참조 검색용 컨텍스트 격리',
    description: '웹 검색 및 문서 조회를 위한 격리된 컨텍스트',

    tools: [
      'WebSearch',
      'WebFetch',
      'mcp__firecrawl__firecrawl_search',
      'mcp__firecrawl__firecrawl_scrape',
      'mcp__context7__resolve-library-id',
      'mcp__context7__get-library-docs',
      'mcp__one-search__one_search'
    ],

    contextBudget: 0.15,
    compactionStrategy: 'extract_key_points',

    taskConfig: {
      subagent_type: 'general-purpose',
      model: 'haiku'
    }
  },

  test_runner: {
    name: 'test_runner',
    purpose: '테스트 실행용 컨텍스트 격리',
    description: '테스트 및 빌드 실행을 위한 격리된 컨텍스트',

    tools: [
      'Bash',
      'mcp__desktop-commander__start_process',
      'mcp__desktop-commander__read_process_output',
      'mcp__desktop-commander__interact_with_process'
    ],

    contextBudget: 0.10,
    compactionStrategy: 'failures_only',

    taskConfig: {
      subagent_type: 'general-purpose',
      model: 'haiku'
    }
  },

  research_agent: {
    name: 'research_agent',
    purpose: '딥 리서치용 컨텍스트 격리',
    description: '학술 논문 및 기술 문서 심층 조사를 위한 격리된 컨텍스트',

    tools: [
      'mcp__firecrawl__firecrawl_search',
      'mcp__firecrawl__firecrawl_scrape',
      'mcp__paper-search-mcp__search_arxiv',
      'mcp__paper-search-mcp__search_semantic',
      'mcp__paper-search-mcp__read_arxiv_paper',
      'mcp__one-search__one_search',
      'mcp__sequential-thinking__sequentialthinking'
    ],

    contextBudget: 0.25,
    compactionStrategy: 'extract_key_points',

    taskConfig: {
      subagent_type: 'general-purpose',
      model: 'sonnet'
    }
  }
};

/**
 * Compaction 전략 구현
 */
const COMPACTION_STRATEGIES = {
  /**
   * 파일 경로만 추출
   */
  summarize_to_paths: (results, fic) => {
    return fic.compact(results, 'file_search_results');
  },

  /**
   * 함수/클래스 시그니처만 추출
   */
  extract_signatures: (code, fic) => {
    if (typeof code !== 'string') {
      return fic.compact(code, 'code_flow_traces');
    }

    // 함수/클래스 시그니처 추출
    const signatures = [];
    const patterns = [
      /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/gm,
      /^(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?/gm,
      /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/gm,
      /^\s*(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/gm
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        signatures.push(match[0].trim());
      }
    }

    return signatures.length > 0 ? signatures : code.substring(0, 500);
  },

  /**
   * 핵심 포인트만 추출
   */
  extract_key_points: (content, fic) => {
    if (typeof content === 'string') {
      // 제목, 핵심 문장 추출
      const lines = content.split('\n');
      const keyPoints = lines.filter(line => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith('#') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('*') ||
          trimmed.includes(':') ||
          trimmed.length > 50 && trimmed.length < 200
        );
      }).slice(0, 20);

      return keyPoints.join('\n');
    }

    return fic.compact(content, 'large_json_blobs');
  },

  /**
   * 실패 로그만 추출
   */
  failures_only: (logs, fic) => {
    return fic.compact(logs, 'test_build_logs');
  }
};

/**
 * Sub-agent Manager
 */
class SubagentManager {
  constructor() {
    this.fic = getFICManager();
    this.profiles = SUBAGENT_PROFILES;
    this.strategies = COMPACTION_STRATEGIES;
    this.activeAgents = new Map();
  }

  /**
   * 프로필 조회
   */
  getProfile(name) {
    return this.profiles[name] || null;
  }

  /**
   * 모든 프로필 조회
   */
  getAllProfiles() {
    return { ...this.profiles };
  }

  /**
   * Sub-agent 실행을 위한 Task 프롬프트 생성
   */
  createTaskPrompt(profileName, objective, context = {}) {
    const profile = this.getProfile(profileName);
    if (!profile) {
      throw new Error(`Unknown sub-agent profile: ${profileName}`);
    }

    const prompt = `
[Sub-agent: ${profile.name}]
[Purpose]: ${profile.purpose}
[Context Budget]: ${profile.contextBudget * 100}%

## Objective
${objective}

## Constraints
- Only use the following tools: ${profile.tools.join(', ')}
- Keep results concise - will be compacted using "${profile.compactionStrategy}" strategy
- Focus on actionable information only

## Context
${JSON.stringify(context, null, 2)}

## Output Requirements
Return structured results that can be easily compacted.
Prioritize relevance over completeness.
    `.trim();

    return {
      prompt,
      config: profile.taskConfig
    };
  }

  /**
   * Sub-agent 결과 압축
   */
  compactResults(profileName, results) {
    const profile = this.getProfile(profileName);
    if (!profile) {
      return results;
    }

    const strategy = this.strategies[profile.compactionStrategy];
    if (!strategy) {
      console.warn(`[Subagent] Unknown compaction strategy: ${profile.compactionStrategy}`);
      return results;
    }

    return strategy(results, this.fic);
  }

  /**
   * 컨텍스트 버짓 확인
   */
  checkBudget(profileName, currentUsage, maxCapacity) {
    const profile = this.getProfile(profileName);
    if (!profile) {
      return { withinBudget: false, message: 'Unknown profile' };
    }

    const allowedUsage = maxCapacity * profile.contextBudget;
    const withinBudget = currentUsage <= allowedUsage;

    return {
      withinBudget,
      currentUsage,
      allowedUsage,
      budgetPercent: profile.contextBudget,
      message: withinBudget
        ? `Within budget: ${currentUsage}/${allowedUsage}`
        : `Exceeded budget: ${currentUsage}/${allowedUsage} - compaction required`
    };
  }

  /**
   * 작업 유형에 따른 최적 프로필 추천
   */
  recommendProfile(taskType) {
    const recommendations = {
      'file_search': 'file_explorer',
      'code_search': 'file_explorer',
      'find_file': 'file_explorer',
      'analyze_code': 'code_analyzer',
      'understand_architecture': 'code_analyzer',
      'review_code': 'code_analyzer',
      'web_search': 'reference_lookup',
      'documentation': 'reference_lookup',
      'library_docs': 'reference_lookup',
      'run_tests': 'test_runner',
      'build': 'test_runner',
      'execute': 'test_runner',
      'research': 'research_agent',
      'paper': 'research_agent',
      'deep_dive': 'research_agent'
    };

    const taskLower = taskType.toLowerCase();

    for (const [keyword, profile] of Object.entries(recommendations)) {
      if (taskLower.includes(keyword)) {
        return this.getProfile(profile);
      }
    }

    // 기본값
    return this.getProfile('file_explorer');
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return {
      profiles: Object.keys(this.profiles),
      strategies: Object.keys(this.strategies),
      activeAgents: Array.from(this.activeAgents.keys()),
      ficStats: this.fic.getStats()
    };
  }
}

// Singleton instance
let instance = null;

function getSubagentManager() {
  if (!instance) {
    instance = new SubagentManager();
  }
  return instance;
}

module.exports = {
  SUBAGENT_PROFILES,
  COMPACTION_STRATEGIES,
  SubagentManager,
  getSubagentManager
};
