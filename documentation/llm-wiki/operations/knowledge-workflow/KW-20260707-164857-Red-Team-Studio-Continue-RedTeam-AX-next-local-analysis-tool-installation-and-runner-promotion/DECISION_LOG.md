# Decision Log

- Decision: Add YARA as optional runner, not required core coverage.
  Evidence: TOOL-YARA-001 uses required_for_core_coverage=false and optional_runner_profile=true.
  verified_at: 2026-07-07

- Decision: Pin `yara64.exe` but do not commit release binaries.
  Evidence: manifest records binary and zip SHA-256 while tools/yara remains an operational install artifact.
  verified_at: 2026-07-07

- Decision: Use a benign marker text file rather than malware or customer files.
  Evidence: sample workspace contains only plain text and a minimal YARA rule.
  verified_at: 2026-07-07
