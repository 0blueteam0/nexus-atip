---
type: decision_log
status: ready_for_close
project: Red-Team-Studio
created: 2026-07-06T12:24:34+09:00
updated: 2026-07-06T12:47:03+09:00
---

# Decision Log

## D1. 관리자 세부정보는 삭제하지 않고 기본 접힘 처리

- decision: RedTeam2 administrator/runtime/path/closure details are hidden by default behind `관리자 설정`.
- rationale: 초급 분석가 기본 화면은 결과 첨부, Evidence 후보, Finding/Claim 검토에 집중해야 하지만, 운영자/감사자는 wrapper, endpoint, runtime, closure 세부정보를 계속 확인해야 한다.
- evidence: `reports.js`, Playwright artifact `browser/redteam2-browser-verify-20260706.json`.
- impact: 분석가 기본 DOM 노출이 줄고 Evidence 추적성은 유지된다.

## D2. 정적 소스 금지어보다 기본 DOM 금지어를 우선 검증

- decision: 관리자 문자열은 소스에 남아도 되므로 실제 렌더링 DOM에서 금지어 0건을 검증한다.
- rationale: 소스 문자열 삭제는 관리자 토글 기능과 감사 추적성을 해칠 수 있다.
- evidence: Playwright verification result `hits=[]`, `missing=[]`.

## D3. completion audit matrix에 새 요구사항 추가

- decision: `RTA-COMP-075`를 추가해 default analyst view collapse requirement를 별도 추적한다.
- rationale: 기본 화면 노출 최소화는 향후 UI regression에서 독립적으로 검증해야 한다.
- evidence: `redteam_ax_completion_audit_matrix.json`, `REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md`.
