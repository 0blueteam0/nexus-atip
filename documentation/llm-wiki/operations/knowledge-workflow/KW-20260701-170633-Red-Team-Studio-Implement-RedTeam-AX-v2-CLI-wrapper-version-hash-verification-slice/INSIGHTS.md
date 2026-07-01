---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:06:33+09:00
---

# Insight

## 관찰

- Existing `command_availability` was the correct low-risk discovery boundary.
- The current test runtime did not include FastAPI by default.

## 통찰

- Hash pinning can be introduced in three steps: manifest/preflight, approved pin management, actual runner hard-block.
- UI needs both selected-tool detail and registry table because wrapper availability is environment-specific.

## 제안

- Next slice should add operator-attested version evidence and expected SHA-256 approval workflow.
- Test bootstrap should document FastAPI/python-multipart/httpx dependencies.

## 적용 가능 범위

- RedTeam AX v2 tool registry, ToolActionCard execution planning, and Report Studio RedTeam2 UX.

## 후속 작업

- Enforce wrapper preflight in the ephemeral/container runner.
- Run live 5177/8765 browser smoke after services are restarted.

