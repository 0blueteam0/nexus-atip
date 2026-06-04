# Tool Decision

- Used local file/patch tools for scoped source edits under implementation_seed.
- Used Python/unittest because this seed already uses stdlib unittest and deterministic JSON artifacts.
- Did not use web or connector tools; the task is local architecture/implementation and safety boundary forbids SOC connector calls.
- Did not use background agents because files are tightly coupled and a single foreground path avoided merge conflicts.
