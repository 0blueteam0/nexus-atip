# Live RedTeam AX v2 Export Smoke

## 문서 통제

- Case ID: `CASE-LIVE-REPORT-EXPORT-001`
- 생성 시각: `2026-07-01T04:25:10Z`
- 문서 유형: Korean Red Team Report v2
- 통제 원칙: ROE/HITL/가드레일 통과 결과와 Evidence Card만 보고서 주장에 사용

## Campaign Walkthrough

- 승인된 범위의 ToolActionCard 기반 수행 과정을 기록한다.
- 고위험 실행은 사람이 승인, 수행, 검토한 ManualRunRecord만 반영한다.

## Evidence Card Index

- `EV-LIVE-EXPORT-001`

## Claim-Evidence Matrix

| Claim | Support | Evidence |
|---|---|---|
| `C-LIVE-EXPORT-001` | supported | EV-LIVE-EXPORT-001 |

## Findings

- `F-LIVE-EXPORT-001` Finding / Evidence: EV-LIVE-EXPORT-001

## ToolAction / HITL Summary

- `TAC-LIVE-EXPORT-001` risk=T3 status=EvidenceCreated approval_required=True

## Report Gate

- Gate status: `pass`
- Unsupported claims: `0`
- Unapproved high-risk actions: `0`
- Findings without evidence: `0`

## 재시험 계획

- Evidence-linked finding별 remediation owner와 retest window를 지정한다.
- 재시험 결과도 Evidence Card로 승격한 뒤 Claim-Evidence Matrix에 연결한다.
