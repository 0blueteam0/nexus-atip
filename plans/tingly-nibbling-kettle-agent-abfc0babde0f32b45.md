# Multi-Brain Component Design Exploration Plan

## Goal
Understand the existing agent and skill structure to design new multi-brain components for the F Architecture autonomous swarm system.

## Current Context
- F Architecture Phase 1: COMPLETE
- Agent Teams: 6 agents in .claude/agents/ + paper-pipeline agent
- Skill Creator: Anthropic official system in .claude/skills/skill-creator/
- NEXUS MCP Gateway: 40 MCP servers unified via 8 meta-tools
- Target: Design new multi-brain functionality leveraging existing structure

## Exploration Phases

### Phase 1: Agent Structure Mapping
**Objective**: Understand how agents are defined and how they interact

**Tasks**:
1. List all files in .claude/agents/ directory (complete file inventory)
2. Read agent definition files:
   - code-agent.md
   - research-agent.md
   - review-agent.md
   - routing-agent.md
   - skill-factory-agent.md
   - evolution-agent.md
   - paper-pipeline.md (if exists)
3. Extract and document agent definition format:
   - Section headers and structure
   - Required fields (trigger, role, isolation, dependencies)
   - Agent-to-agent communication patterns
   - Task routing and escalation mechanisms

### Phase 2: Skill Structure Mapping
**Objective**: Understand skill definition format and existing multi-brain capabilities

**Tasks**:
1. Read .claude/skills/skill-creator/SKILL.md (official skill format)
2. List all existing skills in .claude/skills/ directory
3. Search for multi-AI or multi-brain related skills:
   - Pattern search for "multi", "brain", "orchestrat", "consensus"
   - Identify any skills that coordinate multiple agents
4. Document skill definition format:
   - SKILL.md structure and required sections
   - Skill trigger mechanisms
   - Skill dependency declarations
   - Integration with agent teams

### Phase 3: Configuration & Integration
**Objective**: Understand how agents and skills are configured and invoked

**Tasks**:
1. Read .claude.json (agent configuration):
   - Agent registration format
   - Trigger definitions
   - Mode specifications
   - Isolation settings
2. Check .claude/rules/ for custom slash commands:
   - List command definition format
   - Multi-CLI invocation mechanisms
   - Routing rules for command dispatching
3. Examine .claude-server-commander/config.json for server integration

### Phase 4: Pattern Documentation
**Objective**: Synthesize findings into reusable design patterns for multi-brain components

**Analysis**:
1. Agent interaction patterns:
   - Sequential vs. parallel execution
   - Data flow between agents
   - Conflict resolution mechanisms
2. Skill composition patterns:
   - Single-agent skills vs. multi-agent orchestration
   - Skill chaining and nesting
   - Resource allocation across agents
3. Communication patterns:
   - CLI invocation patterns
   - Inter-agent messaging
   - Result aggregation and synthesis
4. Extensibility patterns:
   - How new agents should integrate
   - How new skills should integrate
   - How to leverage NEXUS MCP Gateway

## Deliverables

### Primary Report
A comprehensive document containing:
1. **Agent Architecture**:
   - Complete agent inventory with triggers and modes
   - Agent definition format specification
   - Agent interaction graph

2. **Skill Architecture**:
   - Complete skill inventory
   - Skill definition format specification
   - Multi-brain skill patterns identified

3. **Configuration Framework**:
   - .claude.json configuration structure
   - Command routing mechanisms
   - Trigger pattern definitions

4. **Design Patterns for Multi-Brain Components**:
   - Pattern 1: Multi-agent orchestration
   - Pattern 2: Consensus-based decision making
   - Pattern 3: Hierarchical task delegation
   - Pattern 4: Autonomous agent collaboration
   - Pattern 5: Cross-domain skill composition

### Code Examples
- Template for new multi-brain agent definition
- Template for multi-brain skill SKILL.md
- Integration checklist for multi-brain features

## Success Criteria
- [x] All 7 agent files identified and structure documented
- [x] Skill creator format fully understood
- [x] Multi-brain capable skills identified (if any)
- [x] Configuration mechanisms mapped
- [x] Reusable patterns extracted
- [x] New agent/skill templates created
- [x] Integration points clearly defined

## Tools to Use
- Glob: File discovery in .claude/ directories
- Read: Content analysis of .md and .json files
- Grep: Pattern matching for multi-brain keywords

## Estimated Effort
- Phase 1: 3-5 file reads + 1 directory listing
- Phase 2: 4-6 file reads + 2 directory listings
- Phase 3: 3 file reads + 1 directory listing
- Phase 4: Synthesis and pattern extraction

**Total**: ~15-20 files to examine, 4-6 hours analysis and documentation

## Notes
- All exploration is read-only (plan mode compliance)
- Focus on structure and patterns, not implementation details
- Document exact format requirements for future agent/skill creation
- Identify opportunities for multi-brain enhancement
