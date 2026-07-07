# Insights

- Gitleaks logs can pollute stdout unless `--log-level error` is set; the preset now forces parseable redacted JSON.
- A committed positive secret fixture would be unsafe and confusing, so positive parsing is covered by a redacted JSON unit fixture while the real sample workspace stays clean.
- The optional profile must not affect required six-tool completion coverage.
