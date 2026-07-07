# Gitleaks sample workspace

This workspace is intentionally clean. It exists so RedTeam AX can run a
low-risk local Gitleaks JSON scan without committing synthetic secrets.

Positive secret-detection smoke tests must create temporary files at runtime
and must not commit secret-like values to the repository.
