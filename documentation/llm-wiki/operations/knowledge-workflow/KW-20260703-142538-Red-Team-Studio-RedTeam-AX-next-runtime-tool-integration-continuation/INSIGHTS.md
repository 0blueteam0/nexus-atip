---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-03T14:25:38+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- The service import API already created ToolRun, sanitizer, normalized result, and Evidence candidate records.
- The missing workflow link was not parsing or evidence creation; it was a saved `toolchain-runs` projection so RedTeam2 and `/collect-results` could continue from the imported service result.
- Adding optional `toolchain_id` preserves the existing standalone service import API while enabling beginner-facing guided continuation.
- Single OpenVAS/ZAP service import collection remains partial by design because six-tool required coverage is still incomplete.
