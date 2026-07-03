---
type: scope
task_id: KW-20260703-115717-Red-Team-Studio-RedTeam-AX-WSL-readiness-blocker-narrowing
project: Red Team Studio
task: RedTeam AX WSL readiness blocker narrowing
created: 2026-07-03T11:57:17+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the persistent RedTeam AX goal by reducing RTA-COMP-015 runtime blockers. This slice narrows WSL readiness from a generic failed default distro start to an evidence-backed alternate distro fallback.

## Included

- Inspect current WSL readiness artifact and script behavior.
- Probe default and alternate WSL distributions with low-risk tool path commands.
- Update WSL readiness checker to preserve failed default probe and select a usable alternate distro.
- Add regression coverage for fallback selection.
- Update completion audit, LLM Wiki, FINAL_PLAN.md, and Detailed_PLAN.MD.
- Run accepted gates and completion review.

## Excluded

- Do not repair/delete/import WSL distributions.
- Do not execute active scanner/network scans.
- Do not configure organization OpenVAS/ZAP endpoints or vault refs.
- Do not mark the thread goal complete while real external scanner and operating closure evidence remain unresolved.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| wsl_probe | Probe default and alternate WSL distros | latest_wsl_runtime_readiness.json |
| fallback_fix | Add fallback order and blocker classification | redteam_ax_wsl_runtime_readiness.py |
| regression | Mock default failure and alternate success | tests/test_redteam_ax_wsl_runtime_readiness.py |
| audit_update | Remove WSL remaining gap while keeping goal blocked | completion audit matrix and docs |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| WSL readiness | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json` | Shows selected alternate distro ready |
| Strict promotion | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json` | Shows Docker+WSL passed and external scanner blockers remain |
| Accepted gates | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 27/27 gate proof |
| Completion review | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-REDTEAM-AX-GOAL/goal-completion-reviews` | Confirms goal remains blocked with 3 remaining gaps |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
