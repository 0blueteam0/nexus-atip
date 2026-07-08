# Tool Decision

detect-secrets 1.5.0 is selected because SPEC 23 explicitly lists it for secret scan and it complements the already-promoted Gitleaks runner. It is a low-risk local tool when limited to approved workspaces and clean/redacted fixtures.

Allowed runner: `.venv/Scripts/detect-secrets.exe scan --all-files .` in `고도화/samples/detect_secrets_workspace`.
Denied runner scope: `audit`, `--baseline`, arbitrary source paths, actual credential fixtures, and treating tool output as an LLM/MCP instruction.
