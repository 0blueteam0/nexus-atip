---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-08T09:45:51+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- Semgrep should not be installed into the shared project `.venv` because its package pins conflict with existing RedTeam AX/Malware AX tooling.
- Isolated tool venvs are appropriate for Python-based security tools that impose broad dependency pins.
- `semgrep --json` can emit human-readable scan banners unless `--quiet` is supplied; API presets should use `--quiet --json`.
- Composite governed execution requires at least two tool steps, so single-tool smoke should use an allowed paired tool such as Bandit.
