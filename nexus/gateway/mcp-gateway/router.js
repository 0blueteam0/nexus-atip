/**
 * NEXUS MCP Gateway - Smart Router
 *
 * Analyzes task intent and routes to optimal MCP server + tool.
 * Integrates with NEXUS orchestrator and ATOS recommendation engine.
 */

'use strict';

const path = require('path');

// Task intent patterns -> MCP server mapping
const INTENT_PATTERNS = [
  // File operations
  { pattern: /\b(read|write|create|delete|edit|modify|open)\s*(file|directory|folder)/i,
    servers: ['desktop-commander', 'filesystem', 'edit-file-lines'],
    intent: 'file_operation' },

  // Code search & analysis
  { pattern: /\b(search|find|grep|look\s*for|where\s*is)\b.*\b(code|function|class|variable|symbol)/i,
    servers: ['desktop-commander', 'serena'],
    intent: 'code_search' },

  // Git operations
  { pattern: /\b(git|commit|branch|merge|diff|push|pull|rebase|stash|blame)\b/i,
    servers: ['git-mcp', 'github'],
    intent: 'git_operation' },

  // GitHub specific
  { pattern: /\b(github|gh|pr|pull\s*request|issue|repo|repository|fork|star)\b/i,
    servers: ['github'],
    intent: 'github' },

  // Web scraping & crawling
  { pattern: /\b(scrape|crawl|fetch|download)\s*(web|page|site|url)/i,
    servers: ['firecrawl', 'one-search', 'crawl4ai-lite', 'scrapegraph-local'],
    intent: 'web_scrape' },

  // Web search
  { pattern: /\b(search|look\s*up|find\s*on|google)\b.*\b(web|internet|online)\b/i,
    servers: ['websearch', 'one-search'],
    intent: 'web_search' },

  // Research
  { pattern: /\b(research|paper|arxiv|academic|journal|citation|study)\b/i,
    servers: ['deep-research-mcp', 'paper-search-mcp'],
    intent: 'research' },

  // Documentation
  { pattern: /\b(docs?|documentation|api\s*ref|library|framework)\b/i,
    servers: ['context7'],
    intent: 'documentation' },

  // Database
  { pattern: /\b(database|sql|query|table|schema|migration|supabase)\b/i,
    servers: ['sqlite-mcp', 'supabase'],
    intent: 'database' },

  // Task management
  { pattern: /\b(task|plan|todo|project|ticket|kanban|sprint)\b/i,
    servers: ['shrimp-task', 'vibekanban', 'task-master-ai'],
    intent: 'task_management' },

  // Image/OCR
  { pattern: /\b(image|photo|picture|ocr|scan|recognize|screenshot)\b/i,
    servers: ['image-recognition', 'paddleocr-mcp', 'ocr-mcp'],
    intent: 'image_processing' },

  // PDF/Document
  { pattern: /\b(pdf|document|convert|extract\s*text|marker)\b/i,
    servers: ['marker-mcp', 'ocr-mcp'],
    intent: 'document_processing' },

  // Charts & visualization
  { pattern: /\b(chart|graph|diagram|visualization|plot)\b/i,
    servers: ['antv-chart'],
    intent: 'visualization' },

  // Browser automation
  { pattern: /\b(browser|playwright|click|navigate|screenshot|dom)\b/i,
    servers: ['playwright'],
    intent: 'browser_automation' },

  // Workflow automation
  { pattern: /\b(workflow|automation|n8n|trigger|schedule|webhook)\b/i,
    servers: ['n8n'],
    intent: 'workflow_automation' },

  // AI deliberation
  { pattern: /\b(think|deliberat|council|consensus|multi.*ai|verify)\b/i,
    servers: ['sequential-thinking', 'llm-council', 'multi-ai-orchestration'],
    intent: 'ai_deliberation' },

  // Memory
  { pattern: /\b(remember|memory|forget|entity|relation|knowledge\s*graph)\b/i,
    servers: ['memory', 'kiro-memory'],
    intent: 'memory' },

  // GPU/Compute
  { pattern: /\b(gpu|jupyter|notebook|runpod|train|ml|pytorch)\b/i,
    servers: ['runpod-jupyter', 'e2b'],
    intent: 'compute' },

  // YouTube
  { pattern: /\b(youtube|video|channel|transcript|trending)\b/i,
    servers: ['youtube-data'],
    intent: 'youtube' },

  // Notion
  { pattern: /\b(notion|page|block|database)\b/i,
    servers: ['notion'],
    intent: 'notion' },

  // Korean intent patterns
  { pattern: /(파일|디렉토리|폴더)\s*(읽|쓰|만들|삭제|수정|열)/,
    servers: ['desktop-commander', 'filesystem'],
    intent: 'file_operation' },

  { pattern: /(웹|페이지|사이트|URL)\s*(스크래핑|크롤링|가져오|다운로드)/,
    servers: ['firecrawl', 'one-search', 'crawl4ai-lite'],
    intent: 'web_scrape' },

  { pattern: /(검색|찾|조회)\s*(코드|함수|클래스|파일)/,
    servers: ['desktop-commander', 'serena'],
    intent: 'code_search' },

  { pattern: /(이미지|사진|그림)\s*(인식|분석|설명|OCR)/,
    servers: ['image-recognition', 'paddleocr-mcp'],
    intent: 'image_processing' },

  { pattern: /(차트|그래프|시각화|다이어그램)\s*(생성|만들|그리)/,
    servers: ['antv-chart'],
    intent: 'visualization' },

  { pattern: /(논문|학술|연구|리서치)/,
    servers: ['deep-research-mcp', 'paper-search-mcp'],
    intent: 'research' },

  { pattern: /(유튜브|영상|비디오|채널)/,
    servers: ['youtube-data'],
    intent: 'youtube' },

  { pattern: /(데이터베이스|DB|테이블|스키마|쿼리|마이그레이션)/,
    servers: ['sqlite-mcp', 'supabase'],
    intent: 'database' },

  { pattern: /(워크플로우|자동화|스케줄|트리거|웹훅)/,
    servers: ['n8n'],
    intent: 'workflow_automation' },

  { pattern: /(메모리|기억|엔티티|관계|지식\s*그래프)/,
    servers: ['memory', 'kiro-memory'],
    intent: 'memory' },

  { pattern: /(브라우저|클릭|스크린샷|DOM|네비게이트)/,
    servers: ['playwright'],
    intent: 'browser_automation' },

  { pattern: /(태스크|할일|프로젝트|칸반|티켓)/,
    servers: ['shrimp-task', 'vibekanban'],
    intent: 'task_management' }
];

class SmartRouter {
  constructor(registry) {
    this.registry = registry;
    this._routeHistory = [];
  }

  /**
   * Analyze a task and recommend the best MCP server(s) and tools
   */
  route(taskDescription) {
    const matches = [];

    for (const rule of INTENT_PATTERNS) {
      if (rule.pattern.test(taskDescription)) {
        // Filter to only servers that are registered
        const availableServers = rule.servers.filter(s => this.registry.getServerConfig(s));
        if (availableServers.length > 0) {
          matches.push({
            intent: rule.intent,
            servers: availableServers,
            confidence: this._calculateConfidence(taskDescription, rule)
          });
        }
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Fallback to keyword-based recommendation from registry
    if (matches.length === 0) {
      const recommendations = this.registry.recommendServers(taskDescription);
      if (recommendations.length > 0) {
        matches.push({
          intent: 'inferred',
          servers: recommendations.map(r => r.server),
          confidence: 0.5
        });
      }
    }

    const result = {
      task: taskDescription,
      matches: matches.slice(0, 3),
      primary: matches.length > 0 ? matches[0] : null,
      timestamp: Date.now()
    };

    // Log routing decision
    this._routeHistory.push(result);
    if (this._routeHistory.length > 1000) {
      this._routeHistory = this._routeHistory.slice(-500);
    }

    return result;
  }

  /**
   * Get a smart recommendation with tool suggestions
   */
  recommend(taskDescription) {
    const routing = this.route(taskDescription);

    if (!routing.primary) {
      return {
        recommendation: 'No specific MCP server matched. Try rephrasing or use nexus_catalog to browse available tools.',
        alternatives: []
      };
    }

    const primary = routing.primary;
    const tools = [];

    // Search cached tools for matching servers
    for (const serverName of primary.servers.slice(0, 3)) {
      const searchResults = this.registry.searchTools(taskDescription.split(/\s+/).slice(0, 3).join(' '));
      for (const result of searchResults) {
        if (result.server === serverName) {
          tools.push(result);
        }
      }
    }

    return {
      intent: primary.intent,
      confidence: primary.confidence,
      primaryServer: primary.servers[0],
      alternativeServers: primary.servers.slice(1),
      suggestedTools: tools.slice(0, 5),
      howToCall: `nexus_call(server="${primary.servers[0]}", tool="<tool_name>", args={...})`,
      alternatives: routing.matches.slice(1, 3).map(m => ({
        intent: m.intent,
        servers: m.servers,
        confidence: m.confidence
      }))
    };
  }

  /**
   * Calculate confidence score for a pattern match
   */
  _calculateConfidence(text, rule) {
    const words = text.toLowerCase().split(/\s+/);
    const patternStr = rule.pattern.source.toLowerCase();

    // Base confidence from pattern match
    let confidence = 0.7;

    // Boost for longer matches
    const matchResult = text.match(rule.pattern);
    if (matchResult && matchResult[0]) {
      const matchLength = matchResult[0].length;
      confidence += Math.min(0.2, matchLength / text.length);
    }

    // Boost for server availability
    const availCount = rule.servers.filter(s => this.registry.getServerConfig(s)).length;
    confidence += Math.min(0.1, availCount * 0.03);

    return Math.min(1.0, confidence);
  }

  /**
   * Get routing statistics
   */
  getStats() {
    const intentCounts = {};
    for (const entry of this._routeHistory) {
      if (entry.primary) {
        intentCounts[entry.primary.intent] = (intentCounts[entry.primary.intent] || 0) + 1;
      }
    }
    return {
      totalRoutes: this._routeHistory.length,
      byIntent: intentCounts,
      lastRoute: this._routeHistory[this._routeHistory.length - 1] || null
    };
  }
}

module.exports = { SmartRouter };
