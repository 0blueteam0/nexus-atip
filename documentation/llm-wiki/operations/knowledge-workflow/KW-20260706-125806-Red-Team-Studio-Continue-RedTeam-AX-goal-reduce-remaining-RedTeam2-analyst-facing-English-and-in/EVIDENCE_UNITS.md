# Evidence Units

## EU-001 Initial Browser DOM Inventory

- type: browser_dom_inventory
- command: Playwright inspection of `http://127.0.0.1:5177/` RedTeam2 default report studio view.
- exit_code: 0
- artifact_path:
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-20260706-english-internal.json`
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-20260706-english-internal.txt`
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-20260706-english-internal.png`
- verified_at: 2026-07-06T12:58:00+09:00
- observation: Initial default DOM contained 191 token matches and 71 suspicious matches, including raw API paths and internal policy/tool identifiers.

## EU-002 Fresh Browser DOM Verification

- type: browser_dom_inventory
- command: Fresh Vite restart followed by Playwright inspection of RedTeam2 default report studio view.
- exit_code: 0
- artifact_path:
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-after-copy-reduction-fresh-20260706.json`
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-after-copy-reduction-fresh-20260706.txt`
  - `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in/browser/redteam2-default-dom-after-copy-reduction-fresh-20260706.png`
- verified_at: 2026-07-06T13:14:00+09:00
- observation: Final browser result reported `forbidden_default_hits=[]`, `token_count=128`, and `suspicious_count=35`.

## EU-003 Verification Commands

- type: regression_checks
- commands:
  - `node --check "J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py"`
  - `python -m json.tool "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json" > $null`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"`
  - `python "J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_toolchain_collection_analyst_summary_contract.py"`
- exit_code: 0
- verified_at: 2026-07-06T13:00:00+09:00
- observation: All listed checks passed. Korean inventory output was `2048/2264` Korean-context literals and `English-only ratio=0.0936`.
