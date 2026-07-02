---
type: handoff
status: active
project: Red Team Studio
updated: 2026-07-02T17:20:57+09:00
---

# Handoff

## Current State

Strict live readiness promotion is implemented and visible in API/UI. Current promotion is blocked.

## Next Command

```powershell
.\.venv\Scripts\python.exe "Red Team Studio\고도화\sanity\redteam_ax_strict_live_readiness_promotion.py" --allow-container --allow-network --require-promotion
```

Run this only after Docker daemon, WSL distro, OpenVAS/ZAP endpoints, and vault refs are prepared.
