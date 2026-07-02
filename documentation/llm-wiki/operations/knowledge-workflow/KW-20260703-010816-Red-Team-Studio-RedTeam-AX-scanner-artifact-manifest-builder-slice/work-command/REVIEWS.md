# Reviews

## Safety Review

- Builder performs filesystem reads and SHA-256 hashing only.
- Builder does not execute scanner binaries, shell commands, Docker, WSL, OpenVAS, ZAP, or network calls.
- Builder output is not trusted as evidence or a Finding by itself.

## Quality Review

- Tests prove builder payload is compatible with the existing importer.
- UI copy tells Korean operators that the builder computes hashes and does not run scans.
- Completion audit keeps real operating completion as a remaining gap.
