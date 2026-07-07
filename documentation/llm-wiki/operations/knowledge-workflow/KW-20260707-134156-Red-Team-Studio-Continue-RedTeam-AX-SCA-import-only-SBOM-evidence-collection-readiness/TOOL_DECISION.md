# Tool Decision

## Selected tools

| tool | purpose | decision | result |
|---|---|---|---|
|
g | targeted source discovery | use for fast code/test search | found SCA profiles, preset, normalizer tests |
| pply_patch | code/test/doc/sample edits | use for tracked project changes | updated runtime/tests/plans and added SBOM fixture |
| .venv\Scripts\python.exe | project test runtime | use for regression/smoke because system Python lacks pytest | targeted unittest and model smoke passed |
|
ode --check | frontend syntax check | use existing frontend sanity path | passed |
| official CycloneDX pages | validate SBOM structure context | use official source only | confirmed omFormat, specVersion, components and vulnerabilities model |

## Rejected or limited

- Did not execute an SCA scanner because TOOL-SCA-001 is import-only.
- Did not use network scanner actions.
- Did not mark full RedTeam AX goal complete.
