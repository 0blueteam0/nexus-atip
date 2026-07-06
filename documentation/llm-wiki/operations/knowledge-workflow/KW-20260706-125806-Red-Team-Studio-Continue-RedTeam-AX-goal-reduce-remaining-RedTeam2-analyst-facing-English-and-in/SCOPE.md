# Scope

- Project: Red-Team-Studio
- Task: Continue RedTeam AX goal by reducing remaining RedTeam2 analyst-facing English and internal identifiers in the default report studio DOM.
- Workspace: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio`
- Frontend target: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- Documentation targets: `FINAL_PLAN.md`, `Detailed_PLAN.MD`, `고도화/llm-wiki/LLM_WIKI_HOME.md`, completion-audit files, and sanity contracts.
- Out of scope: backend contract changes, execution engine changes, destructive cleanup of unrelated dirty worktree files, or claiming full RedTeam AX completion.

This session covers a focused analyst-facing presentation improvement. Backend IDs, API paths, action IDs, and tool identifiers remain available to backend/admin/debug flows, but the default analyst page should present Korean operational labels.
