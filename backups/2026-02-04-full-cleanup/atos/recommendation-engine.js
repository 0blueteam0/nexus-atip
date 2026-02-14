/**
 * ATOS Recommendation Engine
 * Context 분석 결과 + 사용 통계 기반 도구 추천 엔진
 *
 * 위치: K:/PortableApps/genai/atos/recommendation-engine.js
 *
 * 기능:
 * - ContextAnalyzer 분석 결과 기반 추천
 * - 사용 통계 기반 가중치 적용
 * - 체이닝 패턴 기반 다음 도구 제안
 * - 워크플로우/스킬 매칭
 * - Anthropic 패턴 적용 (concise/detailed 모드)
 *
 * 사용법:
 *   const engine = require('./recommendation-engine.js');
 *   const result = engine.recommend(userInput);
 *   const chained = engine.suggestNextTool(currentTool, context);
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const BASE_PATH = path.resolve(__dirname);
const TOOL_REGISTRY_FILE = path.join(BASE_PATH, 'tool-registry.json');
const USAGE_STATS_FILE = path.join(BASE_PATH, 'usage-stats.json');
const MEMORY_CONFIG_FILE = path.join(BASE_PATH, 'config', 'memory-config.json');

// ContextAnalyzer 로드
let ContextAnalyzer;
try {
  ContextAnalyzer = require('./context-analyzer.js').ContextAnalyzer;
} catch (e) {
  console.error('[!] context-analyzer.js 로드 실패:', e.message);
}

// PlanExecutor 로드 (Planning-ATOS Bridge)
let PlanExecutor;
try {
  PlanExecutor = require('./plan-executor.js');
} catch (e) {
  console.error('[!] plan-executor.js 로드 실패:', e.message);
}

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

/**
 * 파일 안전하게 쓰기
 */
function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] 파일 쓰기 실패:`, error.message);
    return false;
  }
}

// ============================================
// 추천 점수 계산 가중치
// ============================================

const WEIGHTS = {
  // 기본 가중치
  intentMatch: 0.25,        // 의도 매칭 (0.30 → 0.25)
  keywordMatch: 0.15,       // 키워드 매칭 (0.20 → 0.15)
  priorityBonus: 0.10,      // 우선순위 보너스

  // 통계 기반 가중치
  successRate: 0.10,        // 성공률
  usageFrequency: 0.05,     // 사용 빈도
  recentUsage: 0.05,        // 최근 사용 보너스

  // 패턴 기반 가중치
  patternMatch: 0.05,       // 체이닝 패턴 매칭

  // [RESTORED] Context Detection 가중치
  contextBoost: 0.10,       // 키워드 기반 컨텍스트 부스트 (0.15 → 0.10)

  // [NEW] Plan Phase 가중치 (Planning-ATOS Bridge)
  planPhaseBoost: 0.15      // 플랜 단계 기반 부스트
};

// ============================================
// [RESTORED] Context Detection (이전 Hook 기능 복원)
// 원본: .claude-hooks.json.disabled > context-detection
// 목적: 키워드 기반 도구 자동 추천
// ============================================

const CONTEXT_TRIGGERS = {
  // Git/GitHub 관련
  'git': ['git-mcp', 'github'],
  'github': ['github', 'git-mcp'],
  'commit': ['git-mcp'],
  'branch': ['git-mcp'],
  'pull request': ['github'],
  'pr': ['github'],

  // 검색/조사 관련
  'search': ['firecrawl', 'one-search', 'websearch'],
  'find': ['firecrawl', 'one-search'],
  'research': ['firecrawl', 'paper-search-mcp', 'one-search'],
  '검색': ['firecrawl', 'one-search', 'websearch'],
  '찾아': ['firecrawl', 'one-search'],
  '조사': ['firecrawl', 'paper-search-mcp'],

  // 비교/분석 관련
  'diff': ['git-mcp'],
  'compare': ['git-mcp', 'desktop-commander'],
  '비교': ['git-mcp', 'desktop-commander'],

  // 미디어 관련
  'youtube': ['youtube-data'],
  'video': ['youtube-data'],
  '유튜브': ['youtube-data'],
  '영상': ['youtube-data'],

  // 데이터베이스 관련
  'database': ['sqlite-mcp'],
  'sql': ['sqlite-mcp'],
  '데이터베이스': ['sqlite-mcp'],

  // 시각화 관련
  'chart': ['antv-chart'],
  'graph': ['antv-chart'],
  '차트': ['antv-chart'],
  '그래프': ['antv-chart'],
  '시각화': ['antv-chart'],

  // 파일 관련
  'file': ['desktop-commander', 'filesystem'],
  'read': ['desktop-commander', 'filesystem'],
  'write': ['desktop-commander', 'filesystem'],
  '파일': ['desktop-commander', 'filesystem'],

  // PDF/문서 관련
  'pdf': ['marker-mcp'],
  'ocr': ['paddleocr-mcp'],
  '문서': ['marker-mcp'],

  // 논문 관련
  'paper': ['paper-search-mcp'],
  'arxiv': ['paper-search-mcp'],
  '논문': ['paper-search-mcp']
};

// ============================================
// [RESTORED] Important Keyword Detection (이전 Hook 기능 복원)
// 원본: .claude-hooks.json.disabled > important-detection
// 목적: 중요 키워드 감지 시 자동 저장 트리거
// ============================================

const IMPORTANT_KEYWORDS_KR = [
  '결정', '해결', '성공', '완료', '중요',
  '확정', '마무리', '끝', '종료', '최종'
];

const IMPORTANT_KEYWORDS_EN = [
  'decided', 'resolved', 'success', 'completed', 'important',
  'finalized', 'done', 'finished', 'final', 'critical'
];

// ============================================
// RecommendationEngine 클래스
// ============================================

class RecommendationEngine {
  constructor() {
    this.toolRegistry = safeReadJSON(TOOL_REGISTRY_FILE, { mcpServers: {}, skills: {}, workflows: {} });
    this.usageStats = safeReadJSON(USAGE_STATS_FILE, { tools: {}, patterns: {}, chainingPatterns: { patterns: [] } });
    this.contextAnalyzer = ContextAnalyzer ? new ContextAnalyzer() : null;

    // [NEW] PlanExecutor 인스턴스 (Planning-ATOS Bridge)
    this.planExecutor = PlanExecutor ? new PlanExecutor() : null;

    // [RESTORED] Memory Config 로드 (이전 Hook 설정 복원)
    this.memoryConfig = safeReadJSON(MEMORY_CONFIG_FILE, {
      'memory-config': {
        'auto-save': true,
        'cleanup-days': -1,
        'storage': { 'primary': 'kiro-memory' }
      }
    });
  }

  /**
   * 레지스트리 리로드
   */
  reload() {
    this.toolRegistry = safeReadJSON(TOOL_REGISTRY_FILE, { mcpServers: {}, skills: {}, workflows: {} });
    this.usageStats = safeReadJSON(USAGE_STATS_FILE, { tools: {}, patterns: {}, chainingPatterns: { patterns: [] } });
  }

  // ============================================
  // [RESTORED] Context Detection Methods
  // 이전 Hook 기능 복원: context-detection, important-detection
  // ============================================

  /**
   * 컨텍스트 감지 (이전 context-detection Hook 기능)
   * 키워드 기반으로 사용할 도구를 자동 추천
   * @param {string} userInput - 사용자 입력
   * @returns {object} { detected: boolean, keywords: string[], tools: string[] }
   */
  detectContext(userInput) {
    const normalizedInput = userInput.toLowerCase();
    const detectedKeywords = [];
    const recommendedTools = new Set();

    for (const [keyword, tools] of Object.entries(CONTEXT_TRIGGERS)) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        tools.forEach(tool => recommendedTools.add(tool));
      }
    }

    return {
      detected: detectedKeywords.length > 0,
      keywords: detectedKeywords,
      tools: Array.from(recommendedTools),
      source: 'context-detection'
    };
  }

  /**
   * 중요 키워드 감지 (이전 important-detection Hook 기능)
   * 중요 키워드 감지 시 자동 저장 트리거
   * @param {string} userInput - 사용자 입력
   * @returns {object} { detected: boolean, keywords: string[], shouldSave: boolean }
   */
  detectImportantKeywords(userInput) {
    const detectedKeywords = [];

    // 한국어 키워드 확인
    for (const keyword of IMPORTANT_KEYWORDS_KR) {
      if (userInput.includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    }

    // 영어 키워드 확인
    const normalizedInput = userInput.toLowerCase();
    for (const keyword of IMPORTANT_KEYWORDS_EN) {
      if (normalizedInput.includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    }

    const detected = detectedKeywords.length > 0;

    // 중요 키워드 감지 시 kiro-memory에 저장 트리거
    if (detected) {
      this.triggerAutoSave(userInput, detectedKeywords);
    }

    return {
      detected,
      keywords: detectedKeywords,
      shouldSave: detected,
      source: 'important-detection'
    };
  }

  /**
   * 자동 저장 트리거 (kiro-memory 연동)
   * [RESTORED] memory-config.json 설정 참조
   * @param {string} content - 저장할 내용
   * @param {string[]} keywords - 감지된 키워드
   */
  triggerAutoSave(content, keywords) {
    try {
      // [RESTORED] Memory config에서 auto-save 설정 확인
      const memConfig = this.memoryConfig?.['memory-config'] || {};
      const autoSaveEnabled = memConfig['auto-save'] !== false;  // 기본값 true

      if (!autoSaveEnabled) {
        console.log('[*] Auto-save disabled in memory-config');
        return;
      }

      // 자동 저장 로그 기록
      const saveLog = {
        timestamp: new Date().toISOString(),
        triggerKeywords: keywords,
        contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        source: 'important-detection',
        storage: memConfig.storage?.primary || 'kiro-memory'
      };

      // usage-stats에 자동 저장 기록 추가
      if (!this.usageStats.autoSaveLog) {
        this.usageStats.autoSaveLog = [];
      }
      this.usageStats.autoSaveLog.push(saveLog);

      // [RESTORED] max-entries 설정 참조 (기본값 1000, 여기선 100으로 제한)
      const maxEntries = Math.min(memConfig['max-entries'] || 1000, 100);
      if (this.usageStats.autoSaveLog.length > maxEntries) {
        this.usageStats.autoSaveLog = this.usageStats.autoSaveLog.slice(-maxEntries);
      }

      safeWriteJSON(USAGE_STATS_FILE, this.usageStats);

      console.log(`[+] Auto-save triggered: ${keywords.join(', ')} → ${saveLog.storage}`);
    } catch (error) {
      console.error('[!] Auto-save trigger failed:', error.message);
    }
  }

  /**
   * 메인 추천 메서드
   * @param {string} userInput - 사용자 입력
   * @param {object} options - { mode: 'concise'|'detailed', maxResults: number }
   * @returns {object} 추천 결과
   */
  recommend(userInput, options = {}) {
    const mode = options.mode || 'concise';
    const maxResults = options.maxResults || 5;

    // 0. [RESTORED] Context Detection 실행 (이전 Hook 기능)
    const contextDetection = this.detectContext(userInput);
    const importantDetection = this.detectImportantKeywords(userInput);

    // 0.5 [NEW] Plan Context 로드 (Planning-ATOS Bridge)
    const planContext = this.planExecutor ? this.planExecutor.getContext() : null;

    // 1. ContextAnalyzer로 분석
    let analysis = null;
    if (this.contextAnalyzer) {
      analysis = this.contextAnalyzer.analyze(userInput);
    } else {
      // fallback: 간단한 키워드 매칭
      analysis = this.simpleAnalysis(userInput);
    }

    if (!analysis.success) {
      return {
        success: false,
        error: analysis.error || 'Analysis failed',
        recommendations: []
      };
    }

    // 2. 도구별 점수 계산 (context detection + plan context 결과 전달)
    const scoredTools = this.scoreTools(analysis, userInput, contextDetection, planContext);

    // 3. 상위 N개 선택
    const topTools = scoredTools.slice(0, maxResults);

    // 4. 워크플로우 추천
    const workflowRecommendations = this.recommendWorkflows(analysis);

    // 5. 스킬 추천
    const skillRecommendations = this.recommendSkills(analysis);

    // 6. 체이닝 제안
    const chainingSuggestions = this.suggestChaining(topTools);

    // 7. 결과 포맷팅
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      input: userInput,
      analysis: mode === 'detailed' ? analysis : {
        primaryIntent: analysis.intents[0] || null,
        entityCount: Object.values(analysis.entities).flat().length
      },
      recommendations: {
        tools: this.formatToolRecommendations(topTools, mode),
        workflows: workflowRecommendations,
        skills: skillRecommendations,
        chaining: chainingSuggestions
      },
      // [RESTORED] Context Detection 결과 포함
      contextDetection: contextDetection.detected ? {
        keywords: contextDetection.keywords,
        boostedTools: contextDetection.tools,
        source: contextDetection.source
      } : null,
      importantDetection: importantDetection.detected ? {
        keywords: importantDetection.keywords,
        autoSaved: importantDetection.shouldSave,
        source: importantDetection.source
      } : null,
      // [NEW] Plan Context 정보 추가
      planContext: planContext?.hasPlan ? {
        planId: planContext.planId,
        progressPercent: planContext.progressPercent,
        currentPhase: planContext.currentPhase,
        nextTask: planContext.nextTask,
        phaseWeights: planContext.phaseWeights
      } : null,
      metadata: {
        mode: mode,
        totalToolsEvaluated: scoredTools.length,
        confidenceScore: this.calculateOverallConfidence(topTools),
        contextBoosted: contextDetection.detected,
        importantKeywordsDetected: importantDetection.detected,
        planAware: !!planContext?.hasPlan
      }
    };

    return result;
  }

  /**
   * 간단한 분석 (ContextAnalyzer 없을 때 fallback)
   */
  simpleAnalysis(userInput) {
    const normalizedInput = userInput.toLowerCase();
    const intents = [];
    const entities = {};

    // 간단한 의도 추출
    if (/연구|조사|검색|찾/.test(normalizedInput)) {
      intents.push({ intent: 'research', confidence: 0.7 });
    }
    if (/파일|작성|수정|읽/.test(normalizedInput)) {
      intents.push({ intent: 'file_operation', confidence: 0.7 });
    }
    if (/git|커밋|푸시|브랜치/.test(normalizedInput)) {
      intents.push({ intent: 'git_operation', confidence: 0.7 });
    }

    // URL 추출
    const urls = userInput.match(/https?:\/\/[^\s]+/gi);
    if (urls) entities.url = urls;

    // 파일 경로 추출
    const paths = userInput.match(/[A-Za-z]:[\\\/][^\s]+/gi);
    if (paths) entities.file_path = paths;

    return {
      success: true,
      intents,
      entities,
      suggestedCategories: [],
      suggestedTools: [],
      suggestedWorkflows: [],
      suggestedSkills: []
    };
  }

  /**
   * 도구별 점수 계산
   * @param {object} analysis - 분석 결과
   * @param {string} userInput - 사용자 입력
   * @param {object} contextDetection - [RESTORED] Context Detection 결과
   * @param {object} planContext - [NEW] Plan Phase 컨텍스트
   */
  scoreTools(analysis, userInput, contextDetection = null, planContext = null) {
    const scoredTools = [];
    const normalizedInput = userInput.toLowerCase();
    const mcpServers = this.toolRegistry.mcpServers || {};

    // [RESTORED] Context Detection에서 부스트할 도구 목록
    const contextBoostedTools = contextDetection?.detected ? contextDetection.tools : [];

    // [NEW] Plan Phase 가중치
    const phaseWeights = planContext?.phaseWeights || {};
    const nextTaskTools = planContext?.nextTask?.suggestedTools || [];

    for (const [serverName, serverInfo] of Object.entries(mcpServers)) {
      let score = 0;
      const scoreBreakdown = {};

      // 1. 의도 매칭 점수
      const intentScore = this.calculateIntentScore(analysis.intents, serverInfo);
      score += intentScore * WEIGHTS.intentMatch;
      scoreBreakdown.intentMatch = intentScore;

      // 2. 키워드 매칭 점수
      const keywordScore = this.calculateKeywordScore(normalizedInput, serverInfo);
      score += keywordScore * WEIGHTS.keywordMatch;
      scoreBreakdown.keywordMatch = keywordScore;

      // 3. 우선순위 보너스
      const priorityScore = this.getPriorityScore(serverInfo.priority);
      score += priorityScore * WEIGHTS.priorityBonus;
      scoreBreakdown.priorityBonus = priorityScore;

      // 4. 성공률 보너스
      const successScore = this.getSuccessRateScore(serverName);
      score += successScore * WEIGHTS.successRate;
      scoreBreakdown.successRate = successScore;

      // 5. 사용 빈도 보너스
      const usageScore = this.getUsageFrequencyScore(serverName);
      score += usageScore * WEIGHTS.usageFrequency;
      scoreBreakdown.usageFrequency = usageScore;

      // 6. 최근 사용 보너스
      const recentScore = this.getRecentUsageScore(serverName);
      score += recentScore * WEIGHTS.recentUsage;
      scoreBreakdown.recentUsage = recentScore;

      // 7. 패턴 매칭 보너스
      const patternScore = this.getPatternMatchScore(analysis, serverName);
      score += patternScore * WEIGHTS.patternMatch;
      scoreBreakdown.patternMatch = patternScore;

      // 8. [RESTORED] Context Detection 부스트
      let contextBoostScore = 0;
      if (contextBoostedTools.length > 0) {
        // 서버 이름이 context에서 감지된 도구 목록에 포함되는지 확인
        const serverNameLower = serverName.toLowerCase();
        for (const boostedTool of contextBoostedTools) {
          if (serverNameLower.includes(boostedTool.toLowerCase()) ||
              boostedTool.toLowerCase().includes(serverNameLower)) {
            contextBoostScore = 1.0;  // 풀 부스트
            break;
          }
        }
      }
      score += contextBoostScore * WEIGHTS.contextBoost;
      scoreBreakdown.contextBoost = contextBoostScore;

      // 9. [NEW] Plan Phase 부스트
      let planPhaseScore = 0;
      const serverCategory = serverInfo.category;

      // Phase 가중치에서 카테고리 매칭
      if (phaseWeights[serverCategory]) {
        planPhaseScore = Math.max(0, phaseWeights[serverCategory] - 1); // 1 초과분만 부스트
      }

      // 다음 태스크 추천 도구 매칭
      if (nextTaskTools.length > 0 && nextTaskTools.includes(serverCategory)) {
        planPhaseScore = Math.max(planPhaseScore, 0.5); // 최소 0.5 부스트
      }

      score += planPhaseScore * WEIGHTS.planPhaseBoost;
      scoreBreakdown.planPhaseBoost = planPhaseScore;

      if (score > 0.1) {  // 최소 임계값
        scoredTools.push({
          server: serverName,
          score: Math.min(score, 1),  // 최대 1
          category: serverInfo.category,
          tools: serverInfo.tools || [],
          priority: serverInfo.priority,
          scoreBreakdown
        });
      }
    }

    // 점수 내림차순 정렬
    scoredTools.sort((a, b) => b.score - a.score);

    return scoredTools;
  }

  /**
   * 의도 매칭 점수 계산
   */
  calculateIntentScore(intents, serverInfo) {
    if (!intents || intents.length === 0) return 0;

    const serverCategory = serverInfo.category;
    let maxScore = 0;

    // 카테고리-의도 매핑
    const categoryIntentMap = {
      web: ['research', 'browser_automation'],
      search: ['research'],
      filesystem: ['file_operation'],
      development: ['development', 'git_operation', 'github_operation'],
      data: ['database', 'visualization'],
      storage: ['memory', 'task_management'],
      visualization: ['visualization'],
      automation: ['workflow', 'browser_automation'],
      media: ['youtube', 'document_analysis'],
      ai: ['ai_llm', 'research'],
      mapping: ['mapping', 'visualization']
    };

    const relevantIntents = categoryIntentMap[serverCategory] || [];

    for (const intentObj of intents) {
      if (relevantIntents.includes(intentObj.intent)) {
        maxScore = Math.max(maxScore, intentObj.confidence || 0.8);
      }
    }

    return maxScore;
  }

  /**
   * 키워드 매칭 점수 계산
   */
  calculateKeywordScore(normalizedInput, serverInfo) {
    const keywords = serverInfo.triggerKeywords || [];
    if (keywords.length === 0) return 0;

    let matchCount = 0;
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.min(matchCount / Math.max(keywords.length, 3), 1);
  }

  /**
   * 우선순위 점수
   */
  getPriorityScore(priority) {
    const priorityMap = {
      'critical': 1.0,
      'high': 0.8,
      'medium': 0.5,
      'low': 0.2
    };
    return priorityMap[priority] || 0.3;
  }

  /**
   * 성공률 점수 (usage-stats 기반)
   */
  getSuccessRateScore(serverName) {
    const tools = this.usageStats.tools || {};

    // 해당 서버의 도구들 성공률 평균
    let totalSuccess = 0;
    let count = 0;

    for (const [toolName, stats] of Object.entries(tools)) {
      if (toolName.startsWith(`mcp__${serverName}`)) {
        totalSuccess += stats.successRate || 0;
        count++;
      }
    }

    return count > 0 ? totalSuccess / count : 0.5;  // 기본값 0.5
  }

  /**
   * 사용 빈도 점수
   */
  getUsageFrequencyScore(serverName) {
    const tools = this.usageStats.tools || {};

    let totalCalls = 0;
    for (const [toolName, stats] of Object.entries(tools)) {
      if (toolName.startsWith(`mcp__${serverName}`)) {
        totalCalls += stats.totalCalls || 0;
      }
    }

    // 로그 스케일로 정규화 (100회 = 1.0)
    return Math.min(Math.log10(totalCalls + 1) / 2, 1);
  }

  /**
   * 최근 사용 점수
   */
  getRecentUsageScore(serverName) {
    const tools = this.usageStats.tools || {};

    let mostRecent = null;
    for (const [toolName, stats] of Object.entries(tools)) {
      if (toolName.startsWith(`mcp__${serverName}`) && stats.lastUsed) {
        if (!mostRecent || new Date(stats.lastUsed) > new Date(mostRecent)) {
          mostRecent = stats.lastUsed;
        }
      }
    }

    if (!mostRecent) return 0;

    // 24시간 이내 = 1.0, 7일 이내 = 0.5, 그 이상 = 0.1
    const hoursSince = (Date.now() - new Date(mostRecent).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return 1;
    if (hoursSince < 24 * 7) return 0.5;
    return 0.1;
  }

  /**
   * 패턴 매칭 점수
   */
  getPatternMatchScore(analysis, serverName) {
    const patterns = this.usageStats.patterns || {};

    // Intent + Entity 조합 패턴 확인
    for (const intentObj of (analysis.intents || [])) {
      for (const [entityType, entities] of Object.entries(analysis.entities || {})) {
        if (entities && entities.length > 0) {
          const patternKey = `intent:${intentObj.intent} + entity:${entityType}`;
          const pattern = patterns[patternKey];

          if (pattern && pattern.recommendedTools) {
            for (const tool of pattern.recommendedTools) {
              if (tool.includes(serverName)) {
                return pattern.successRate || 0.7;
              }
            }
          }
        }
      }
    }

    return 0;
  }

  /**
   * 워크플로우 추천
   */
  recommendWorkflows(analysis) {
    const recommendations = [];
    const workflows = this.toolRegistry.workflows || {};

    for (const [workflowName, workflowInfo] of Object.entries(workflows)) {
      const triggers = workflowInfo.triggers || [];

      for (const intentObj of (analysis.intents || [])) {
        if (triggers.includes(intentObj.intent)) {
          recommendations.push({
            workflow: workflowName,
            matchedIntent: intentObj.intent,
            confidence: intentObj.confidence || 0.7,
            description: workflowInfo.description || ''
          });
          break;
        }
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 스킬 추천
   */
  recommendSkills(analysis) {
    const recommendations = [];
    const skills = this.toolRegistry.skills || {};

    for (const [skillName, skillInfo] of Object.entries(skills)) {
      const triggers = skillInfo.triggers || [];
      let matched = false;

      for (const intentObj of (analysis.intents || [])) {
        for (const trigger of triggers) {
          if (intentObj.intent.includes(trigger) || trigger.includes(intentObj.intent)) {
            recommendations.push({
              skill: skillName,
              matchedTrigger: trigger,
              confidence: intentObj.confidence || 0.7,
              autoActivate: skillInfo.autoActivate || false
            });
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 체이닝 제안 생성
   */
  suggestChaining(topTools) {
    const suggestions = [];
    const chainingPatterns = this.usageStats.chainingPatterns?.patterns || [];

    for (const tool of topTools.slice(0, 3)) {
      // 이 도구 다음에 자주 사용되는 도구 찾기
      for (const pattern of chainingPatterns) {
        if (pattern.from === tool.server || pattern.from?.includes(tool.server)) {
          suggestions.push({
            after: tool.server,
            suggest: pattern.to,
            confidence: pattern.successRate || 0.5,
            reason: pattern.reason || 'Historical pattern'
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 도구 추천 포맷팅
   */
  formatToolRecommendations(tools, mode) {
    return tools.map((tool, index) => {
      const basic = {
        rank: index + 1,
        server: tool.server,
        score: Math.round(tool.score * 100) / 100,
        category: tool.category
      };

      if (mode === 'detailed') {
        return {
          ...basic,
          tools: tool.tools,
          priority: tool.priority,
          scoreBreakdown: tool.scoreBreakdown
        };
      }

      return basic;
    });
  }

  /**
   * 전체 신뢰도 계산
   */
  calculateOverallConfidence(topTools) {
    if (topTools.length === 0) return 0;

    // 상위 3개 평균
    const top3 = topTools.slice(0, 3);
    const avgScore = top3.reduce((sum, t) => sum + t.score, 0) / top3.length;

    return Math.round(avgScore * 100) / 100;
  }

  /**
   * 다음 도구 제안 (체이닝용)
   * @param {string} currentTool - 현재 사용한 도구
   * @param {object} context - 현재 컨텍스트
   */
  suggestNextTool(currentTool, context = {}) {
    const suggestions = [];
    const chainingPatterns = this.usageStats.chainingPatterns?.patterns || [];

    // 1. 기록된 체이닝 패턴에서 찾기
    for (const pattern of chainingPatterns) {
      if (pattern.from === currentTool) {
        suggestions.push({
          tool: pattern.to,
          confidence: pattern.successRate || 0.6,
          source: 'historical_pattern',
          reason: pattern.reason
        });
      }
    }

    // 2. 카테고리 기반 제안
    const mcpServers = this.toolRegistry.mcpServers || {};
    const currentServer = Object.entries(mcpServers).find(([name]) =>
      currentTool.includes(name)
    );

    if (currentServer) {
      const [currentName, currentInfo] = currentServer;
      const currentCategory = currentInfo.category;

      // 같은 카테고리의 보완 도구 제안
      for (const [serverName, serverInfo] of Object.entries(mcpServers)) {
        if (serverName !== currentName && serverInfo.category === currentCategory) {
          suggestions.push({
            tool: serverName,
            confidence: 0.4,
            source: 'same_category',
            reason: `Same category: ${currentCategory}`
          });
        }
      }
    }

    // 정렬 및 반환
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions.slice(0, 3);
  }

  /**
   * 추천 기록 (피드백 루프용)
   */
  recordRecommendation(input, recommendations, accepted) {
    const stats = this.usageStats;

    // 전역 통계 업데이트
    if (!stats.globalStats) {
      stats.globalStats = {
        totalRecommendations: 0,
        recommendationAcceptRate: 0
      };
    }

    stats.globalStats.totalRecommendations++;

    // 학습 큐에 추가
    if (!stats.learningQueue) {
      stats.learningQueue = { pending: [] };
    }

    stats.learningQueue.pending.push({
      timestamp: new Date().toISOString(),
      input,
      recommendations: recommendations.tools?.slice(0, 3),
      accepted,
      processed: false
    });

    // 저장
    safeWriteJSON(USAGE_STATS_FILE, stats);
  }

  /**
   * 추천 결과를 문자열로 포맷팅 (CLI용)
   */
  formatAsString(result) {
    if (!result.success) {
      return `[!] 추천 실패: ${result.error}`;
    }

    let output = [];
    output.push('\n===========================================');
    output.push('  ATOS Recommendation Results');
    output.push('===========================================\n');

    // 분석 정보
    if (result.analysis.primaryIntent) {
      output.push(`[*] 주요 의도: ${result.analysis.primaryIntent.intent} (${Math.round(result.analysis.primaryIntent.confidence * 100)}%)`);
    }
    output.push(`[*] 추출된 엔티티: ${result.analysis.entityCount}개`);
    output.push('');

    // 도구 추천
    output.push('--- 추천 도구 ---');
    if (result.recommendations.tools.length === 0) {
      output.push('  (추천 없음)');
    } else {
      result.recommendations.tools.forEach(tool => {
        output.push(`  ${tool.rank}. [${tool.category}] ${tool.server} (${Math.round(tool.score * 100)}%)`);
      });
    }
    output.push('');

    // 워크플로우 추천
    if (result.recommendations.workflows.length > 0) {
      output.push('--- 추천 워크플로우 ---');
      result.recommendations.workflows.forEach(wf => {
        output.push(`  [+] ${wf.workflow} (${wf.matchedIntent})`);
      });
      output.push('');
    }

    // 스킬 추천
    if (result.recommendations.skills.length > 0) {
      output.push('--- 추천 스킬 ---');
      result.recommendations.skills.forEach(skill => {
        const auto = skill.autoActivate ? ' [AUTO]' : '';
        output.push(`  [+] ${skill.skill}${auto}`);
      });
      output.push('');
    }

    // 체이닝 제안
    if (result.recommendations.chaining.length > 0) {
      output.push('--- 체이닝 제안 ---');
      result.recommendations.chaining.forEach(chain => {
        output.push(`  ${chain.after} -> ${chain.suggest}`);
      });
      output.push('');
    }

    output.push(`[*] 신뢰도: ${Math.round(result.metadata.confidenceScore * 100)}%`);
    output.push(`[*] 평가 도구 수: ${result.metadata.totalToolsEvaluated}개`);
    output.push('');

    return output.join('\n');
  }
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const engine = new RecommendationEngine();

  switch (command) {
    case 'recommend':
    case 'r':
      if (args[1]) {
        const mode = args.includes('--detailed') ? 'detailed' : 'concise';
        const result = engine.recommend(args[1], { mode });
        console.log(engine.formatAsString(result));

        if (args.includes('--json')) {
          console.log('\n--- JSON Output ---');
          console.log(JSON.stringify(result, null, 2));
        }
      } else {
        console.log('사용법: node recommendation-engine.js recommend "사용자 입력" [--detailed] [--json]');
      }
      break;

    case 'next':
    case 'chain':
      if (args[1]) {
        const suggestions = engine.suggestNextTool(args[1]);
        console.log('\n--- 다음 도구 제안 ---');
        suggestions.forEach((s, i) => {
          console.log(`${i + 1}. ${s.tool} (${Math.round(s.confidence * 100)}%) - ${s.reason}`);
        });
      } else {
        console.log('사용법: node recommendation-engine.js next [현재도구]');
      }
      break;

    case 'test':
      console.log('\n=== ATOS Recommendation Engine 테스트 ===\n');

      const testCases = [
        'AI 보안 최신 동향 연구해줘',
        '파일을 작성하고 수정해야 해',
        'https://github.com/anthropics/claude-code 레포 분석',
        '데이터베이스에서 사용자 정보 조회',
        '차트로 시각화해줘',
        '유튜브 영상 찾아서 요약해줘'
      ];

      testCases.forEach((testCase, i) => {
        console.log(`\n--- 테스트 ${i + 1}: "${testCase}" ---`);
        const result = engine.recommend(testCase, { mode: 'concise' });
        console.log(`의도: ${result.analysis.primaryIntent?.intent || 'N/A'}`);
        console.log(`추천: ${result.recommendations.tools.slice(0, 3).map(t => t.server).join(', ')}`);
        console.log(`신뢰도: ${Math.round(result.metadata.confidenceScore * 100)}%`);
      });
      break;

    default:
      console.log('ATOS Recommendation Engine');
      console.log('');
      console.log('사용법: node recommendation-engine.js [command] [args]');
      console.log('');
      console.log('Commands:');
      console.log('  recommend, r   사용자 입력 기반 도구 추천');
      console.log('  next, chain    현재 도구 기반 다음 도구 제안');
      console.log('  test           테스트 케이스 실행');
      console.log('');
      console.log('Options:');
      console.log('  --detailed     상세 모드 (점수 분해 포함)');
      console.log('  --json         JSON 출력 추가');
      console.log('');
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = RecommendationEngine;

// CLI 실행
if (require.main === module) {
  handleCLI();
}
