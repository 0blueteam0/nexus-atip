# Decision Log

- Decision: Register Gitleaks as `TOOL-GITLEAKS-001` optional runner, not required core coverage.
  Rationale: It expands the tool catalog and button execution path without implying completion of mandatory Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP coverage.

- Decision: Keep binaries and zip archives out of git; track manifest, hash, sample workspace, code, tests, and plans.
  Rationale: Repository should preserve reproducible trust metadata without committing large operational install artifacts.

- Decision: Store no secret value, only redacted match/evidence metadata.
  Rationale: RedTeam AX evidence may include sensitive data; secret exposure findings require HITL review before promotion.
