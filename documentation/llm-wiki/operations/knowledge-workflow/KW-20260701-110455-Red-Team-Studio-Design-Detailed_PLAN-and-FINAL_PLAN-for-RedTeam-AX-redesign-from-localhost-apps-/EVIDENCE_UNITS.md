---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-01T11:04:55+09:00
---

# Evidence Unit

## Claim

The RedTeam AX redesign plan is grounded in the requested ChatShare conversation, full Red Team Studio folder inventory, existing frontend/backend source, and previous work-folder index.

## Source

- source_type: local_file
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`
- command: `python J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py`
- exit_code: 0
- collected_at: 2026-07-01T11:00:00+09:00

- source_type: chatshare
- path_or_url: `https://chatgpt.com/share/6a4471ca-75b0-83ee-a10d-8d36dee74aa7`
- command: `python C:/Users/alos/.codex/skills/chatshare-artifact-lab/scripts/chatshare-artifact-lab_extract.py ... --no-download`
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/chatshare-output/chatgpt/레드팀_수행과정_20260701-110739.HANDOFF_PACKAGE_MANIFEST.json`

- source_type: folder_inventory
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio`
- command: PowerShell `Get-ChildItem -Recurse -File`
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/RED_TEAM_STUDIO_FILE_MANIFEST.json`

## Evidence

- ChatShare extraction status: `likely-shared-chat`.
- ChatShare artifact completeness: `complete_for_public_snapshot`.
- ChatShare code blocks: 27.
- Hidden/login-gated artifact count: 0.
- Red Team Studio file count: 4687.
- Red Team Studio byte sum: 248385237.
- Plan sanity: pass.
- ChatShare handoff validation: pass.

## Confidence

High for planning scope and local file existence. Medium for live frontend/backend state because ports 5177 and 8765 were unavailable during inspection.

## Limits

- The frontend and backend servers were not running at `127.0.0.1:5177` and `127.0.0.1:8765`; live UI/API screenshots remain future implementation validation.
- The ChatShare package was extracted with `--no-download`, and no provider download candidates were found.

## Related Decisions

- Keep existing `redteam` tab as regression baseline.
- Add `redteam2` as isolated state/API namespace.
- Use LLM wiki manifest instead of embedding all file contents into one document.

