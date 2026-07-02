# Tool Decision

- rg와 Python one-liner로 기존 모델, 라우터, 테스트, UI 구조를 확인했다.
- apply_patch로 소스와 공식 문서를 수정했다.
- structured JSON인 completion audit matrix는 Python json parser로 갱신했다.
- PowerShell pipeline 한글 경로 인코딩 문제가 있어 JSON evidence ref를 unicode escape 기반 경로 문자열로 보정했다.
