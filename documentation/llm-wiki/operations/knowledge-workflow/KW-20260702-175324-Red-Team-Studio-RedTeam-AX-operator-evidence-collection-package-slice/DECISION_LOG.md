---
type: decision_log
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
---

# Decision Log

| decision | outcome | reason |
|---|---|---|
| Keep RTA-COMP-015 partial | accepted | Docker/WSL/OpenVAS/ZAP strict live evidence is still missing |
| Add package as sanity artifact, not runtime command | accepted | safe-by-default and no unapproved high-risk execution |
| Require human validation | accepted | evidence attachments must be reviewed before finding/report use |
| Force-add generated artifacts later | accepted | repo `.gitignore` ignores `projects/`; exact artifact paths are needed for evidence continuity |
