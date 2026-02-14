# n8n Automation Server

## Overview
n8n workflow automation server for Task Management Ecosystem integration.

## Quick Start

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 2. Start n8n
docker compose up -d

# 3. Access n8n
# Open http://localhost:5678
# Login with N8N_USER / N8N_PASSWORD
```

## Integration with Ecosystem

### MCP Server (Already configured in .claude.json)
```json
"n8n": {
  "command": "node.exe",
  "args": ["n8n-mcp-server/build/index.js"],
  "env": {
    "N8N_API_KEY": "${N8N_API_KEY}",
    "N8N_HOST": "${N8N_HOST}"
  }
}
```

### Available Workflows (n8n-workflows/)
- `research-pipeline.json` - Research automation
- `pr-review-automation.json` - PR review workflow
- `daily-cve-report.json` - Daily CVE report

## Trigger from Hub

The Unified Task Hub can trigger n8n workflows:

```javascript
// Example: Trigger workflow on task completion
hub.on('task:completed', async (task) => {
  if (task.triggerWorkflow) {
    await n8nClient.triggerWorkflow(task.triggerWorkflow, task);
  }
});
```

## Docker Network

This container joins `plan-ecosystem-network` which includes:
- plan-ecosystem-dashboard (7847)
- redis (6380)
- firecrawl (3002)
- searxng (8082)

## Ports
- **5678**: n8n Web UI & API

## Volumes
- `./n8n-data`: Persistent data (workflows, credentials)
- `../../../n8n-workflows`: Shared workflow templates (read-only)

## Health Check
```bash
curl http://localhost:5678/healthz
```

## Troubleshooting

### Container won't start
```bash
# Check network exists
docker network ls | grep plan-ecosystem

# Create if missing
docker network create plan-ecosystem-network
```

### Permission issues
```bash
# Fix n8n-data permissions
chmod -R 777 n8n-data
```
