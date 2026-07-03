---
type: evidence_unit
status: complete
id: KW-20260703-161332-EU-001
project: Red Team Studio
created: 2026-07-03T16:13:32+09:00
---

# Evidence Unit

## Claim

RedTeam2 analyst-facing UI now minimizes raw path/API/environment clutter while preserving backend traceability.

## Source

- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `node --check .../reports.js`
- exit_code: 0
- collected_at: 2026-07-03T16:38:00+09:00

## Evidence

- RedTeam2 helper functions summarize storage and hidden locations.
- UI strings use `분석 저장소에 보관됨`, `세부 위치는 관리자/감사 기록에서 확인`, `연결 준비됨`, and `관리자가 승인한 운영 산출물 폴더`.
- Default manifest/source path examples were cleared.

## Confidence

High for static code and sanity contract. Browser visual confirmation remains future work.

## Limits

This does not remove backend JSON keys or audit artifact paths. It only changes frontend display and placeholders.

## Related Decisions

- Keep evidence traceability in backend/audit artifacts.
- Hide raw locations from analyst-first UI by default.
