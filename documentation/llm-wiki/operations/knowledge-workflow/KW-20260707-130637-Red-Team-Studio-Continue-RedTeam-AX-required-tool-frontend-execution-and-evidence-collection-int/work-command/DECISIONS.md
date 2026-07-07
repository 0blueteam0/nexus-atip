# Decisions

| decision | status | rationale |
|---|---|---|
| Use official Nuclei release binary instead of Go install | accepted | Go was not available; official Windows release binary supports practical local install |
| Install under `Red Team Studio/고도화/tools/nuclei` | accepted | Keeps required tool close to RedTeam AX project and discoverable without global PATH mutation |
| Do not commit binary/archive | accepted | Source control should carry contracts and docs, not downloaded executables |
| Keep Nuclei high-risk approval gate | accepted | Nuclei target scanning can affect external systems and must remain ROE/HITL governed |
| Treat this as partial goal progress only | accepted | Full six-tool operational E2E and final gates remain incomplete |
