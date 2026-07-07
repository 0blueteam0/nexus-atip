# Tool Decision

| need | selected tool/source | reason | result |
|---|---|---|---|
| Official install source | Aqua Security Trivy GitHub release | Official Trivy docs support GitHub release binary install | v0.72.0 Windows 64bit asset used |
| Supply-chain safety | Reject v0.69.4 | Aqua/GitHub incident reported malicious v0.69.4 | Guard checked before install |
| Local execution | Project portable tools path | Avoid global PATH mutation and keep runner discovery deterministic | `고도화/tools/trivy/trivy.exe` installed |
| Result smoke | Local sample package-lock | Safe filesystem analysis without remote registry or active scanning | Trivy JSON output created |
| Evidence path | governed toolchain execution + collect-results | Matches platform workflow, not ad hoc output only | Evidence candidates and analysis agent coverage produced |
