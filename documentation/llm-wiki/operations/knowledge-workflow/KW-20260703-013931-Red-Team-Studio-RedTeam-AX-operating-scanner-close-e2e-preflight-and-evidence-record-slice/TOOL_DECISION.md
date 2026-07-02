# Tool Decision

## Selected Tools

- `rg`: locate existing toolchain manifest, close-e2e, frontend, and test patterns.
- `apply_patch`: edit backend, router, frontend, tests, sanity, and documentation files.
- `.venv/Scripts/python.exe -m pytest`: verify API behavior.
- `.venv/Scripts/python.exe`: run Red Team Studio sanity scripts.
- `node --check`: verify frontend JavaScript syntax.
- `knowledge_workflow.py`: open and later close the evidence session.

## Decision

Reuse the existing primitive APIs instead of creating a second independent closure implementation.

The new operating closure API composes:

1. `build_toolchain_artifact_manifest`
2. `import_toolchain_artifact_manifest`
3. `collect_toolchain_results`
4. `close_toolchain_collection_e2e`

This keeps Evidence, Finding, Matrix, Report, export, and completion gates aligned with existing behavior and avoids scanner execution.

## Rejected Alternatives

- Direct scanner execution from the new API: rejected because the current goal requires ROE/HITL/guardrails and existing operating artifacts for high-risk execution.
- Trust raw tool output as instructions: rejected because scanner output remains untrusted evidence data.
- Mark real operating evidence complete from fixtures: rejected because controlled workspace fixtures do not prove organization scanner execution or real approver identity.
