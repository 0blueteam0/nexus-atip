---
type: insights
status: complete
project: Red Team Studio
created: 2026-07-03T00:36:03+09:00
---

# Insights

- The previous lane proved runner-produced artifacts but did not cleanly model high-risk scanner results performed by humans or exported from services.
- `offline_parse` imported outputs are the correct bridge for high-risk tools because they avoid active scan execution from the web app.
- `imported_count` is an important audit signal that separates API command execution from operator/service result attachment.
- The full goal remains incomplete until real operating outputs pass the same path.
