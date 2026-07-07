# Insights

- The prior tool model already distinguishes high-risk scanner execution from low-risk local runner presets. Nuclei should not become a one-click scan tool simply because the binary is installed.
- A project-local portable tool root is a better fit for this Windows environment than Go install because `go` is unavailable on PATH and the user asked for practical installation progress.
- Wrapper trust and launch readiness need separate UX states: Nuclei can be installed and hash-pinned while still requiring human approval before any real target scan.
- The optional Sigma ToolProfile increased manifest count to 7, so tests that assumed six manifests needed to reflect required vs optional tool distinction.
