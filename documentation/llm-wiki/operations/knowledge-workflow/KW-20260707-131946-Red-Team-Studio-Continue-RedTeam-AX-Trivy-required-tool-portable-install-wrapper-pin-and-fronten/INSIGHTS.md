# Insights

- Trivy can now satisfy the priority 2 path more directly than Nuclei because it is T0 and supports local workspace analysis through governed runner presets.
- The Trivy supply-chain incident makes version pinning and explicit release rejection more important than just installing latest blindly.
- The sample lockfile gives a deterministic local analysis input that produces real vulnerability candidates without remote target scanning.
- Windows runner output should not rely on the default console code page; UTF-8 replacement avoids noisy UnicodeDecodeError while preserving untrusted output as data.
