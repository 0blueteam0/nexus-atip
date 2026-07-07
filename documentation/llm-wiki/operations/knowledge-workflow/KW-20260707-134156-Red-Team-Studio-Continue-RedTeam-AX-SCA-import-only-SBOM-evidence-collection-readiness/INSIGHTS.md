# Insights

- SCA in RedTeam AX is intentionally import-only; execution readiness should stay as 결과 첨부, not runner execution.
- Existing tests had inline CycloneDX JSON, but no stable sample file under 고도화/samples; this made the beginner-facing import path less reproducible.
- Exposing default_sample_artifact_path in both preset and import guidance creates a single UI/API contract for education and smoke verification.
- Raw SBOM content remains untrusted data; it can create Evidence candidates but cannot become a report claim without review/approval gates.
