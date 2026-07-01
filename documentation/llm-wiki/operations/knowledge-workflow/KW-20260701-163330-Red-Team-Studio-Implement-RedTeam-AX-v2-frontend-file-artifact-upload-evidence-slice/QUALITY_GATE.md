# Quality Gate

## Gate Inputs

- Scope documented: yes
- Worklog documented: yes
- Tool decision documented: yes
- Evidence units documented: yes
- Insights documented: yes
- Decision log documented: yes
- Handoff documented: yes
- Ontology edges documented: yes

## Verification Commands

| Command | Exit Code | Result |
|---|---:|---|
| `node --check J:\PortableApps\genai\projects\ai-agentic-soc\soc-frontend-vite-react\soc-frontend\idiomatic-react\src\store\methods\reports.js` | 0 | pass |
| `& .venv\Scripts\python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | 0 | pass, 32 tests |
| `& .venv\Scripts\python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` | 0 | pass, 1 test |
| `npm.cmd run build` | 0 | pass |
| `python J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\sanity\test_plan_contract.py` | 0 | pass |

## Gate Result

Status: ready_for_close

## Remaining Risk

- Live browser upload smoke still needs a restarted current backend on port 8765.
- Image/OCR redaction preview is not implemented.
