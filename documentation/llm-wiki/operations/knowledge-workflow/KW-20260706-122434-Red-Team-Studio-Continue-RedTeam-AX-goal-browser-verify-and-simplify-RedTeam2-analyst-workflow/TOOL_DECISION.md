---
type: tool_decision
status: ready_for_close
project: Red-Team-Studio
created: 2026-07-06T12:24:34+09:00
updated: 2026-07-06T12:47:03+09:00
---

# Tool Decision

| Tool | Used for | Reason | Result |
|---|---|---|---|
| `apply_patch` | source/doc edits | 변경 범위를 명확히 남기기 위함 | success |
| `node --check` | `reports.js` syntax | frontend bundle 전 문법 오류 조기 검출 | exit_code 0 |
| Python sanity scripts | RedTeam AX static contracts | 기존 고도화 sanity 체계와 맞춤 | exit_code 0 |
| Playwright | live browser DOM verification | 기본 렌더링 결과가 실제로 단순화됐는지 확인 | exit_code 0 |
| `python -m json.tool` | audit matrix JSON validation | 수동 JSON patch 후 parse 검증 | exit_code 0 |

## Rejected Alternatives

- 관리자 세부 문자열 삭제: 감사/운영 추적성을 잃으므로 사용하지 않았다.
- 소스 금지어 검사만 사용: 관리자 토글 때문에 false positive가 많아 기본 DOM 검증을 추가했다.
