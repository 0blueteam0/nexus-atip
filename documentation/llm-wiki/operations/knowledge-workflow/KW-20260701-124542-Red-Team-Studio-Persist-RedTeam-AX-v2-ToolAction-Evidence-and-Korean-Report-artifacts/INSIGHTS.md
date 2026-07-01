---
type: insights
task_id: KW-20260701-124542-Red-Team-Studio-Persist-RedTeam-AX-v2-ToolAction-Evidence-and-Korean-Report-artifacts
project: Red Team Studio
---

# Insights

- The v2 flow now has durable artifacts, so future UI reload can read backend state instead of only local React memory.
- The report generation gate writes Markdown only after zero blocker validation, aligning with the objective's final report constraints.
- The next critical gap is approval/export workflow, not report draft creation.
