/**
 * Autonomous Router (Layer 4 - Swarm Commander Brain)
 *
 * 3-Tier routing with Bayesian self-learning.
 * Watches transcript events and proactively suggests optimal tools/agents.
 *
 * Tier 1 (Simple): Main Claude handles directly
 * Tier 2 (Medium): Dispatch to specialized agent
 * Tier 3 (Complex): Assemble agent team
 */
'use strict';

const crypto = require('crypto');
const db = require('./db');

// Intent patterns (Korean + English)
// Note: \b doesn't work with Korean Unicode chars, so Korean patterns use looser matching
const INTENT_PATTERNS = [
  // File operations
  { pattern: /(read|write|create|delete|edit|modify|파일|수정|생성|삭제|열기|쓰기|읽기).*(file|directory|folder|폴더|디렉토리|경로)/i,
    intent: 'file_operation', tier: 1, agents: [] },
  { pattern: /(파일|폴더|디렉토리).*(만들|수정|삭제|생성|열|읽|쓰)/i,
    intent: 'file_operation', tier: 1, agents: [] },
  // Code search
  { pattern: /\b(search|find|grep|look\s*for)\b|검색|찾아|어디|위치|정의/i,
    intent: 'code_search', tier: 1, agents: [] },
  // Git
  { pattern: /\b(git|commit|branch|merge|push|pull|rebase)\b|커밋|브랜치|머지|푸시/i,
    intent: 'git_operation', tier: 1, agents: [] },
  // Web scrape
  { pattern: /\b(scrape|crawl)\b|스크래핑|크롤링|웹.*추출|페이지.*추출|텍스트.*추출/i,
    intent: 'web_scrape', tier: 2, agents: ['research-agent'] },
  // Web search
  { pattern: /(search|look\s*up).*(web|internet|online)|웹.*검색|인터넷.*검색|구글|조사.*해/i,
    intent: 'web_search', tier: 2, agents: ['research-agent'] },
  // Research
  { pattern: /\b(research|paper|arxiv|academic)\b|논문|리서치|학술|연구|조사/i,
    intent: 'research', tier: 2, agents: ['research-agent'] },
  // Architecture (complex)
  { pattern: /\b(refactor|architecture|redesign)\b|리팩토링|마이그레이션|아키텍처|재설계|전환/i,
    intent: 'architecture', tier: 3, agents: ['code-agent', 'review-agent'] },
  // Testing
  { pattern: /\b(test|verify|QA)\b|테스트|검증|품질|확인/i,
    intent: 'testing', tier: 2, agents: ['review-agent'] },
  // Security
  { pattern: /\b(security|auth|token|encrypt|OAuth)\b|보안|인증|암호화|토큰|권한/i,
    intent: 'security', tier: 3, agents: ['code-agent', 'review-agent'] },
  // Database
  { pattern: /\b(database|sql|schema|migration|supabase)\b|데이터베이스|스키마|테이블|쿼리|DB/i,
    intent: 'database', tier: 2, agents: ['code-agent'] },
  // Image/OCR
  { pattern: /\b(image|photo|ocr|scan|screenshot)\b|이미지|사진|스캔|캡처|인식/i,
    intent: 'image_processing', tier: 1, agents: [] },
  // Document/PDF
  { pattern: /\b(pdf|document|docx|convert)\b|문서|PDF|변환|추출/i,
    intent: 'document', tier: 1, agents: [] },
  // Visualization
  { pattern: /\b(chart|graph|diagram|plot)\b|차트|그래프|다이어그램|시각화|플롯/i,
    intent: 'visualization', tier: 1, agents: [] },
  // Deployment
  { pattern: /\b(deploy|CI|CD|pipeline)\b|배포|파이프라인|릴리스|빌드/i,
    intent: 'deployment', tier: 3, agents: ['code-agent', 'review-agent'] },
  // Design/UI
  { pattern: /\b(design|UI|UX|component|landing)\b|디자인|컴포넌트|랜딩|화면|레이아웃/i,
    intent: 'design', tier: 2, agents: ['code-agent'] },
  // Install/Setup
  { pattern: /\b(install|setup|configure)\b|설치|설정|구성|환경/i,
    intent: 'setup', tier: 1, agents: [] },
  // Knowledge/RAG
  { pattern: /\b(knowledge|RAG|retrieve|memory|obsidian|vault)\b|지식|메모리|검색|볼트|옵시디언/i,
    intent: 'knowledge', tier: 2, agents: ['research-agent'] },
  // AI Orchestration
  { pattern: /\b(orchestrat|multi.?model|council|consensus|deliberat)\b|오케스트|합의|심의|다중.*모델/i,
    intent: 'ai_orchestration', tier: 3, agents: ['research-agent', 'review-agent'] },
  // Evolution
  { pattern: /\b(evolv|upgrade|improv|optimiz)\b|진화|업그레이드|개선|최적화/i,
    intent: 'evolution', tier: 3, agents: ['code-agent', 'review-agent'] },
];

// Default tool recommendations per intent
const DEFAULT_TOOLS = {
  file_operation: ['desktop-commander', 'edit-file-lines', 'filesystem'],
  code_search: ['desktop-commander', 'serena', 'grep'],
  git_operation: ['git-mcp', 'github'],
  web_scrape: ['firecrawl', 'one-search', 'crawl4ai-lite'],
  web_search: ['websearch', 'one-search', 'deep-research-mcp'],
  research: ['deep-research-mcp', 'paper-search-mcp', 'context7'],
  architecture: ['sequential-thinking', 'serena', 'claude-code-mcp'],
  testing: ['sequential-thinking', 'playwright'],
  security: ['sequential-thinking', 'serena', 'semgrep', 'gitleaks', 'osv-scanner'],
  database: ['sqlite-mcp', 'supabase', 'duckdb'],
  image_processing: ['image-recognition', 'paddleocr-mcp', 'ocr-mcp'],
  document: ['marker-mcp', 'ocr-mcp'],
  visualization: ['antv-chart'],
  deployment: ['n8n', 'github'],
  design: ['playwright', 'figma'],
  knowledge: ['obsidian-mcp', 'memory', 'kiro-memory', 'chromadb'],
  ai_orchestration: ['codex', 'llm-council', 'multi-ai-orchestration', 'pal'],
  evolution: ['claude-code-mcp', 'skill-factory', 'evolution-agent'],
};

class AutonomousRouter {
  constructor({ antifragile } = {}) {
    this.antifragile = antifragile || null;
    this.recentToolChain = [];
    this.maxChainLength = 10;
  }

  /**
   * Analyze task intent and return routing recommendation
   */
  analyzeIntent(text) {
    const matches = [];
    for (const p of INTENT_PATTERNS) {
      if (p.pattern.test(text)) {
        matches.push({ intent: p.intent, tier: p.tier, agents: p.agents });
      }
    }

    if (matches.length === 0) {
      // Code Mode JIT: for unknown intents, flag for dynamic discovery
      return {
        intent: 'unknown', tier: 1, confidence: 0, agents: [], tools: [],
        codeModeHint: process.env.ENABLE_CODE_MODE_ROUTING === '1'
          ? 'Use POST /code-mode/search for dynamic tool discovery' : null
      };
    }

    // Pick highest tier match
    matches.sort((a, b) => b.tier - a.tier);
    const best = matches[0];

    // Check learned weights
    const learnedTools = db.getBestToolsForIntent(best.intent);
    const defaultTools = DEFAULT_TOOLS[best.intent] || [];

    // Merge: learned tools first (if they have good weight), then defaults
    const tools = [];
    for (const lt of learnedTools) {
      if (lt.weight > 0.4) tools.push({ name: lt.tool_name, weight: lt.weight, source: 'learned' });
    }
    for (const dt of defaultTools) {
      if (!tools.find(t => t.name === dt)) {
        tools.push({ name: dt, weight: 0.5, source: 'default' });
      }
    }

    const confidence = learnedTools.length > 0
      ? Math.min(0.99, 0.5 + learnedTools[0].weight * 0.5)
      : 0.5;

    // Apply barbell strategy if antifragile is available
    let barbell = null;
    if (this.antifragile && tools.length >= 2) {
      barbell = this.antifragile.applyBarbell(tools, best.intent);
    }

    return {
      intent: best.intent,
      tier: best.tier,
      confidence,
      agents: best.agents,
      tools,
      barbell: barbell ? { strategy: barbell.strategy, recommended: barbell.recommended?.name } : null,
      allMatches: matches.map(m => m.intent)
    };
  }

  /**
   * Record tool outcome and update Bayesian weights
   */
  /**
   * Track tool usage for chain pattern detection only.
   * Weight updates are handled by SelfLearningEngine.learn().
   * Tool usage logging is handled by EventCollector /tool endpoint.
   */
  recordOutcome(toolName, intent, success, durationMs) {
    // Track tool chain for pattern detection
    this.recentToolChain.push({ tool: toolName, intent, success, ts: Date.now() });
    if (this.recentToolChain.length > this.maxChainLength) this.recentToolChain.shift();

    // Check for repeating patterns
    this._detectPatterns();
  }

  /**
   * Detect repeating tool chain patterns -> skill candidates
   */
  _detectPatterns() {
    if (this.recentToolChain.length < 3) return;

    // Look for 2-3 tool sequences that repeat
    for (let len = 2; len <= 3; len++) {
      if (this.recentToolChain.length < len * 2) continue;
      const recent = this.recentToolChain.slice(-len).map(t => t.tool);
      const prev = this.recentToolChain.slice(-len * 2, -len).map(t => t.tool);

      if (JSON.stringify(recent) === JSON.stringify(prev)) {
        const hash = crypto.createHash('md5').update(recent.join('->')).digest('hex').slice(0, 12);
        const desc = `Auto-detected chain: ${recent.join(' -> ')}`;
        db.recordPattern(hash, desc, recent);
      }
    }
  }

  /**
   * Get proactive routing hint based on current context
   */
  getProactiveHint(currentTool, intent) {
    // Check if current tool has low success rate for this intent
    const tools = db.getBestToolsForIntent(intent);
    if (tools.length === 0) return null;

    const currentWeight = tools.find(t => t.tool_name === currentTool);
    const bestTool = tools[0];

    // If current tool is not the best AND best has significantly higher weight
    if (bestTool.tool_name !== currentTool && bestTool.weight > 0.7) {
      if (!currentWeight || currentWeight.weight < bestTool.weight - 0.2) {
        return {
          type: 'routing_hint',
          suggestion: `Consider using ${bestTool.tool_name} instead of ${currentTool}`,
          recommended: bestTool.tool_name,
          confidence: bestTool.weight,
          reason: `${bestTool.tool_name} has ${Math.round(bestTool.weight * 100)}% success rate for ${intent}`
        };
      }
    }

    return null;
  }

  /**
   * Get ready-to-deploy skill candidates
   */
  getSkillCandidates() {
    return db.getReadyPatterns(3);
  }
}

module.exports = { AutonomousRouter };
