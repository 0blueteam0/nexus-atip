# Work Command Decisions

## D1: Multipart Endpoint as Adapter

The backend route accepts multipart form data but does not create a separate trust model. It writes the upload into the case workspace and then reuses strict `import_tool_run_file()`. This keeps workspace boundary checks, SHA-256 verification, schema validation, ToolRunRecord mutation, and audit artifacts in one path.

## D2: Browser Hash Before Upload

The frontend computes SHA-256 with `crypto.subtle.digest` before upload. The server still recomputes and rejects mismatches. This gives analysts immediate provenance visibility and prevents the UI from implying that user-provided filenames are sufficient evidence.

## D3: Upload Then Sanitizer Then Agent Analyze

The UI executes sanitizer preview before showing normalized parser output. This reflects RedTeam AX's rule that tool output is untrusted data, never instructions.

## D4: Live Smoke Deferred

Source and TestClient verification passed. Live browser upload smoke remains pending because the last known live 8765 process may be stale and should be restarted before UI smoke.
