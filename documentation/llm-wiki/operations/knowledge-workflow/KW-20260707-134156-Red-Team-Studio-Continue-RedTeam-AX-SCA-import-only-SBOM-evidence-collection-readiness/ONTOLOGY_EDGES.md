# Ontology Edges

| subject | relation | object | evidence |
|---|---|---|---|
| RedTeam AX | has_import_only_tool | SCA Dependency Analyzer | TOOL-SCA-001 |
| SCA Dependency Analyzer | consumes | CycloneDX SBOM | sample fixture |
| CycloneDX SBOM | produces_candidate | component inventory Evidence | model smoke structured items |
| CycloneDX SBOM | produces_candidate | vulnerability Evidence | model smoke structured items |
| vulnerability Evidence | references | affected component refs | ffects.ref linkage |
| SCA sample fixture | supports | beginner 결과 첨부 workflow | execution preset/import guidance |
