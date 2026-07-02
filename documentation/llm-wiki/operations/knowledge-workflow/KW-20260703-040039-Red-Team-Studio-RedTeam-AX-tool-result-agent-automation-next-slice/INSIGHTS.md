---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-03T04:00:39+09:00
---

# Insight

## 관찰

`collect_toolchain_results` already performed sanitizer, normalizer, and Evidence candidate creation. The weak point was user-visible traceability of which LLM analysis agent normalized which tool result.

## 통찰

Agent summaries should be first-class collection metadata, not just implicit fields inside normalized result artifacts. This helps prevent normalized tool output from being mistaken for approved Findings or report Claims.

## 제안

Future result flows should surface `trusted_as_instruction=false`, required human validation, and Evidence approval prerequisites in both API and Korean UI.

## 적용 가능 범위

RedTeam AX toolchain collection, imported scanner artifacts, live service report imports, and finding/claim review packages.

## 후속 작업

Apply the same summary pattern to any future service-import aggregate view and final completion audit package.
