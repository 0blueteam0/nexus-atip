# Decision Log

## DEC-S21-001

Decision: Add `/tool-runs/{run_id}/import-file/upload` rather than changing existing `/import-file`.

Reason: Existing `/import-file` is a strict JSON API for local workspace paths. Keeping it unchanged preserves tests and allows browser multipart to be an adapter.

## DEC-S21-002

Decision: Save multipart uploads under `archive/runs/redteam-ax-v2/<case>/upload-inbox/<run_id>/`.

Reason: This keeps files inside the project workspace so the existing path boundary check can verify them.

## DEC-S21-003

Decision: Run sanitizer preview and agent analyze after upload in the frontend.

Reason: The user requirement is not only upload, but evidence-trackable analysis of tool results by LLM-linked agents.
