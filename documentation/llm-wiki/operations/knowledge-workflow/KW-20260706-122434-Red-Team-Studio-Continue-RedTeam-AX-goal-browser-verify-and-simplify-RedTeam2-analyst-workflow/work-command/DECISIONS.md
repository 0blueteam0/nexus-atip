# Decisions

## Collapse Instead of Delete

Administrator/runtime/path/closure details remain in the code and can be viewed with `관리자 설정 보기`. They are not rendered in the default analyst DOM. This keeps Evidence Card and audit traceability while reducing cognitive load for analysts.

## Browser DOM Is the Authority for Default View

Source strings may still include administrator labels because the expanded admin view needs them. Therefore the authoritative regression is the Playwright default DOM check, not a source-wide forbidden-string check.

## Completion Audit Tracking

`RTA-COMP-075` was added to the completion audit matrix. It proves the default analyst view collapse only. It does not prove final RedTeam AX goal completion, real six-tool operating evidence, Evidence approval, or Report v2 export.
