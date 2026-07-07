# Ontology Edges

| subject | relation | object | evidence |
|---|---|---|---|
| TOOL-ZAP-001 | installed_as | OWASP ZAP 2.17.0 portable package | install manifest |
| OWASP ZAP portable package | verified_by | zap.bat -version | output 2.17.0 |
| zap.bat | has_sha256 | 6000967e72206b5ff91b242cf2918303deb3cdfe6cdece525af84a58757fb86d | Get-FileHash |
| ZAP safe smoke | produces | install version evidence candidate | governed smoke |
| ZAP active scan | requires | ROE/HITL approval | runtime policy |
