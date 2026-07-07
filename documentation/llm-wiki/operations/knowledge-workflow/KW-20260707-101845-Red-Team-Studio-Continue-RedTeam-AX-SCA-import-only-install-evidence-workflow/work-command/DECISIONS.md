# Decisions

- SCA install evidence is modeled as SBOM/SCA export validation, not CLI version execution.
- The API requires a real workspace-local artifact path to avoid evidence-less claims.
- The API computes SHA-256 and stores it in `source_import_artifact`.
- The registry row gets `operator_attested_import_artifact` so SCA coverage source is visible.
- RedTeam2 places the action in the admin operating artifacts area.
- The action does not execute scanner commands and does not unlock runners.
