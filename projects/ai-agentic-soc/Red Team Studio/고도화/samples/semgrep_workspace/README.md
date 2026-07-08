# Semgrep sample workspace

This workspace contains a benign Python script and a local Semgrep rule for
RedTeam AX Semgrep integration tests.

The rule flags `print(...)` as a low-severity training observation. It does not
download registry rules and does not execute the Python file.
