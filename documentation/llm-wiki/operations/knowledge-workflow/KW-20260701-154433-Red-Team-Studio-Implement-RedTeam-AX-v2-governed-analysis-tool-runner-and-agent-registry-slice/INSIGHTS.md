---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:03:00+09:00
---

# Insight

## 관찰

분석도구 요구에는 active scanner와 offline SCA가 섞여 있다. 같은 "도구 실행" UI로 묶되 risk class와 execution mode policy는 분리해야 한다.

## 통찰

RedTeam AX에서 도구 연동의 첫 구현 단위는 CLI 실행이 아니라 정책 가능한 ToolProfile과 결과 증거화 계약이다. 이 기반이 있어야 실제 Nuclei/ZAP/OpenVAS runner를 붙여도 승인 없는 실행과 raw output 기반 unsupported claim을 막을 수 있다.

## 제안

다음 slice는 설치/runner 자동화보다 먼저 도구별 parser contract를 더 구체화하는 것이 좋다. parser가 있어야 Evidence Card 품질과 Claim-Evidence Matrix 검증이 올라간다.

## 적용 가능 범위

Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP, 이후 추가될 Nmap/Gowitness/BloodHound 계열.

## 후속 작업

Version pin/hash 검증, sandbox runner, network allowlist, OpenVAS/ZAP credential vault, parser-specific normalized schemas.
