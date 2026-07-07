# Tool Decision

| need | selected tool | reason | result |
|---|---|---|---|
| Find current official Nuclei release | GitHub official release API / ProjectDiscovery official source | User requires real tool install progress and current install source should be authoritative | Used official ProjectDiscovery release asset |
| Install Nuclei on Windows | Official Windows AMD64 release binary | Go was not present in PATH; Docker scan execution is not needed for wrapper readiness | Installed project-local portable binary |
| Preserve repository hygiene | Do not commit binary/archive | Binary is environment artifact, not source contract | Only code/docs/tests are committed |
| Verify runtime behavior | Python model call and pytest | Confirms backend readiness contract | Nuclei manifest hash_match and tests pass |
| Verify frontend contract | existing sanity scripts | No frontend source changed, but launch/runtime payload contracts must remain stable | Both frontend sanity scripts pass |
