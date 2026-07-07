# Tool Decision

| tool | purpose | decision | evidence |
|---|---|---|---|
| OWASP ZAP 2.17.0 Crossplatform | Real local ZAP installation | selected official release package | zip sha256 94c8f767b1c2e94f0db66b3ae56514d5e3f5a728ee1b6c798e0c8fe2d61fbff0 |
| zap.bat -version | Safe local smoke | allowed as version-only install check | output 2.17.0, no target, no daemon |
| ZAP report/service import | Analysis result intake | retained for findings | existing service import and zap_json normalizer |
| Active scan/spider/daemon | High-risk execution | not enabled | requires ROE/HITL/vault/approved lab scope |
