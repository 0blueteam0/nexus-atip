# Tooling

| tool | use | result |
|---|---|---|
| GitHub release API | Locate ProjectDiscovery Nuclei latest release | Used v3.11.0 Windows AMD64 asset |
| Invoke-WebRequest / Expand-Archive | Download and extract Nuclei | Installed local binary |
| Get-FileHash | Compute wrapper SHA-256 | Hash pinned in ToolProfile |
| py_compile | Python syntax check | passed |
| pytest | Backend regression | 6 selected tests passed |
| frontend sanity scripts | RedTeam2 payload/display contract | runtime and launch readiness passed |
| node --check | frontend reports.js syntax | passed |
