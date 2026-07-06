# Evidence Units

## EU-001 Before Browser DOM

- type: browser_dom_inventory
- command: Playwright navigation to Report Studio -> RedTeam2 default tab.
- exit_code: 0
- artifact_path:
  - `browser/redteam2-default-dom-env-internal-before-20260706.json`
  - `browser/redteam2-default-dom-env-internal-before-20260706.txt`
  - `browser/redteam2-default-dom-env-internal-before-20260706.png`
- verified_at: 2026-07-06T13:32:00+09:00
- observation: `flagged_count=20`; sample lines included `nuclei_result_normalizer_agent`, Docker/WSL/environment wording, `manifest`, `Sanitizer`, and `normalizer`.

## EU-002 After Browser DOM

- type: browser_dom_inventory
- command: Playwright navigation to Report Studio -> RedTeam2 default tab after frontend copy changes.
- exit_code: 0
- artifact_path:
  - `browser/redteam2-default-dom-env-internal-after-20260706.json`
  - `browser/redteam2-default-dom-env-internal-after-20260706.txt`
  - `browser/redteam2-default-dom-env-internal-after-20260706.png`
- verified_at: 2026-07-06T13:41:00+09:00
- observation: `flagged_count=1`, `forbidden_default_hits=[]`, Docker/WSL/container/manifest/normalizer/Sanitizer/ToolActionCard/toolchain/raw API default hits 0. Remaining flagged text is global navigation `실행 런타임`.

## EU-003 Static Checks

- type: static_and_sanity_checks
- commands:
  - `node --check "J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py"`
  - `python -m json.tool "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json" > $null`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_toolchain_collection_analyst_summary_contract.py"`
- exit_code: 0
- verified_at: 2026-07-06T13:43:00+09:00
- observation: All listed checks passed. Korean copy inventory reported `2052/2266` Korean-context literals and `English-only ratio=0.0927`.

## EU-004 Completion Audit Update

- type: audit_matrix_update
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json`
- verified_at: 2026-07-06T13:45:00+09:00
- observation: Added `RTA-COMP-077`; status counts are `proved=76`, `partial=1`.
