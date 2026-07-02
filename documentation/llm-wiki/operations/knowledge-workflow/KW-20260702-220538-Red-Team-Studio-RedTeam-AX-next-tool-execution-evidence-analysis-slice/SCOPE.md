---
type: scope
task_id: KW-20260702-220538-Red-Team-Studio-RedTeam-AX-next-tool-execution-evidence-analysis-slice
project: Red Team Studio
task: RedTeam AX next tool execution evidence analysis slice
created: 2026-07-02T22:05:38+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- See implemented Tool Result LLM Analysis Brief scope below.

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
# Scope

- project: Red Team Studio
- task: RedTeam AX next tool execution evidence analysis slice
- slice: Tool Result LLM Analysis Brief

## Included

- Add a safe-by-default artifact builder that reads latest governed npm audit, Nuclei, Trivy, OpenVAS, and OWASP ZAP outputs.
- Group run/result/evidence-linked tool results into an LLM/RAG consumable evidence pack.
- Keep blocked scanner/runtime conditions separate from proved evidence.
- Expose the brief through runtime readiness API and the Korean RedTeam2 runtime readiness panel.
- Add sanity and accepted gate coverage.

## Excluded

- No new active scan.
- No Docker or WSL repair.
- No OpenVAS/ZAP organization endpoint calls without explicit operator environment.
- No automatic Finding approval or final report claim promotion.
