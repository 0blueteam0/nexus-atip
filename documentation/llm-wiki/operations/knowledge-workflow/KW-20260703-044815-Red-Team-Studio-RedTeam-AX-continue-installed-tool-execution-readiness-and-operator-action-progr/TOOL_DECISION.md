# Tool Decision

- Used targeted rg/Get-Content inspection to locate runtime readiness and UI rendering points.
- Used apply_patch for source/test/document edits.
- Used existing pytest and sanity harnesses for verification.
- Did not execute Docker, WSL, scanner, OpenVAS/ZAP network import, active scan, or shell-expanded commands.
