---
type: tool_decision
status: complete
---

# Tool Decision

| need | selected_tool | reason | alternative |
|---|---|---|---|
| Locate specs and code | `rg`, PowerShell reads | Fast local inspection with UTF-8 handling | broad filesystem walk |
| Edit files | `apply_patch` | Scoped, reviewable changes | ad hoc shell writes |
| Verify Python | `.venv/Scripts/python.exe` | Project environment has FastAPI/test deps | system Python |
| Track work | `knowledge_workflow.py` | Project rule requires evidence session | informal notes |

No active scanner, network scanner, OpenVAS, or OWASP ZAP command was executed in this slice.
