# Insights

- The durable path is to keep multipart upload as transport only. Trust, hash, schema, and parser semantics remain in the existing strict import pipeline.
- Browser-side SHA-256 gives the analyst immediate provenance visibility, while the server still recomputes and rejects mismatches.
- Stored artifacts remain `trusted_as_instruction=false` and `requires_human_validation=true`; this preserves the RedTeam AX evidence-first invariant.
- The UI can now exercise the actual file-based parser path without requiring local filesystem paths in the browser.
