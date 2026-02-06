# Plan Ecosystem Dashboard

Real-time planning and task management dashboard for Claude Code environments.

## Features

- **Plan Management**: Track markdown-based plans with progress visualization
- **Task Integration**: Unified view of tasks from multiple sources (Shrimp, TaskMaster, MCP)
- **Project Hierarchy**: Organize plans into projects with lifecycle tracking
- **Workflow Visualization**: RIPER+ workflow state with Mermaid diagrams
- **MCP Integration**: Direct SQLite bridge to vibekanban and kiro-memory
- **Real-time Updates**: Socket.io powered live data synchronization
- **Insights Engine**: Pattern analysis and predictive suggestions

## Quick Start

### Docker (Recommended)

```bash
docker compose up -d
```

Dashboard available at: http://localhost:7847

### Manual

```bash
npm install
npm start
```

## Architecture

```
plan-ecosystem/
├── server.js           # Express + Socket.io server
├── collectors/         # Data collection modules
│   ├── plan-collector.js
│   ├── task-collector.js
│   ├── lifecycle-collector.js
│   ├── workflow-collector.js
│   ├── insight-engine.js
│   ├── mcp-bridge.js
│   └── project-manager.js
├── public/             # Frontend assets
│   ├── index.html
│   ├── css/
│   └── js/
└── plugins/            # Optional plugins
```

## API Endpoints

### Core APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Dashboard statistics |
| `GET /api/plans` | Plan list with progress |
| `GET /api/plans/:id` | Plan details |
| `GET /api/tasks` | Unified task list |
| `GET /api/projects` | Project hierarchy |

### Workflow APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/workflows` | All workflow data |
| `GET /api/workflows/current` | Active RIPER+ phase |
| `GET /api/workflows/mermaid` | Mermaid diagram |

### MCP Integration APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/mcp/status` | MCP server status |
| `GET /api/mcp/tasks` | Unified MCP tasks |
| `GET /api/mcp/vibekanban/projects` | Kanban projects |
| `GET /api/mcp/vibekanban/tickets` | Kanban tickets |
| `GET /api/mcp/kiro/tasks` | Kiro memory tasks |

### Insights APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/insights/stats` | Analysis statistics |
| `GET /api/insights/suggestions` | AI suggestions |
| `GET /api/insights/patterns` | Detected patterns |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 7847 | Server port |
| `BASE_PATH` | `/data` | Data mount path (Docker) |
| `NODE_ENV` | production | Environment |

### Docker Volumes

```yaml
volumes:
  - ./plans:/data/plans:ro
  - ./planning-log:/data/planning-log:rw
  - ./ShrimpData:/data/ShrimpData:ro
  - ./mcp-servers/vibekanban/instance:/data/mcp-servers/vibekanban/instance:ro
  - ./data/kiro-memory:/data/data/kiro-memory:ro
```

## Socket.io Events

### Server to Client

| Event | Description |
|-------|-------------|
| `init` | Initial data payload |
| `plans-updated` | Plan changes |
| `tasks-updated` | Task changes |
| `workflow-phase-changed` | RIPER+ phase change |
| `lifecycle-updated` | Lifecycle progress |
| `mcp-status-updated` | MCP server status |

## UI Tabs

1. **Projects** - Project hierarchy and overview
2. **Plans** - Plan list with lifecycle view
3. **Tasks** - Unified task management
4. **MCP** - MCP server integration
5. **Workflows** - RIPER+ visualization
6. **Tools** - Tool usage statistics
7. **Agents** - Agent activity tracking
8. **Skills** - Skill activations
9. **Prompts** - Prompt history
10. **Timeline** - Activity timeline
11. **System** - System graph
12. **Costs** - Cost tracking

## Design System

Uses **Soft UI 2.0** with Anti-AI-Slop color palette:

- Primary: Teal (#0F766E)
- Secondary: Emerald (#059669)
- Accent: Sky (#0284C7)
- Warning: Amber (#D97706)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build Docker image
docker compose build
```

## License

MIT License - See LICENSE file

## Contributing

See CONTRIBUTING.md for guidelines.
