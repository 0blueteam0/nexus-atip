# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Install Trivy v0.72.0 from official GitHub release | Current official latest is newer than known compromised v0.69.4 | Portable binary installed and pinned |
| Add supply-chain guard for v0.69.4 | Official incident discussion identified v0.69.4 as compromised | Install script refuses that tag |
| Use portable Trivy path in execution preset | Frontend button should invoke the installed tool, not an ambiguous PATH command | Runner command line includes `trivy.exe` path |
| Add sample lockfile | Need actual safe analysis output without remote targets | Trivy generated real JSON findings |
| Fix subprocess encoding | Windows cp949 failed on UTF-8 output from tool paths/text | Runner logs no longer emit decode thread exception |
