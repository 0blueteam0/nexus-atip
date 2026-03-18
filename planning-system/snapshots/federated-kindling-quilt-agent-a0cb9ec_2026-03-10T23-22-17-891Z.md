# MCP Task/Project Management Tools Analysis

**Date**: 2026-02-05
**Objective**: Analyze MCP tools for Dashboard (localhost:7847) integration
**Status**: PLAN MODE - Analysis Complete

---

## Executive Summary

This document analyzes 5 MCP servers for task/project management integration with the Dashboard system. Each server offers unique capabilities that can be combined for a comprehensive project management solution.

---

## 1. Shrimp-Task Manager

### Available Tools (14 tools)

| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `plan_task` | Create task planning guidance | High - Feed planning data to Dashboard |
| `analyze_task` | Deep technical analysis | High - Display analysis results |
| `reflect_task` | Critical review of solutions | Medium - Quality metrics |
| `split_tasks` | Break complex tasks into subtasks | High - Task hierarchy visualization |
| `list_tasks` | Get structured task lists | **Critical** - Main data source |
| `execute_task` | Get execution guidance | Medium - Progress tracking |
| `verify_task` | Score and verify completion | High - Completion metrics |
| `delete_task` | Remove incomplete tasks | Medium - Task management |
| `clear_all_tasks` | Reset task list | Low - Admin function |
| `update_task` | Modify task details | High - Real-time updates |
| `query_task` | Search tasks | High - Filter/search UI |
| `get_task_detail` | Full task information | High - Detail views |
| `init_project_rules` | Initialize standards | Low - Setup only |
| `research_mode` | Technical research | Medium - Research tracking |

### Data Structure
```json
{
  "taskId": "UUID",
  "name": "string",
  "description": "string",
  "status": "pending|in_progress|completed",
  "dependencies": ["taskId[]"],
  "relatedFiles": [{
    "path": "string",
    "type": "TO_MODIFY|REFERENCE|CREATE|DEPENDENCY|OTHER",
    "lineStart": "number",
    "lineEnd": "number"
  }],
  "verificationCriteria": "string",
  "implementationGuide": "string"
}
```

### Dashboard Integration Points
- **Task Board**: Display tasks with status columns (Kanban-style)
- **Dependency Graph**: Visualize task dependencies
- **Progress Metrics**: Track completion rates and scores
- **File Impact View**: Show which files are affected by tasks

### Real-time Update Capability
- **Method**: Polling `list_tasks` at intervals
- **Webhook**: Not native, requires custom adapter
- **Recommended**: 5-10 second polling interval

---

## 2. VibeKanban

### Available Tools (7 tools)

| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `get_project_id_by_name` | Fuzzy project lookup | Medium - Project search |
| `get_kanban_status` | Board overview | **Critical** - Dashboard metrics |
| `create_ticket` | Create new tickets | High - Ticket creation UI |
| `update_ticket_state` | Move tickets between states | High - Drag-drop Kanban |
| `list_projects` | Get all projects | High - Project selector |
| `list_tickets` | Get tickets by project | **Critical** - Main data source |
| `add_comment` | Add ticket comments | Medium - Collaboration |

### Data Structure
```json
{
  "ticket_id": "integer",
  "project_id": "integer",
  "what": "string (summary)",
  "why": "string (reason)",
  "acceptance_criteria": "string",
  "test_steps": "string",
  "ticket_type": "1=bug, 2=story",
  "state": "backlog|in progress|done|on hold"
}
```

### Dashboard Integration Points
- **Kanban Board**: Native fit for visual board display
- **Project Overview**: Show ticket counts by state
- **Sprint Planning**: Backlog management view
- **Workflow Automation**: State transition triggers

### Real-time Update Capability
- **Method**: Polling `get_kanban_status` and `list_tickets`
- **Webhook**: Not native
- **Recommended**: 3-5 second polling for active boards

---

## 3. Task-Master-AI

### Available Tools (7 tools)

| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `get_tasks` | Get all tasks with filters | **Critical** - Main data source |
| `next_task` | Find next available task | High - Smart task suggestion |
| `get_task` | Get specific task details | High - Detail views |
| `set_task_status` | Update task status | High - Status management |
| `update_subtask` | Append info to subtask | Medium - Progress notes |
| `parse_prd` | Generate tasks from PRD | High - Automated planning |
| `expand_task` | Create subtasks from task | High - Task decomposition |

### Data Structure
```json
{
  "id": "string (e.g., '15' or '15.2' for subtask)",
  "status": "pending|in-progress|done|deferred|cancelled|blocked|review",
  "projectRoot": "absolute path",
  "tag": "string (context)",
  "subtasks": [nested]
}
```

### Dashboard Integration Points
- **AI-Powered Planning**: PRD to tasks conversion display
- **Task Suggestion**: "Next task" recommendation widget
- **Hierarchical View**: Parent/subtask tree visualization
- **Status Dashboard**: Multi-status tracking (7 states)

### Real-time Update Capability
- **Method**: Polling `get_tasks` with status filters
- **Webhook**: Not native
- **Recommended**: 5 second polling

### Unique Features
- PRD parsing for automatic task generation
- Research-backed task creation (Perplexity AI integration)
- Complexity report integration

---

## 4. Kiro-Memory

### Available Tools (25+ tools)

#### Task Management
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `create_task` | Create project tasks | High - Task creation |
| `get_tasks` | Retrieve tasks | High - Task listing |
| `update_task_status` | Change task status | High - Status updates |
| `decompose_task` | Break down complex tasks | High - Task splitting |

#### Thinking Chains
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `start_thinking_chain` | Begin problem-solving chain | Medium - AI reasoning display |
| `add_thinking_step` | Add step to chain | Medium - Progress tracking |
| `get_thinking_chain` | Retrieve full chain | Medium - Analysis view |
| `list_thinking_chains` | List recent chains | Low - History view |

#### Session Management
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `start_new_chat_session` | Begin new session | Medium - Session tracking |
| `consolidate_current_session` | Summarize session | Low - Session archive |
| `get_optimized_context` | Token-limited context | High - Context management |
| `estimate_token_usage` | Count tokens | Low - Usage metrics |

#### Project Intelligence
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `get_project_summary` | Project overview | High - Dashboard header |
| `get_project_conventions` | Get conventions | Medium - Settings display |
| `auto_learn_project_conventions` | Learn patterns | Low - Background process |
| `remember_project_pattern` | Store patterns | Low - Admin function |
| `suggest_correct_command` | Command suggestions | Medium - Helper widget |

#### System Health
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `health_check` | Server health | **Critical** - Status indicator |
| `get_performance_stats` | Performance metrics | High - Metrics dashboard |
| `get_database_stats` | DB statistics | Medium - Admin panel |
| `cleanup_old_data` | Data cleanup | Low - Maintenance |
| `optimize_memories` | Memory optimization | Low - Maintenance |

### Data Structure
```json
{
  "task_id": "string",
  "title": "string",
  "description": "string",
  "category": "feature|bug|etc",
  "priority": "low|medium|high",
  "status": "pending|in_progress|completed|cancelled"
}
```

### Dashboard Integration Points
- **Project Dashboard**: Unified project summary view
- **AI Thinking Visualization**: Show reasoning chains
- **Session Continuity**: Track conversation history
- **Health Monitoring**: Server status indicators
- **Token Usage**: Context budget display

### Real-time Update Capability
- **Method**: `get_memory_context` for contextual updates
- **Health Check**: `health_check` for status monitoring
- **Recommended**: 10 second polling for general, 30 second for health

### Unique Features
- Persistent memory across sessions
- Token optimization for context management
- Project convention learning
- Thinking chain visualization

---

## 5. Serena (Semantic Coding)

### Available Tools (20+ tools)

#### Code Intelligence
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `get_symbols_overview` | File symbol map | Medium - Code structure view |
| `find_symbol` | Locate code entities | Medium - Code navigation |
| `find_referencing_symbols` | Find references | Medium - Impact analysis |
| `replace_symbol_body` | Update code | Low - Code editing |
| `rename_symbol` | Rename across codebase | Low - Refactoring |

#### File Operations
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `read_file` | Read file content | Medium - File preview |
| `create_text_file` | Create files | Low - File creation |
| `list_dir` | Directory listing | Medium - File browser |
| `find_file` | Search files | Medium - File search |
| `search_for_pattern` | Pattern search | High - Code search |
| `replace_content` | Edit files | Low - File editing |

#### Memory System
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `write_memory` | Store project info | Medium - Knowledge base |
| `read_memory` | Retrieve memory | Medium - Context retrieval |
| `list_memories` | List all memories | High - Knowledge browser |
| `edit_memory` | Update memory | Low - Admin |
| `delete_memory` | Remove memory | Low - Admin |

#### Project Management
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `activate_project` | Switch projects | High - Project selector |
| `check_onboarding_performed` | Onboarding status | Low - Setup |
| `onboarding` | Project setup | Low - Initial setup |
| `get_current_config` | Get configuration | Medium - Settings view |
| `switch_modes` | Change operation mode | Low - Mode toggle |

#### Thinking Tools
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `think_about_collected_information` | Analyze gathered data | Low - AI processing |
| `think_about_task_adherence` | Check task alignment | Low - AI processing |
| `think_about_whether_you_are_done` | Completion check | Low - AI processing |
| `prepare_for_new_conversation` | Session reset | Low - Session management |

#### Shell Execution
| Tool | Function | Integration Potential |
|------|----------|----------------------|
| `execute_shell_command` | Run commands | High - Command execution |

### Dashboard Integration Points
- **Code Browser**: Symbol overview and navigation
- **File Explorer**: Directory and file browsing
- **Knowledge Base**: Memory/documentation browser
- **Project Switcher**: Multi-project support
- **Search Interface**: Pattern-based code search

### Real-time Update Capability
- **Method**: Event-driven (file changes)
- **Polling**: `list_dir` for file changes
- **Recommended**: On-demand for code operations

### Unique Features
- LSP-powered code intelligence
- Cross-codebase symbol manipulation
- Persistent project memory
- Mode-based operation (editing/planning)

---

## Integration Architecture Proposal

### Dashboard (localhost:7847) Integration Strategy

```
+-------------------+     +-------------------+
|                   |     |                   |
|   Dashboard UI    |<--->|  Integration API  |
|   (localhost:7847)|     |  (Node.js/Python) |
|                   |     |                   |
+-------------------+     +--------+----------+
                                  |
        +-------------------------+-------------------------+
        |           |             |            |            |
        v           v             v            v            v
+-------+---+ +-----+-----+ +-----+----+ +-----+----+ +-----+----+
| Shrimp    | | Vibe      | | Task     | | Kiro     | | Serena   |
| Task      | | Kanban    | | Master   | | Memory   | |          |
+-----------+ +-----------+ +----------+ +----------+ +----------+
```

### Data Synchronization Strategy

#### Option A: Unified Task Model (Recommended)
Create a unified task schema that maps to all systems:

```json
{
  "unified_task": {
    "id": "string",
    "source": "shrimp|vibekanban|taskmaster|kiro",
    "source_id": "original_id",
    "title": "string",
    "description": "string",
    "status": "backlog|todo|in_progress|review|done|blocked",
    "priority": "low|medium|high|critical",
    "assignee": "string|null",
    "dependencies": ["id[]"],
    "metadata": {
      "shrimp_data": {},
      "vibekanban_data": {},
      "taskmaster_data": {},
      "kiro_data": {}
    },
    "timestamps": {
      "created": "ISO8601",
      "updated": "ISO8601",
      "completed": "ISO8601|null"
    }
  }
}
```

#### Option B: Federation Model
Keep data in original systems, aggregate at query time:

```
Dashboard Query -> Parallel MCP Calls -> Merge Results -> Display
```

### Real-time Update Implementation

#### Polling Service
```javascript
// Recommended polling intervals
const POLL_INTERVALS = {
  shrimp_task: 5000,      // 5 seconds
  vibekanban: 3000,       // 3 seconds (active boards)
  task_master: 5000,      // 5 seconds
  kiro_memory: 10000,     // 10 seconds
  kiro_health: 30000,     // 30 seconds
  serena: 'on_demand'     // Event-driven
};
```

#### WebSocket Bridge (Future Enhancement)
```
MCP Servers -> Event Adapter -> WebSocket Server -> Dashboard
```

---

## Recommended Integration Phases

### Phase 1: Core Task Display (Week 1-2)
- [ ] Implement Shrimp Task `list_tasks` integration
- [ ] Implement VibeKanban `get_kanban_status` + `list_tickets`
- [ ] Create unified task view component
- [ ] Basic polling implementation

### Phase 2: Task Management (Week 3-4)
- [ ] Task creation via Shrimp `split_tasks`
- [ ] Ticket creation via VibeKanban `create_ticket`
- [ ] Status updates across systems
- [ ] Drag-drop Kanban board

### Phase 3: Intelligence Features (Week 5-6)
- [ ] Kiro-Memory `get_project_summary` for dashboard header
- [ ] Task-Master `next_task` for suggestions
- [ ] Kiro thinking chain visualization
- [ ] Health status monitoring

### Phase 4: Code Integration (Week 7-8)
- [ ] Serena `list_memories` for knowledge base
- [ ] Serena `search_for_pattern` for code search
- [ ] File browser with `list_dir`
- [ ] Symbol overview integration

### Phase 5: Advanced Features (Week 9+)
- [ ] Task-Master PRD parsing UI
- [ ] Cross-system task synchronization
- [ ] AI-powered task decomposition
- [ ] Real-time collaboration features

---

## API Endpoint Mapping

| Dashboard Feature | Primary MCP | Fallback MCP |
|-------------------|-------------|--------------|
| Task List | `shrimp_task.list_tasks` | `kiro_memory.get_tasks` |
| Kanban Board | `vibekanban.list_tickets` | `shrimp_task.list_tasks` |
| Project Overview | `kiro_memory.get_project_summary` | `vibekanban.get_kanban_status` |
| Task Creation | `shrimp_task.split_tasks` | `vibekanban.create_ticket` |
| Status Update | `shrimp_task.verify_task` | `vibekanban.update_ticket_state` |
| Next Task | `task_master.next_task` | `shrimp_task.execute_task` |
| Health Check | `kiro_memory.health_check` | N/A |
| Code Search | `serena.search_for_pattern` | Built-in Grep |
| Memory/Docs | `serena.list_memories` | `kiro_memory.get_memory_context` |

---

## Conclusion

The 5 MCP servers provide comprehensive coverage for task/project management:

| Server | Primary Strength | Dashboard Role |
|--------|------------------|----------------|
| **Shrimp-Task** | Structured task planning | Main task engine |
| **VibeKanban** | Visual workflow management | Kanban visualization |
| **Task-Master-AI** | AI-powered task generation | Smart suggestions |
| **Kiro-Memory** | Persistent context & health | Memory & monitoring |
| **Serena** | Code intelligence | Code browser & search |

**Recommendation**: Start with Shrimp-Task + VibeKanban for core task management, add Kiro-Memory for project context, then integrate Task-Master for AI features and Serena for code awareness.

---

## Next Steps

1. Confirm Dashboard tech stack (React/Vue/Svelte?)
2. Define API contract for integration layer
3. Set up polling/update mechanism
4. Create unified task model adapter
5. Implement Phase 1 features

---

*Document generated: 2026-02-05*
*Plan ID: federated-kindling-quilt-agent-a0cb9ec*
