# Tool Decision

YARA v4.5.5 is selected as the next RedTeam AX optional runner because it supports low-risk local indicator rule matching, aligns with SPEC tooling needs for rule-based verification, and can be safely demonstrated with benign local rule/input files.

Allowed runner: portable `yara64.exe` with the approved sample rule and approved benign sample input only.
Denied runner scope: recursive scan, scan-list input, high-thread scanning, arbitrary rule/input paths, malware/customer files, and any output treated as LLM instruction.
