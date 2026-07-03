---
type: insights
status: complete
---

# Insights

- `status=collected` is not enough evidence for final RedTeam AX completion.
- The UI and completion workflow need explicit `completion_gate_ready` and `missing_required_tool_ids` signals.
- Toolchain collection can now serve both partial progress workflows and strict six-tool completion workflows without collapsing the two.
