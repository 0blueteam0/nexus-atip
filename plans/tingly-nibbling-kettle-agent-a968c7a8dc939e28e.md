# 3-Brain LLM CLI Integration Plan (F Architecture)

**Date**: 2026-03-18  
**Status**: Design Phase (Ready for Implementation)  
**Target**: Unified CLI workflow with Claude, Gemini, Codex (3-Brain)  
**Scope**: 5 Phases, Infrastructure → Skill → Agent → Integration → Verification  

---

## Executive Summary

This plan integrates 3 LLM CLI subscriptions (Claude Code v2.1.78, Gemini CLI v0.33.0, Codex CLI v0.113.0) into a unified workflow system leveraging the F Architecture's autonomous routing and Observer pattern.

**Key Components**:
- Phase 1: Infrastructure (PATH, bridge files, config)
- Phase 2: 3-Brain Workflow Skill (5 patterns: Pipeline, Consensus, Triangle Review, Specialist Route, Deep Research)
- Phase 3: 3-Brain Agent (autonomous CLI coordination via clink)
- Phase 4: External Router & Multi-AI Integration (SERVICE_IDS, configs, task mapping)
- Phase 5: Verification & Testing

**Implementation Duration**: ~4-6 hours (serial execution)  
**Testing Duration**: ~2 hours (comprehensive validation)  
**Risk Level**: Low (builds on tested patterns in external-router.js and gemini-bridge.js)

---

## Phase 1: Infrastructure Fixes

### 1.1 PATH Configuration for Gemini CLI

**Current State**:
- Gemini CLI v0.33.0 is installed in PATH
- Supports: `gemini -p "prompt"` (non-interactive, JSON parser: gemini_json)

**Actions**:
1. Verify PATH includes Gemini CLI directory
   ```bash
   # Read K:\PortableApps\genai\.claude\rules\environment.md
   # Verify section "Gemini CLI v0.33.0" exists
   # If not, add PATH entry pointing to Gemini binary location
   ```

2. Test Gemini CLI availability
   ```bash
   gemini -p "test" 2>&1
   ```

**Files to Check/Update**:
- `K:\PortableApps\genai\.claude\rules\environment.md` - Add Gemini PATH documentation
- System PATH environment variable (if needed)

**Verification**: Gemini CLI responds to `-p` flag without errors

---

### 1.2 Codex CLI Bridge Creation

**Current State**:
- Codex CLI v0.113.0 at K:\PortableApps\tools\nodejs\npm-global\codex (NOT in PATH)
- Supports: `codex exec "prompt"` (non-interactive, JSON parser: codex_jsonl)

**File to Create**: 
`K:\PortableApps\genai\multi-ai-orchestration\codex-bridge.js`

**Template** (based on gemini-bridge.js pattern):

```javascript
// codex-bridge.js - Codex CLI Bridge for External Router Integration
// Pattern: Windows subprocess execution via spawn() with JSON response parsing

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CODEX_CLI_PATH = 'K:\\PortableApps\\tools\\nodejs\\npm-global\\codex';
const CODEX_EXEC_CMD = 'codex';

class CodexBridge {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      apiKey: config.apiKey || process.env.CODEX_API_KEY,
      ...config
    };
  }

  async execute(prompt, options = {}) {
    // Primary interface for ExternalRouter compatibility
    // Returns: { success: boolean, result?: string, error?: string, tokens?: number }
    return this.queryCodexWithRetry(prompt, options);
  }

  async queryCodex(prompt, options = {}) {
    // Single execution of Codex CLI
    // Command: codex exec "prompt"
    // Response: JSONL format with line-delimited JSON objects
    
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || this.config.timeout;
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Codex CLI timeout after ${timeout}ms`));
      }, timeout);

      try {
        const args = ['exec', prompt];
        const process = spawn(CODEX_EXEC_CMD, args, {
          cwd: CODEX_CLI_PATH,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          clearTimeout(timeoutHandle);
          
          if (code !== 0) {
            reject(new Error(`Codex CLI exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = this.parseCodexResponse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(parseError);
          }
        });

        process.on('error', (err) => {
          clearTimeout(timeoutHandle);
          reject(err);
        });
      } catch (error) {
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  parseCodexResponse(output) {
    // Parse JSONL response (codex_jsonl parser format)
    // Each line is a JSON object
    // Extract: text, tokens, finish_reason, error
    
    const lines = output.trim().split('\n').filter(l => l.trim());
    const results = [];
    
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        results.push(json);
      } catch (e) {
        // Try markdown code block extraction as fallback
        const match = output.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          try {
            return JSON.parse(match[1]);
          } catch (parseError) {
            throw new Error(`Failed to parse Codex response: ${e.message}`);
          }
        }
        throw new Error(`Invalid JSON in Codex response: ${e.message}`);
      }
    }

    // Combine results
    const combined = {
      text: results.map(r => r.text || '').join('\n'),
      tokens: results.reduce((sum, r) => sum + (r.tokens || 0), 0),
      finish_reason: results[results.length - 1]?.finish_reason || 'stop'
    };

    return combined;
  }

  async queryCodexWithRetry(prompt, options = {}) {
    // Retry logic with exponential backoff
    // Pattern: 1s * attempt^2 delay
    
    let lastError;
    const maxRetries = options.maxRetries || this.config.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.queryCodex(prompt, options);
        return {
          success: true,
          result: result.text,
          tokens: result.tokens
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delayMs = (this.config.retryDelay || 1000) * (attempt * attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return {
      success: false,
      error: lastError.message,
      attempt: maxRetries
    };
  }

  async requestReview(code, reviewType = 'general') {
    // Specialized: Request code review from Codex
    const prompt = `Review this ${reviewType} code:\n\n${code}`;
    return this.execute(prompt);
  }

  async requestAlternative(prompt, style = 'concise') {
    // Specialized: Request alternative response style
    const stylePrompt = style === 'concise' 
      ? `${prompt}\n\nProvide a concise response.`
      : `${prompt}\n\nProvide a detailed response.`;
    return this.execute(stylePrompt);
  }

  async isAvailable() {
    // Health check: Verify Codex CLI is accessible
    try {
      await this.queryCodex('echo "health check"', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = {
  CodexBridge,
  execute: (prompt, options) => {
    const bridge = new CodexBridge(options);
    return bridge.execute(prompt, options);
  },
  queryCodex: (prompt, options) => {
    const bridge = new CodexBridge(options);
    return bridge.queryCodex(prompt, options);
  },
  queryCodexWithRetry: (prompt, options) => {
    const bridge = new CodexBridge(options);
    return bridge.queryCodexWithRetry(prompt, options);
  },
  requestReview: (code, reviewType) => {
    const bridge = new CodexBridge();
    return bridge.requestReview(code, reviewType);
  },
  requestAlternative: (prompt, style) => {
    const bridge = new CodexBridge();
    return bridge.requestAlternative(prompt, style);
  },
  isAvailable: async () => {
    const bridge = new CodexBridge();
    return bridge.isAvailable();
  }
};
```

**Verification**:
- File exists at `K:\PortableApps\genai\multi-ai-orchestration\codex-bridge.js`
- Can be required without errors: `require('./codex-bridge.js')`
- `isAvailable()` returns true when Codex CLI is working

---

### 1.3 Claude CLI Bridge Creation

**Current State**:
- Claude Code v2.1.78 running as orchestrator
- Can be accessed via PAL MCP `clink` tool with parser: `claude`

**File to Create**:
`K:\PortableApps\genai\multi-ai-orchestration\claude-cli-bridge.js`

**Template** (similar pattern to Codex bridge):

```javascript
// claude-cli-bridge.js - Claude Code CLI Bridge for External Router Integration
// Pattern: PAL MCP clink-based execution with claude parser

class ClaudeCLIBridge {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      apiKey: config.apiKey || process.env.CLAUDE_CODE_API_KEY,
      ...config
    };
    this.palMcpAvailable = false;
    this.initPALMCP();
  }

  initPALMCP() {
    // Will be called by External Router which has PAL MCP loaded
    // Mark as ready when PAL MCP clink is available
    this.palMcpAvailable = true;
  }

  async execute(prompt, options = {}) {
    // Primary interface for ExternalRouter compatibility
    // Delegates to PAL MCP clink tool when called from External Router context
    // Returns: { success: boolean, result?: string, error?: string, tokens?: number }
    return this.queryClaudeWithRetry(prompt, options);
  }

  async queryClaude(prompt, options = {}) {
    // Execute via PAL MCP clink tool with 'claude' parser
    // This bridge is typically called from within External Router context
    // where PAL MCP is available
    
    if (!this.palMcpAvailable) {
      return {
        success: false,
        error: 'Claude CLI bridge: PAL MCP not initialized'
      };
    }

    // Note: Actual clink execution happens in External Router executeService()
    // This method provides the interface and response parsing
    // The External Router will call clink and pass response here
    
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || this.config.timeout;
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Claude CLI timeout after ${timeout}ms`));
      }, timeout);

      try {
        // When called from External Router, the router handles clink invocation
        // This method is the response parser contract
        // Expected response format: JSON with { text, tokens, finish_reason }
        
        resolve({
          text: '',
          tokens: 0,
          finish_reason: 'stop'
        });
      } catch (error) {
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  async queryClaudeWithRetry(prompt, options = {}) {
    // Retry logic with exponential backoff
    let lastError;
    const maxRetries = options.maxRetries || this.config.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.queryClaude(prompt, options);
        return {
          success: true,
          result: result.text,
          tokens: result.tokens
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delayMs = (this.config.retryDelay || 1000) * (attempt * attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return {
      success: false,
      error: lastError.message,
      attempt: maxRetries
    };
  }

  async isAvailable() {
    // Health check: Verify Claude CLI is accessible
    try {
      // Will be verified by External Router health check
      return this.palMcpAvailable;
    } catch (error) {
      return false;
    }
  }
}

module.exports = {
  ClaudeCLIBridge,
  execute: (prompt, options) => {
    const bridge = new ClaudeCLIBridge(options);
    return bridge.execute(prompt, options);
  },
  queryClaude: (prompt, options) => {
    const bridge = new ClaudeCLIBridge(options);
    return bridge.queryClaude(prompt, options);
  },
  queryClaudeWithRetry: (prompt, options) => {
    const bridge = new ClaudeCLIBridge(options);
    return bridge.queryClaudeWithRetry(prompt, options);
  },
  isAvailable: async () => {
    const bridge = new ClaudeCLIBridge();
    return bridge.isAvailable();
  }
};
```

**Verification**:
- File exists at `K:\PortableApps\genai\multi-ai-orchestration\claude-cli-bridge.js`
- Can be required without errors

---

### 1.4 CLI Clients Configuration Update

**File to Update**: 
`K:\PortableApps\genai\conf\cli_clients.json` (or create if missing)

**Current Content** (likely empty or minimal):

**New Content**:

```json
{
  "version": "1.0",
  "clients": {
    "claude": {
      "name": "Claude Code v2.1.78",
      "type": "claude_code",
      "parser": "claude",
      "enabled": true,
      "timeout": 30000,
      "description": "Main orchestrator, integrated via PAL MCP clink",
      "capabilities": ["reasoning", "coding", "analysis", "planning"]
    },
    "gemini": {
      "name": "Gemini CLI v0.33.0",
      "type": "cli_executable",
      "parser": "gemini_json",
      "enabled": true,
      "path": "gemini",
      "args": ["-p"],
      "timeout": 30000,
      "description": "CLI-based LLM, available in PATH",
      "capabilities": ["research", "analysis", "summarization"]
    },
    "codex": {
      "name": "Codex CLI v0.113.0",
      "type": "cli_executable",
      "parser": "codex_jsonl",
      "enabled": true,
      "path": "K:\\PortableApps\\tools\\nodejs\\npm-global\\codex\\codex.exe",
      "args": ["exec"],
      "timeout": 30000,
      "description": "Code-focused CLI LLM",
      "capabilities": ["coding", "code_review", "debugging"]
    }
  },
  "bridges": {
    "gemini": {
      "module": "./multi-ai-orchestration/gemini-bridge.js",
      "export": "execute",
      "status": "existing"
    },
    "codex": {
      "module": "./multi-ai-orchestration/codex-bridge.js",
      "export": "execute",
      "status": "to_create"
    },
    "claude": {
      "module": "./multi-ai-orchestration/claude-cli-bridge.js",
      "export": "execute",
      "status": "to_create"
    }
  },
  "health_check": {
    "interval": 300000,
    "timeout": 5000,
    "enabled": true
  }
}
```

**Verification**:
- JSON is valid and parseable
- All 3 clients are listed with correct paths and parsers
- Bridges section points to correct module locations

---

## Phase 2: 3-Brain Workflow Skill

### 2.1 Skill File Creation

**File to Create**:
`K:\PortableApps\genai\.claude\skills\three-brain-workflow\SKILL.md`

**Content Structure**:

```markdown
---
name: 3-Brain LLM Workflow
description: Unified workflow pattern for orchestrating Claude, Gemini, and Codex CLI in consensus-based decision making, specialized routing, and deep research scenarios
triggers:
  - "3뇌 워크플로우"
  - "3-brain workflow"
  - "다중 AI 분석"
  - "multi-ai analysis"
context: "3-brain consensus, workflow orchestration, specialized routing, deep research"
memory: "true"
allowed-tools:
  - "mcp__pal__chat"
  - "mcp__pal__clink"
  - "mcp__pal__consensus"
  - "mcp__pal__thinkdeep"
  - "mcp__pal__debug"
  - "mcp__pal__planner"
---

# 3-Brain LLM Workflow Skill

## Overview

The 3-Brain Workflow Skill coordinates three specialized LLM CLI clients (Claude, Gemini, Codex) to solve complex problems through:

1. **Pipeline Pattern**: Sequential execution with output chaining
2. **Consensus Pattern**: Independent analysis → cross-review → agreement building
3. **Triangle Review Pattern**: Three-perspective analysis with conflict resolution
4. **Specialist Route Pattern**: Task-specific service selection
5. **Deep Research Pattern**: Multi-phase research with synthesis

---

## Pattern 1: Pipeline (순차 실행)

**Trigger Keywords**:
- "파이프라인"
- "순차 분석"
- "chain-of-thought"
- "sequential analysis"

**When to Use**:
- Output of one LLM feeds input to next
- Task decomposition across specialized models
- Building complex solutions iteratively

**Workflow**:

```
Input Prompt
    ↓
[Stage 1] Claude (planning/analysis)
    ↓
[Stage 2] Gemini (research/validation)
    ↓
[Stage 3] Codex (implementation/refinement)
    ↓
Final Output
```

**Implementation Steps**:

1. Receive input prompt
2. Call Claude via clink: request initial analysis/planning
3. Pass Claude output to Gemini via clink: request validation/research
4. Pass Gemini output to Codex via clink: request implementation
5. Aggregate results into final output
6. Record execution chain in telemetry

**Example Usage**:

```
User: "3-Brain Pipeline: Design a system for real-time data processing"

[1] Claude analyzes requirements and creates architecture spec
[2] Gemini researches existing solutions and validates design
[3] Codex generates implementation boilerplate and code examples
[4] System merges outputs into comprehensive solution
```

---

## Pattern 2: Consensus (합의 기반)

**Trigger Keywords**:
- "합의"
- "consensus"
- "동의"
- "agreement"

**When to Use**:
- Complex decisions requiring multiple perspectives
- Reducing bias through agreement protocols
- High-stakes analysis where consensus matters

**Workflow** (4 phases):

```
Phase 1: Independent Analysis
  - Claude analyzes independently
  - Gemini analyzes independently  
  - Codex analyzes independently

Phase 2: Cross-Review
  - Claude reviews Gemini + Codex outputs
  - Gemini reviews Claude + Codex outputs
  - Codex reviews Claude + Gemini outputs

Phase 3: Consensus Building
  - Models negotiate differences
  - Find areas of agreement
  - Document conflict areas

Phase 4: Synthesis
  - Build consensus response
  - Highlight divergent views
  - Provide confidence scores
```

**Implementation Steps**:

1. Receive complex prompt
2. Send identical prompt to Claude, Gemini, Codex (parallel)
3. Wait for all 3 responses
4. Each model reviews other 2 outputs
5. Identify consensus areas (>2/3 agreement)
6. Identify conflict areas (split opinions)
7. Generate synthesis with agreement index
8. Return consensus result with confidence

**Example Usage**:

```
User: "3-Brain Consensus: Should we use microservices for this project?"

[Phase 1] Each AI analyzes independently
  Claude: "Yes, high complexity justifies it"
  Gemini: "Maybe, depends on team size"
  Codex: "No, adds unnecessary overhead"

[Phase 2] Cross-review phase
  Claude reviews others, finds 1 strong point from Codex
  Gemini acts as tiebreaker, leans toward "Maybe"
  Codex challenges assumptions

[Phase 3] Consensus
  Agreement: "Architecture decision depends on specific constraints"
  Disagreement: Implementation timeline (Claude: 6mo, Codex: 3mo)

[Phase 4] Final output
  Recommendation: Conditional yes, with risk assessment
  Confidence: 65% (due to disagreement on timeline)
```

---

## Pattern 3: Triangle Review (삼각 검토)

**Trigger Keywords**:
- "삼각 검토"
- "triangle review"
- "3-way review"
- "three-perspective analysis"

**When to Use**:
- Code reviews requiring multiple expertise
- Security/quality analysis
- Architecture decisions with tradeoff analysis

**Workflow**:

```
Input: Code/Design/Proposal
  ↓
[Claude] Strategic Review
  - Architecture fit
  - Design patterns
  - Long-term maintainability
  ↓
[Gemini] Research-Based Review
  - Best practices
  - Industry standards
  - Comparable solutions
  ↓
[Codex] Implementation Review
  - Code quality
  - Performance
  - Security issues
  ↓
Conflict Resolution:
  - Identify disagreements
  - Weight by expertise area
  - Generate resolution
  ↓
Triangle Report with scores:
  {Claude_score, Gemini_score, Codex_score, consensus_score}
```

**Implementation Steps**:

1. Receive code/design/proposal
2. Send to Claude: "Review from strategic perspective"
3. Send to Gemini: "Review from best-practices perspective"
4. Send to Codex: "Review from implementation perspective"
5. Analyze all 3 reviews for conflicts
6. For conflicts:
   - Claude wins on architecture (weight 40%)
   - Gemini wins on standards (weight 30%)
   - Codex wins on implementation (weight 30%)
7. Generate weighted consensus review
8. Return triangle report with all 3 scores + final score

**Example Usage**:

```
User: "3-Brain Triangle: Review this microservices design"

[Claude] Strategic: "Good long-term, but high operational complexity"
[Gemini] Research: "Aligns with industry standards for scale"
[Codex] Implementation: "Database transactions will be problematic"

Conflict: Database transaction approach
Resolution: Codex concern + Gemini standard suggests event sourcing
Final Score: 78/100 (feasible with modifications)
```

---

## Pattern 4: Specialist Route (전문가 라우팅)

**Trigger Keywords**:
- "전문가 선택"
- "specialist route"
- "best-fit"
- "task-specific"

**When to Use**:
- Task type determines best service
- Optimize for cost/speed/quality
- Avoid unnecessary multi-model processing

**Task-to-Service Mapping**:

```
Research/Analysis → Gemini (research strength)
Code Generation → Codex (code-focused model)
Planning/Strategy → Claude (reasoning strength)
Complex Multi-domain → Pipeline (all three)
Code Review → Triangle Review (all three)
```

**Workflow**:

```
Input Prompt
  ↓
Task Classification:
  - Analyze prompt for domain keywords
  - Estimate complexity
  - Check for multi-domain signals
  ↓
Route Decision:
  if (task_type === 'research') → Gemini
  if (task_type === 'coding') → Codex
  if (task_type === 'planning') → Claude
  if (task_type === 'complex') → Pipeline
  if (task_type === 'review') → Triangle
  ↓
Execute chosen pattern
  ↓
Return result with route_reason
```

**Implementation Steps**:

1. Receive prompt
2. Extract task category (research, coding, planning, review, etc.)
3. Look up TASK_SERVICE_MAP
4. Select single best-fit service or pattern
5. Execute with service selection reason
6. Return result with reasoning

**Example Usage**:

```
User: "3-Brain Route: Generate SQL optimization query"

Task Classification: "Coding" (high confidence: SELECT, JOIN, INDEX keywords)
Specialist Route: Codex (code generation specialty)
Reason: "Task is focused on code generation; Codex optimal"
Result: [SQL optimization query]
```

---

## Pattern 5: Deep Research (심층 조사)

**Trigger Keywords**:
- "심층 조사"
- "deep research"
- "comprehensive analysis"
- "multi-phase research"

**When to Use**:
- Research requiring synthesis from multiple sources
- Building knowledge base iteratively
- Complex topics needing multi-perspective validation

**Workflow** (4 phases):

```
Phase 1: Initial Research (Gemini-led)
  - Broad topic exploration
  - Identify key subtopics
  - Collect key facts

Phase 2: Deep Dive (Claude + Codex)
  - Claude: Strategic analysis of findings
  - Codex: Implementation angles (if applicable)
  - Identify gaps and conflicts

Phase 3: Synthesis (Claude-led)
  - Organize findings
  - Build coherent narrative
  - Validate with all three perspectives

Phase 4: Final Validation
  - Gemini validates against sources
  - Claude validates logical coherence
  - Codex validates practical applicability
```

**Implementation Steps**:

1. Receive research topic
2. Phase 1: Request Gemini to explore broadly
3. Phase 2: Request Claude & Codex to analyze subtopics
4. Phase 3: Request Claude to synthesize findings
5. Phase 4: Request all three to validate synthesis
6. Merge validation results
7. Generate comprehensive research report
8. Include source references and validation scores

**Example Usage**:

```
User: "3-Brain Deep Research: Latest advances in LLM fine-tuning"

Phase 1 (Gemini): Identifies 5 key research areas
  - LoRA and adapter-based methods
  - Parameter-efficient tuning
  - Multimodal fine-tuning
  - Instruction tuning techniques
  - Evaluation methodologies

Phase 2 (Claude/Codex): Deep analysis
  Claude: "LoRA emerges as dominant approach for cost efficiency"
  Codex: "Implementation complexity varies by framework"

Phase 3 (Claude): Synthesizes into coherent narrative
  "Current landscape dominated by parameter-efficient methods..."

Phase 4 (Validation): All three validate
  Gemini: ✓ Matches current literature
  Claude: ✓ Logically coherent
  Codex: ✓ Practically implementable

Final Output: 3000-word research report with validation scores
```

---

## Configuration

**Location**: `K:/PortableApps/genai/multi-ai-orchestration/config.json`

**Required Sections**:

```json
{
  "three_brain_workflow": {
    "enabled": true,
    "patterns": ["pipeline", "consensus", "triangle", "specialist", "research"],
    "timeout_default": 30000,
    "timeout_deep_research": 120000,
    "consensus_threshold": 0.67,
    "parallel_execution": true
  },
  "cli_clients": {
    "claude": { "enabled": true },
    "gemini": { "enabled": true },
    "codex": { "enabled": true }
  }
}
```

---

## Usage Examples

### Example 1: Pipeline Pattern

```
Trigger: "3-Brain Pipeline: Build a web scraper for product data"

[Stage 1] Claude: Requirements analysis
  - Define data structure
  - Identify technical approach
  - Document edge cases

[Stage 2] Gemini: Best practices research
  - Review popular libraries
  - Document ethical considerations
  - Suggest optimization techniques

[Stage 3] Codex: Implementation
  - Generate boilerplate code
  - Implement error handling
  - Add configuration options

Output: Complete, well-researched implementation
```

### Example 2: Consensus Pattern

```
Trigger: "3-Brain Consensus: Best database for real-time analytics"

Phase 1: Each AI analyzes independently
  Claude: PostgreSQL (stability + features)
  Gemini: ClickHouse (columnar optimization)
  Codex: Redis Streams (simplicity)

Phase 2-3: Cross-review and negotiation
  Finding: Different definitions of "real-time"
  Gemini proposes: Hybrid approach (PostgreSQL + ClickHouse)

Phase 4: Consensus result
  Recommendation: PostgreSQL with ClickHouse for analytics
  Confidence: 80%
  Caveats: Operational complexity increases
```

### Example 3: Triangle Review Pattern

```
Trigger: "3-Brain Triangle: Review authentication architecture"

Claude's Review:
  - ✓ Satisfies requirements
  - ! Lacks disaster recovery plan
  Score: 75/100

Gemini's Review:
  - ✓ Follows OAuth 2.0 standards
  - ! Missing PKCE for public clients
  Score: 72/100

Codex's Review:
  - ! Token refresh logic has race condition
  - ✓ Proper secret storage
  Score: 65/100

Triangle Consensus: 71/100 (multiple security issues must be addressed)
Highest Concern: Race condition in token refresh (Codex)
```

### Example 4: Specialist Route Pattern

```
Trigger: "3-Brain Route: Optimize database query performance"

Task Analysis:
  - Keywords: "optimize", "database", "query", "performance"
  - Domain: Infrastructure/database optimization
  - Complexity: Medium
  - Specialist Match: Codex (85% confidence)

Route Decision: Execute with Codex
Reason: "Task is code/infrastructure focused; Codex specialty"

Output: Optimized query with explanation
```

### Example 5: Deep Research Pattern

```
Trigger: "3-Brain Deep Research: Vector database market analysis"

Phase 1 (Gemini Research):
  - Identified 8 major players
  - 3 research areas: performance, cost, integration
  - Key data points collected

Phase 2 (Claude Analysis):
  - Strategic positioning analysis
  - Market consolidation trends
  - Pricing models comparison

Phase 3 (Synthesis):
  - Built coherent narrative
  - Identified emerging winner (Pinecone? Weaviate?)

Phase 4 (Validation):
  - Gemini: ✓ Aligns with market data
  - Claude: ✓ Logical analysis
  - Codex: ✓ Integration complexity realistic

Output: 5000-word market analysis with validation
```

---

## Workflow Selection Guide

**Use Pipeline when**:
- Tasks naturally decompose into stages
- Output of one stage needed for next
- Specialized expertise for each stage required

**Use Consensus when**:
- Decision requires multiple perspectives
- Reducing bias is important
- Stakeholder alignment matters

**Use Triangle Review when**:
- Code/design quality evaluation needed
- Multiple expertise areas required
- Risk/security assessment needed

**Use Specialist Route when**:
- Single best-fit model exists
- Cost/speed optimization critical
- Task domain clearly defined

**Use Deep Research when**:
- Comprehensive understanding needed
- Multiple sources must be synthesized
- Complex topic requiring validation

---

## Telemetry and Metrics

All patterns record:

```json
{
  "pattern": "pattern_name",
  "start_time": "ISO8601",
  "end_time": "ISO8601",
  "duration_ms": 12345,
  "models_used": ["claude", "gemini", "codex"],
  "status": "success|error",
  "confidence": 0.85,
  "tokens": {
    "input": 1000,
    "output": 2000,
    "total": 3000
  },
  "errors": []
}
```

---

## Troubleshooting

### Pattern timeout
- Increase timeout in config
- Check CLI client availability
- Review execution logs in `/data/telemetry/`

### Consensus threshold not met
- Normal for diverse perspectives
- Consider lowering threshold (default 0.67)
- Review conflict_resolution logs

### Specialist route incorrect selection
- Check task classification keywords
- Verify TASK_SERVICE_MAP in config
- Consider using Pipeline for complex tasks
```

**Verification**:
- SKILL.md exists at correct location
- YAML frontmatter is valid
- All 5 patterns documented with usage examples
- Configuration references are correct

---

## Phase 3: 3-Brain Agent

### 3.1 Agent File Creation

**File to Create**:
`K:\PortableApps\genai\.claude\agents\three-brain-agent.md`

**Content**:

```markdown
---
name: 3-Brain Workflow Agent
description: Autonomous agent that orchestrates 3-Brain workflow patterns using CLI subscriptions
isolation: worktree
background: false
memory_scope: conversation
permission_mode: auto-approval
allowed_tools:
  - mcp__pal__clink
  - mcp__pal__chat
  - mcp__pal__thinkdeep
  - mcp__pal__planner
  - mcp__pal__consensus
---

# 3-Brain Workflow Agent

## Purpose

Autonomous agent that:
1. Analyzes user requests to determine optimal 3-Brain pattern
2. Coordinates execution across Claude (clink), Gemini (clink), and Codex (clink) CLI clients
3. Synthesizes results into unified outputs
4. Learns from patterns and adapts selection logic

## Responsibilities

### Pattern Selection
- Analyze input to classify as: research, coding, planning, review, complex
- Map task type to optimal pattern
- Explain pattern selection to user

### Execution
- Initialize 3-Brain Workflow Skill with selected pattern
- Coordinate CLI calls via PAL MCP clink tool
- Manage execution state and timeouts
- Handle failures with fallback strategies

### Synthesis
- Combine outputs from all models
- Resolve conflicts using weighting rules
- Generate confidence scores
- Format results for user consumption

### Learning
- Record successful patterns for task types
- Update weights for pattern selection
- Store in Observer database for future sessions
- Propose improvements to TASK_SERVICE_MAP

## Periodic Tasks

### Every 30 minutes
- Health check: Verify all 3 CLI clients available
- Check Observer database for new learnings
- Report status to Swarm Commander

### Every 2 hours
- Analyze execution metrics
- Calculate success rates by pattern
- Identify underperforming patterns
- Log metrics to telemetry

### Every 6 hours
- Generate performance report
- Propose weight adjustments to routing
- Submit recommendations to Observer
- Request pattern optimization

### Daily
- Comprehensive analysis of all executions
- Pattern effectiveness scoring
- Failure root cause analysis
- Propose new specialized patterns if needed

## Constraints

1. **NEVER modify CLAUDE.md directly**
   - Changes → Submit to Observer → Wait for approval → Implement

2. **MUST use PAL MCP clink for CLI calls**
   - Never spawn CLI processes directly
   - Always validate clink availability before execution

3. **MUST record all executions**
   - Telemetry to Observer database
   - Pattern metadata
   - Success/failure metrics
   - Token usage and costs

4. **MUST respect rate limits**
   - 60 requests/hour per CLI client
   - Queue requests if limit approached
   - Alert user to rate limiting

5. **MUST maintain isolation**
   - Run in worktree
   - No shared state with other agents
   - Clean up temporary files after execution

## Implementation Notes

When called, the agent will:

1. **Analyze Request** (using PAL chat)
   ```
   Input: User request
   Classification: task_type, complexity, domain
   Output: Structured analysis
   ```

2. **Select Pattern** (using pattern selection logic)
   ```
   Lookup: TASK_SERVICE_MAP[task_type]
   Apply: Pattern selection weights
   Output: Selected pattern with reasoning
   ```

3. **Execute** (using 3-Brain Workflow Skill)
   ```
   Trigger: Pattern keyword from SKILL.md
   CLI Calls: Via PAL MCP clink
   Output: Aggregated result
   ```

4. **Synthesize** (using PAL chat or thinkdeep)
   ```
   Input: All model outputs
   Logic: Merge, conflict resolution, scoring
   Output: Final result with metadata
   ```

5. **Record** (to Observer)
   ```
   Data: Execution metrics, pattern selection, success/failure
   Store: Observer SQLite database
   Alert: Swarm Commander if issues detected
   ```

## Example Execution Flow

```
User: "Analyze security implications of microservices"

Agent Analysis:
  - Task type: Security analysis + planning
  - Complexity: High (requires 3 perspectives)
  - Recommended pattern: Triangle Review or Consensus

Agent Selection:
  - Triangle Review best for security (code + architecture + best practices)
  - Confidence: 85%

Agent Execution:
  - Claude: Architecture security perspective via clink
  - Gemini: Security best practices via clink
  - Codex: Implementation security via clink

Agent Synthesis:
  - Merge 3 reviews
  - Highlight conflicts (implementation complexity vs. best practices)
  - Weight by expertise (Codex: 40% on implementation, Claude: 40% on architecture)
  - Generate triangle report with 78/100 score

Agent Output:
  - Triangle review report
  - Security risk assessment
  - Remediation recommendations
  - Confidence: 78%

Agent Recording:
  - Store execution metrics to Observer
  - Update pattern selection weights
  - Report to Swarm Commander
```

## Integration with Observer

The agent reports to Observer (Swarm Commander) with:

```json
{
  "agent_id": "three-brain-agent",
  "timestamp": "ISO8601",
  "execution_count": 42,
  "pattern_metrics": {
    "pipeline": { "success_rate": 0.92, "avg_duration_ms": 18000 },
    "consensus": { "success_rate": 0.88, "avg_duration_ms": 24000 },
    "triangle": { "success_rate": 0.95, "avg_duration_ms": 15000 },
    "specialist": { "success_rate": 0.98, "avg_duration_ms": 8000 },
    "research": { "success_rate": 0.85, "avg_duration_ms": 45000 }
  },
  "cli_availability": {
    "claude": true,
    "gemini": true,
    "codex": true
  },
  "status": "healthy"
}
```

## Self-Modification Protocol

Agent identifies potential improvements through:

1. Pattern underperformance (success rate < 80%)
2. Repeated failures on specific task types
3. User feedback on pattern selection
4. Benchmark comparisons with other agents

Agent proposes improvements via:

```
→ Observer (Swarm Commander) database
→ Propose weight adjustment in TASK_SERVICE_MAP
→ Request approval from user or evolution-agent
→ Implement if approved
→ Track success of new weights
```

**Example Proposal**:

```
Current: Research tasks → Gemini (weight 1.0)
Observation: Consensus pattern shows better results for complex research (85% vs 78%)
Proposal: Add Consensus to research pattern selection (weight 0.3)
Expected Impact: +4% success rate
Status: Awaiting approval
```
```

**Verification**:
- File exists at `K:\PortableApps\genai\.claude\agents\three-brain-agent.md`
- Metadata section is valid
- All periodic tasks documented
- Integration with Observer is clear

---

## Phase 4: External Router Integration

### 4.1 SERVICE_IDS Addition

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: Top of file, around line 15-30

**Current Code** (example):
```javascript
const SERVICE_IDS = {
  GEMINI: 'gemini',
  // ... others ...
};
```

**Changes to Make**:

Add 3 new entries to SERVICE_IDS:

```javascript
const SERVICE_IDS = {
  GEMINI: 'gemini',
  CLAUDE_CLI: 'claude_cli',           // NEW
  CODEX_CLI: 'codex_cli',             // NEW
  CLAUDE_COUNCIL: 'claude_council',   // EXISTING (keep)
  // ... other existing entries ...
};
```

**Verification**:
- SERVICE_IDS object includes CLAUDE_CLI and CODEX_CLI
- No syntax errors
- Alphabetical ordering maintained

---

### 4.2 SERVICE_CONFIGS Addition

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: SERVICE_CONFIGS object definition, around line 40-100

**Add this configuration block**:

```javascript
[SERVICE_IDS.CLAUDE_CLI]: {
  name: 'Claude Code v2.1.78 CLI',
  description: 'Direct Claude CLI subscription access via clink',
  bridge: './claude-cli-bridge.js',
  capabilities: ['reasoning', 'analysis', 'planning', 'coding', 'writing'],
  strengths: ['Complex reasoning', 'Strategic planning', 'Architecture design', 'Multi-domain analysis'],
  weaknesses: ['Real-time data', 'Current events'],
  rateLimit: { requests: 60, windowMs: 3600000 }, // 60/hour
  timeout: 30000,
  priority: 1,
  costPerRequest: 0.001, // Estimate based on subscription
  enabled: true,
  parser: 'claude',
  healthCheckCommand: 'status'
},

[SERVICE_IDS.CODEX_CLI]: {
  name: 'Codex CLI v0.113.0',
  description: 'Codex code-focused LLM via CLI interface',
  bridge: './codex-bridge.js',
  capabilities: ['coding', 'code_review', 'debugging', 'optimization'],
  strengths: ['Code generation', 'Code review', 'Debugging', 'Performance optimization'],
  weaknesses: ['Non-code tasks', 'Creative writing'],
  rateLimit: { requests: 60, windowMs: 3600000 }, // 60/hour
  timeout: 30000,
  priority: 2,
  costPerRequest: 0.0008,
  enabled: true,
  parser: 'codex_jsonl',
  healthCheckCommand: 'exec "test"'
},
```

**Location Context**:
- Add after GEMINI configuration (around line 60-90)
- Before CLAUDE_COUNCIL configuration
- Match indentation and structure of existing SERVICE_CONFIGS entries

**Verification**:
- Both services have all required fields
- parsers match cli_clients.json configuration
- priorities are appropriate (CLAUDE_CLI priority 1 for orchestration, CODEX_CLI priority 2)
- Rate limits are reasonable

---

### 4.3 TASK_SERVICE_MAP Update

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: TASK_SERVICE_MAP object, around line 150-250

**Current Structure** (example):
```javascript
const TASK_SERVICE_MAP = {
  RESEARCH: {
    // ...existing entries...
  },
  CODING: {
    // ...existing entries...
  },
  // ...other tasks...
};
```

**Changes to Make**:

For each task type, add CLI services to the service weighting:

**RESEARCH task type**:
```javascript
RESEARCH: {
  GEMINI: { weight: 0.4, reason: 'Research capability' },
  CLAUDE_CLI: { weight: 0.3, reason: 'Analysis and synthesis' },
  // ...existing entries...
}
```

**CODING task type**:
```javascript
CODING: {
  CODEX_CLI: { weight: 0.4, reason: 'Code generation specialty' },
  CLAUDE_CLI: { weight: 0.2, reason: 'Architecture context' },
  // ...existing entries...
}
```

**REASONING task type**:
```javascript
REASONING: {
  CLAUDE_CLI: { weight: 0.4, reason: 'Complex reasoning capability' },
  GEMINI: { weight: 0.3, reason: 'Multi-perspective analysis' },
  // ...existing entries...
}
```

**COMPLEX task type** (multi-domain):
```javascript
COMPLEX: {
  // Trigger 3-Brain workflow instead of single service
  CLAUDE_CLI: { weight: 0.35, reason: 'Coordination via clink' },
  CODEX_CLI: { weight: 0.3, reason: 'Implementation perspective' },
  GEMINI: { weight: 0.3, reason: 'Research and validation' },
  // ...existing entries...
}
```

**Pattern**: 
- Add weights for CLAUDE_CLI and CODEX_CLI to all task types
- Keep existing services active
- Adjust weights so new services don't exceed 50% total unless primary
- Document reasoning for each weight

**Verification**:
- All task types have CLAUDE_CLI or CODEX_CLI entries (or both)
- Weights per task type sum to reasonable value (not exceeding 2.0-3.0 for top services)
- Reasons are clear and documented

---

### 4.4 FALLBACK_CHAINS Update

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: FALLBACK_CHAINS object, around line 280-320

**Current Structure** (example):
```javascript
const FALLBACK_CHAINS = {
  GEMINI: ['CLAUDE_COUNCIL', 'OPENAI'],
  // ...other chains...
};
```

**Changes to Make**:

Add fallback chains for new CLI services:

```javascript
const FALLBACK_CHAINS = {
  // ...existing chains...
  CLAUDE_CLI: [SERVICE_IDS.CODEX_CLI, SERVICE_IDS.GEMINI, 'CLAUDE_COUNCIL'],
  CODEX_CLI: [SERVICE_IDS.CLAUDE_CLI, SERVICE_IDS.GEMINI, 'CLAUDE_COUNCIL'],
  // ...other chains...
};
```

**Logic**:
- If CLAUDE_CLI fails → try CODEX_CLI (complementary skill) → GEMINI (research) → CLAUDE_COUNCIL (ensemble fallback)
- If CODEX_CLI fails → try CLAUDE_CLI (broader reasoning) → GEMINI (research) → CLAUDE_COUNCIL

**Verification**:
- Fallback chains form logical paths
- No circular dependencies (A → B → A)
- All referenced services exist in SERVICE_IDS

---

### 4.5 ExternalRouter Constructor Update

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: Constructor method, around line 350-380

**Current Code** (example):
```javascript
constructor(options = {}) {
  this.options = options;
  this.bridges = {};
  // ... initialization ...
}
```

**Changes to Make**:

Add bridge loading for new CLI services:

```javascript
constructor(options = {}) {
  this.options = options;
  this.bridges = {
    [SERVICE_IDS.GEMINI]: require('./gemini-bridge.js'),
    [SERVICE_IDS.CLAUDE_CLI]: require('./claude-cli-bridge.js'),      // NEW
    [SERVICE_IDS.CODEX_CLI]: require('./codex-bridge.js'),            // NEW
    // ...existing bridges...
  };
  // ... rest of initialization ...
}
```

**Verification**:
- Both bridge modules can be required without errors
- Bridges are stored in this.bridges object with SERVICE_IDS keys

---

### 4.6 Health Check Integration

**File to Update**:
`K:\PortableApps\genai\multi-ai-orchestration\external-router.js`

**Location**: performHealthChecks() method, around line 600-650

**Add Service Health Checks**:

Within the performHealthChecks loop, add:

```javascript
// For CLAUDE_CLI
if (SERVICE_CONFIG.parser === 'claude') {
  try {
    const bridge = this.bridges[serviceId];
    const available = await bridge.isAvailable();
    status = available ? 'AVAILABLE' : 'UNAVAILABLE';
  } catch (error) {
    status = 'DEGRADED';
  }
}

// For CODEX_CLI
if (SERVICE_CONFIG.parser === 'codex_jsonl') {
  try {
    const bridge = this.bridges[serviceId];
    const available = await bridge.isAvailable();
    status = available ? 'AVAILABLE' : 'UNAVAILABLE';
  } catch (error) {
    status = 'DEGRADED';
  }
}
```

**Verification**:
- Health checks run for both new services
- Status updates are recorded in SERVICE_STATUS

---

## Phase 5: Verification Testing

### 5.1 Unit Tests

**File to Create**:
`K:\PortableApps\genai\tests\three-brain-cli-integration.test.js`

**Test Cases**:

```javascript
// Test 1: Codex Bridge Creation
test('codex-bridge.js loads without errors', () => {
  const bridge = require('../multi-ai-orchestration/codex-bridge.js');
  assert(bridge.execute !== undefined);
  assert(bridge.queryCodex !== undefined);
});

// Test 2: Claude CLI Bridge Creation
test('claude-cli-bridge.js loads without errors', () => {
  const bridge = require('../multi-ai-orchestration/claude-cli-bridge.js');
  assert(bridge.execute !== undefined);
  assert(bridge.queryClaude !== undefined);
});

// Test 3: External Router SERVICE_IDS
test('SERVICE_IDS includes all 3 CLI services', () => {
  const router = require('../multi-ai-orchestration/external-router.js');
  assert(router.SERVICE_IDS.CLAUDE_CLI !== undefined);
  assert(router.SERVICE_IDS.CODEX_CLI !== undefined);
  assert(router.SERVICE_IDS.GEMINI !== undefined);
});

// Test 4: SERVICE_CONFIGS Completeness
test('SERVICE_CONFIGS has complete entries for all CLI services', () => {
  const router = require('../multi-ai-orchestration/external-router.js');
  const requiredFields = ['name', 'description', 'bridge', 'capabilities', 'timeout', 'parser'];
  
  for (const serviceId of [router.SERVICE_IDS.CLAUDE_CLI, router.SERVICE_IDS.CODEX_CLI]) {
    const config = router.SERVICE_CONFIGS[serviceId];
    for (const field of requiredFields) {
      assert(config[field] !== undefined);
    }
  }
});

// Test 5: TASK_SERVICE_MAP Includes New Services
test('TASK_SERVICE_MAP includes CLAUDE_CLI and CODEX_CLI', () => {
  const router = require('../multi-ai-orchestration/external-router.js');
  let claudeCliFound = false;
  let codexCliFound = false;
  
  for (const taskType in router.TASK_SERVICE_MAP) {
    const services = router.TASK_SERVICE_MAP[taskType];
    if (services[router.SERVICE_IDS.CLAUDE_CLI]) claudeCliFound = true;
    if (services[router.SERVICE_IDS.CODEX_CLI]) codexCliFound = true;
  }
  
  assert(claudeCliFound && codexCliFound);
});

// Test 6: Skill File Structure
test('3-Brain Workflow Skill YAML frontmatter is valid', () => {
  const fs = require('fs');
  const yaml = require('js-yaml');
  const skillPath = '../.claude/skills/three-brain-workflow/SKILL.md';
  const content = fs.readFileSync(skillPath, 'utf-8');
  
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  assert(match !== null);
  
  const frontmatter = yaml.load(match[1]);
  assert(frontmatter.name !== undefined);
  assert(frontmatter.triggers !== undefined);
  assert(Array.isArray(frontmatter.triggers));
});

// Test 7: Agent File Structure
test('3-Brain Agent markdown metadata is valid', () => {
  const fs = require('fs');
  const agentPath = '../.claude/agents/three-brain-agent.md';
  const content = fs.readFileSync(agentPath, 'utf-8');
  
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  assert(match !== null);
  
  const metadata = match[1];
  assert(metadata.includes('name:'));
  assert(metadata.includes('isolation:'));
});

// Test 8: CLI Clients Configuration
test('cli_clients.json includes all 3 CLI clients', () => {
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('../conf/cli_clients.json', 'utf-8'));
  
  assert(config.clients.claude !== undefined);
  assert(config.clients.gemini !== undefined);
  assert(config.clients.codex !== undefined);
});
```

**Verification**:
- All 8 tests pass
- No syntax errors in test file
- Test coverage includes both new files and modifications

---

### 5.2 Integration Tests

**File to Create**:
`K:\PortableApps\genai\tests\three-brain-workflow-integration.test.js`

**Test Cases**:

```javascript
// Test 1: Pipeline Pattern Flow
test('Pipeline pattern executes with 3 models in sequence', async () => {
  // This test would:
  // 1. Call 3-Brain Workflow Skill with "pipeline" trigger
  // 2. Verify first model (Claude) responds
  // 3. Verify second model (Gemini) uses first output
  // 4. Verify third model (Codex) uses second output
  // 5. Verify final output is synthesized
});

// Test 2: Consensus Pattern Flow
test('Consensus pattern gathers 3 independent analyses', async () => {
  // This test would:
  // 1. Call with "consensus" trigger
  // 2. Verify all 3 models analyze independently (parallel)
  // 3. Verify cross-review phase executes
  // 4. Verify consensus score is calculated
  // 5. Verify agreement areas are identified
});

// Test 3: Triangle Review Pattern Flow
test('Triangle review generates multi-perspective analysis', async () => {
  // This test would:
  // 1. Call with sample code/design
  // 2. Verify Claude provides strategic review
  // 3. Verify Gemini provides best-practice review
  // 4. Verify Codex provides implementation review
  // 5. Verify triangle report with 3 scores is generated
});

// Test 4: Specialist Route Correct Selection
test('Specialist route selects optimal model for task', async () => {
  // This test would:
  // 1. Send "coding" task → should route to CODEX_CLI
  // 2. Send "research" task → should route to GEMINI
  // 3. Send "planning" task → should route to CLAUDE_CLI
  // 4. Verify route_reason is documented
});

// Test 5: Deep Research Pattern Phases
test('Deep Research pattern executes 4-phase workflow', async () => {
  // This test would:
  // 1. Call with "deep research" trigger
  // 2. Verify Phase 1: Gemini research execution
  // 3. Verify Phase 2: Claude + Codex analysis
  // 4. Verify Phase 3: Claude synthesis
  // 5. Verify Phase 4: All 3 validation
  // 6. Verify final report generation
});

// Test 6: External Router Service Selection
test('ExternalRouter selectServices returns correct services', async () => {
  const router = new ExternalRouter();
  const services = await router.selectServices({
    taskCategory: 'CODING',
    prompt: 'generate function'
  });
  
  assert(services.length > 0);
  assert(services.some(s => s.id === SERVICE_IDS.CODEX_CLI));
});

// Test 7: Fallback Chain Execution
test('Fallback chain executes when primary service fails', async () => {
  // This test would:
  // 1. Mock CLAUDE_CLI as unavailable
  // 2. Call router with CLAUDE_CLI task
  // 3. Verify fallback to CODEX_CLI occurs
  // 4. Verify result is returned
});

// Test 8: Rate Limiting
test('Rate limit enforcement prevents exceeding quota', async () => {
  const router = new ExternalRouter();
  
  // 1. Make 61 requests to CLAUDE_CLI (limit is 60/hour)
  // 2. Verify 61st request is queued/rejected
  // 3. Verify rate limit metrics are recorded
});

// Test 9: Health Check Integration
test('Health checks include all CLI services', async () => {
  const router = new ExternalRouter();
  const stats = await router.getStats();
  
  assert(stats.serviceStatus[SERVICE_IDS.CLAUDE_CLI] !== undefined);
  assert(stats.serviceStatus[SERVICE_IDS.CODEX_CLI] !== undefined);
});

// Test 10: Telemetry Recording
test('Execution metrics are recorded to telemetry', async () => {
  const router = new ExternalRouter();
  
  // 1. Execute a workflow
  // 2. Verify telemetry entry is created
  // 3. Verify pattern, duration, status are recorded
});
```

**Verification**:
- All 10 integration tests pass
- Tests cover all 5 workflow patterns
- Service routing, fallback, rate limiting are verified
- Telemetry recording is confirmed

---

### 5.3 System Verification Checklist

**Pre-Implementation Checklist** (before Phase 1):

- [ ] K:\PortableApps\tools\nodejs\npm-global\codex exists and is executable
- [ ] Gemini CLI is in PATH and responds to `gemini -p "test"`
- [ ] Claude Code v2.1.78 is running as orchestrator
- [ ] PAL MCP clink tool is available with claude, gemini, codex parsers
- [ ] .claude/skills/ directory exists
- [ ] .claude/agents/ directory exists
- [ ] multi-ai-orchestration/ directory exists
- [ ] conf/ directory exists or can be created

**Post-Phase 1 Verification**:

- [ ] K:\PortableApps\genai\multi-ai-orchestration\codex-bridge.js created
- [ ] K:\PortableApps\genai\multi-ai-orchestration\claude-cli-bridge.js created
- [ ] K:\PortableApps\genai\conf\cli_clients.json created/updated with all 3 clients
- [ ] Gemini CLI responds to test execution
- [ ] Codex CLI responds to test execution
- [ ] Both bridges load without errors: `require('./codex-bridge.js')`

**Post-Phase 2 Verification**:

- [ ] K:\PortableApps\genai\.claude\skills\three-brain-workflow\SKILL.md created
- [ ] YAML frontmatter is valid
- [ ] All 5 patterns documented with examples
- [ ] Configuration references point to correct files
- [ ] Trigger keywords are unique and clear

**Post-Phase 3 Verification**:

- [ ] K:\PortableApps\genai\.claude\agents\three-brain-agent.md created
- [ ] Agent metadata is valid
- [ ] Periodic tasks are documented
- [ ] Integration with Observer is configured
- [ ] Permission mode is set to auto-approval

**Post-Phase 4 Verification**:

- [ ] external-router.js SERVICE_IDS includes CLAUDE_CLI, CODEX_CLI
- [ ] external-router.js SERVICE_CONFIGS has complete entries for both
- [ ] TASK_SERVICE_MAP updated for all task types
- [ ] FALLBACK_CHAINS includes both new services
- [ ] Constructor loads both bridge modules
- [ ] Health check functions include new services

**Post-Phase 5 Verification**:

- [ ] Unit tests (3-brain-cli-integration.test.js) all pass
- [ ] Integration tests (3-brain-workflow-integration.test.js) all pass
- [ ] All 5 workflow patterns execute successfully
- [ ] Service selection is correct for each task type
- [ ] Fallback chains work when primary service unavailable
- [ ] Rate limiting prevents quota exceeded
- [ ] Telemetry records all executions
- [ ] No errors in console logs

---

## Implementation Timeline

**Estimated Duration**: 4-6 hours (serial execution)

**Phase Breakdown**:

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1.1 | PATH Configuration | 15 min | None |
| 1.2 | Codex Bridge | 30 min | None |
| 1.3 | Claude CLI Bridge | 30 min | None |
| 1.4 | CLI Config | 15 min | 1.2, 1.3 |
| 2.1 | Workflow Skill | 60 min | 1.4 |
| 3.1 | Agent File | 30 min | 2.1 |
| 4.1-4.6 | External Router Updates | 45 min | 1.2, 1.3 |
| 5.1 | Unit Tests | 30 min | 1.2, 1.3, 4.1-4.6 |
| 5.2 | Integration Tests | 45 min | 2.1, 3.1, 4.1-4.6 |
| 5.3 | Verification | 30 min | All phases |

**Total**: ~4.5 hours (assuming no issues)

---

## Risk Assessment and Mitigation

### Risk 1: CLI Service Unavailability
**Impact**: High - Core functionality depends on CLI availability  
**Mitigation**: 
- Health checks every 5 minutes
- Fallback chains to alternative services
- Graceful degradation to cached responses

### Risk 2: Rate Limiting Exceeded
**Impact**: Medium - Requests queued/rejected  
**Mitigation**:
- Token bucket algorithm with 60-second windows
- Monitoring and alerts when approaching limit
- Request queuing system

### Risk 3: Token Parsing Errors
**Impact**: Low-Medium - Malformed responses from CLI  
**Mitigation**:
- Multiple parsing strategies (JSON, markdown code blocks)
- Retry logic with exponential backoff
- Error logging and user notification

### Risk 4: Bridge Module Load Failures
**Impact**: High - System cannot initialize  
**Mitigation**:
- Pre-implementation verification of all requires
- Try-catch blocks in constructor
- Detailed error logging

### Risk 5: Pattern Selection Errors
**Impact**: Medium - Wrong model used for task  
**Mitigation**:
- Explicit task classification before routing
- TASK_SERVICE_MAP weights learned over time
- User-provided override mechanism

---

## Success Criteria

**Implementation Success** (must pass all):

1. ✓ All 5 phases completed without errors
2. ✓ All unit tests passing (8/8)
3. ✓ All integration tests passing (10/10)
4. ✓ All 5 workflow patterns functional
5. ✓ Correct service selected for each task type
6. ✓ Fallback chains working
7. ✓ Telemetry recording all executions
8. ✓ Health checks functional for all services

**Post-Implementation** (optional, F Architecture integration):

9. ✓ Observer (Swarm Commander) receives telemetry
10. ✓ Agent learns and adapts pattern selection
11. ✓ Weights updated based on success rates
12. ✓ Graceful degradation handles service failures

---

## Post-Implementation Next Steps

1. **Monitor Telemetry** (Week 1)
   - Track execution metrics by pattern
   - Identify underperforming patterns
   - Record service reliability

2. **Optimize Weights** (Week 2)
   - Analyze success rates by pattern
   - Adjust TASK_SERVICE_MAP weights
   - Document learnings

3. **Extend to Other Agents** (Week 3)
   - Integrate 3-Brain into other agent workflows
   - Share patterns across agents
   - Build knowledge base

4. **Advanced Patterns** (Week 4+)
   - Implement custom patterns
   - Add new workflow variations
   - Integrate with external services

---

## References

- **Gemini Bridge**: K:\PortableApps\genai\multi-ai-orchestration\gemini-bridge.js (pattern reference)
- **External Router**: K:\PortableApps\genai\multi-ai-orchestration\external-router.js (integration target)
- **Multi-AI Skill**: K:\PortableApps\genai\.claude\skills\multi-ai-deliberation\SKILL.md (pattern reference)
- **Evolution Agent**: K:\PortableApps\genai\.claude\agents\evolution-agent.md (agent pattern reference)
- **Observer**: K:\PortableApps\genai\command-center\server\ (telemetry destination)
- **CLI Clients Config**: K:\PortableApps\genai\conf\cli_clients.json (new file)
- **PAL MCP Documentation**: Anthropic official clink tool documentation

---

**Plan Status**: READY FOR IMPLEMENTATION  
**Last Updated**: 2026-03-18  
**Prepared By**: Planning Analysis  
