# NEXUS Architect Configuration
# Network of Evolving eXtensible Unified Services
# Version: 1.0.0 | Updated: 2026-02-24

> Single Source of Truth for all multi-AI orchestration.
> Parsed by nexus/core/config-parser.js into runtime config.

---

## Providers

### claude-code
- command: K:/PortableApps/genai/claude.bat
- mode: session_mcp | headless_cli
- headless: K:/PortableApps/genai/claude.bat -p "{prompt}" --output-format json
- strengths: [mcp_tools, architecture, long_sessions, code_generation, file_editing, git_ops]
- weaknesses: [cost_per_session, slower_startup]
- cost_tier: included
- cost_note: Max subscription - no per-token cost
- context: 200K
- role: primary_orchestrator
- enabled: true
- health_check: claude --version

### gemini-cli
- command: K:/PortableApps/genai/gemini.bat
- strengths: [web_search, 1M_context, fast_response, multimodal, large_file_analysis]
- weaknesses: [occasional_hallucination, limited_tool_use]
- cost_tier: free
- cost_note: Free tier with Gemini CLI
- context: 1000000
- role: collaborator
- enabled: true
- health_check: gemini --version

### codex-cli
- command: K:/PortableApps/genai/codex.bat
- strengths: [autonomous_coding, sandboxed_execution, fast_iteration, full_auto_mode]
- weaknesses: [api_cost, limited_context]
- cost_tier: api_usage
- cost_note: Uses OpenAI API credits
- context: 128000
- role: specialist
- approval_mode: full-auto
- enabled: true
- health_check: codex --version

---

## Routing Rules

### Task-Provider Mapping
| Task Type | Primary | Secondary | Tertiary | Condition |
|-----------|---------|-----------|----------|-----------|
| code_generation | claude-code | codex-cli | gemini-cli | default |
| code_review | gemini-cli | claude-code | - | file_size > 300 lines -> gemini |
| architecture | claude-code | gemini-cli | - | always claude first |
| web_research | gemini-cli | claude-code | - | gemini has free search |
| large_file | gemini-cli | claude-code | - | file > 50KB -> gemini 1M ctx |
| quick_fix | codex-cli | claude-code | - | sandbox safe |
| security_audit | claude-code | gemini-cli | - | mcp tools needed |
| documentation | gemini-cli | claude-code | - | fast, free |
| testing | codex-cli | claude-code | - | sandbox execution |
| refactoring | claude-code | codex-cli | gemini-cli | multi-file awareness |
| translation | gemini-cli | claude-code | - | multilingual strength |
| data_analysis | gemini-cli | claude-code | - | 1M context for large datasets |
| cross_verify | ALL | - | - | consensus required |

### Routing Strategy
- default: adaptive_weighted
- fallback_chain: [primary -> secondary -> tertiary -> local_only]
- max_retries: 3
- timeout_ms: 60000

### Complexity Routing
| Complexity | Score | Provider | Reason |
|------------|-------|----------|--------|
| trivial | 0-4 | codex-cli | fast sandbox |
| simple | 5-7 | gemini-cli | free + fast |
| medium | 8-12 | claude-code | mcp tools |
| complex | 13+ | claude-code + gemini-cli | orchestrated |

---

## Cost Controls

### Budget
- daily_limit_usd: 5.00
- weekly_limit_usd: 25.00
- monthly_limit_usd: 80.00
- alert_threshold: 0.8

### Tiering Strategy
- free_first: true
- order: [gemini-cli, claude-code, codex-cli]
- claude_code_note: included in Max subscription (no API cost)
- codex_cli_note: OpenAI API cost per token

### Cost Tracking
- log_file: nexus/knowledge/cost-log.json
- track_per_session: true
- track_per_provider: true

---

## Workflow Patterns

### Registered Workflows
| ID | Name | Template | Trigger |
|----|------|----------|---------|
| W001 | builder-reviewer | templates/builder-reviewer.yaml | "review", "check code" |
| W002 | planner-implementer | templates/planner-implementer.yaml | "build", "create", "implement" |
| W003 | cross-verification | templates/cross-verification.yaml | "verify", "cross-check" |
| W004 | parallel-worktree | templates/parallel-worktree.yaml | "parallel", "concurrent" |
| W005 | detection-fix-loop | templates/detection-fix-loop.yaml | "auto-fix", "detect and fix" |
| W006 | model-tiering | templates/model-tiering.yaml | auto (complexity-based) |
| W007 | queen-led-swarm | templates/queen-led-swarm.yaml | "swarm", "distribute" |
| W008 | file-size-routing | templates/file-size-routing.yaml | auto (file-size-based) |

### Default Workflow
- simple_task: direct_route
- complex_task: planner-implementer
- review_task: builder-reviewer

---

## Evolution Settings

### Weight Adjustment
- learning_rate: 0.05
- decay_factor: 0.95
- min_weight: 0.05
- max_weight: 0.95
- normalization: true
- persistence: nexus/evolution/evolution-state.json

### Pattern Learning
- min_observations: 5
- confidence_threshold: 0.7
- max_patterns: 1000
- prune_below_confidence: 0.3
- pattern_store: nexus/knowledge/pattern-library.json

### Discovery
- auto_discover: true
- discovery_interval_sessions: 5
- sources: [github_trending, npm_registry, anthropic_docs, community]

---

## Self-Evolution Schedule

### Per-Session (automatic)
- on_start: [load_state, health_check, restore_weights]
- on_end: [adjust_weights, extract_patterns, log_evolution, save_state]

### Every 5 Sessions
- auto_research: true
- research_targets:
  - github: "trending MCP servers, AI CLI tools"
  - npm: "@google/gemini-cli, @openai/codex new versions"
  - anthropic: "Claude Code new features"
  - community: "multi-agent patterns, best practices"
- output: nexus/self-evolution/research-findings/

### Monthly
- deep_review: true
- actions: [weight_trend_analysis, pattern_cleanup, cost_optimization, evolution_report]

---

## Integration Points

### ATOS Bridge
- recommendation_engine: atos/recommendation-engine.js
- feedback_loop: atos/feedback-loop.js
- complexity_detector: atos/complexity-detector.js
- file_lock: atos/file-lock.js

### Multi-AI Bridge
- external_router: multi-ai-orchestration/external-router.js
- consensus_engine: multi-ai-orchestration/consensus-engine.js
- gemini_bridge: multi-ai-orchestration/gemini-bridge.js

### Hooks
- session_start: nexus-init
- pre_route: nexus-route
- session_end: nexus-learn

---

## Metadata
- created: 2026-02-24
- author: NEXUS Auto-Config
- schema_version: 1.0.0
- parser: nexus/core/config-parser.js
- cache: nexus/nexus.config.json
