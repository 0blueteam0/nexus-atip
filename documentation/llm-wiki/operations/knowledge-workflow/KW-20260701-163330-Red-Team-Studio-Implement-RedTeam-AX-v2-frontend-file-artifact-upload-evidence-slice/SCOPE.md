# Scope

- project: Red-Team-Studio
- task: Implement RedTeam AX v2 frontend file artifact upload evidence slice
- slice: Slice 21 multipart tool output upload UX/API
- started_at: 2026-07-01T16:33:30+09:00

## Objective

Advance the active RedTeam AX goal by connecting browser-selected tool output files to the existing evidence-first ingestion flow.

## In Scope

- Add a multipart upload endpoint for ToolRunRecord file artifacts.
- Preserve strict SHA-256 verification and local workspace boundary behavior by reusing `/tool-runs/{run_id}/import-file`.
- Add `레드팀 분석2` UI controls for file selection, browser SHA-256 calculation, multipart upload, sanitizer preview, and agent analysis.
- Display ToolArtifactImport schema validation, stored artifact path, parser result, and trust invariant state in the UI.
- Update `FINAL_PLAN.md`.
- Add and run focused backend/API, sample E2E, frontend syntax/build, and plan sanity tests.

## Out Of Scope

- External SSO/IdP integration.
- Live Playwright browser upload smoke against a restarted 8765 backend.
- Image/OCR sensitive visual redaction preview.
- Real scanner CLI/container installation automation.
