# edit-file-lines MCP 도구 완벽 가이드

## [!] 핵심 개념 이해하기

### 1. 기본 동작 방식
- **startLine과 endLine 범위의 모든 줄**을 **content로 완전히 교체**
- content가 빈 문자열("")이면 해당 줄들이 **삭제됨**
- 줄 번호는 **1부터 시작** (0이 아님)

## [!!] 가장 흔한 실수들

### ❌ 실수 1: HTML 구조 파괴
```json
// 잘못된 예: 닫는 태그를 함께 제거
{
  "startLine": 2152,  // 이전 섹션의 </div>까지 포함
  "endLine": 2186,
  "content": "</div>"  // 하나의 </div>만 남김
}
```

### ✅ 올바른 방법:
```json
// 정확한 섹션만 제거
{
  "startLine": 2153,  // 제거할 섹션의 시작
  "endLine": 2186,    // 제거할 섹션의 끝
  "content": ""       // 완전 삭제
}
```

## [*] 실전 사용 패턴

### 패턴 1: 섹션 삭제
```javascript
// 사용 전: get_file_lines로 정확한 범위 확인
{
  "lineNumbers": [시작줄-1, 시작줄, 끝줄, 끝줄+1],
  "context": 2
}

// 확인 후 삭제
{
  "startLine": 시작줄,
  "endLine": 끝줄,
  "content": ""
}
```

### 패턴 2: 텍스트 교체 (구조 유지)
```json
{
  "startLine": 100,
  "endLine": 100,
  "strMatch": "oldText",      // 이 텍스트만 찾아서
  "content": "newText"         // 이것으로 교체
}
```

### 패턴 3: 여러 줄 한번에 교체
```json
{
  "startLine": 50,
  "endLine": 55,
  "content": "    <div>\\n        새로운 내용\\n    </div>"
}
```

## [!] HTML/JSX 작업 시 필수 체크리스트

### 작업 전:
- [ ] get_file_lines로 정확한 줄 번호 확인
- [ ] 열고 닫는 태그 쌍 확인
- [ ] 들여쓰기 레벨 확인
- [ ] 주변 구조에 영향 없는지 확인

### 작업 중:
- [ ] content에서 이스케이프 필요한지 확인 (\\n, \\t)
- [ ] 빈 줄 제거 시 startLine/endLine 조정
- [ ] 여러 편집은 배열로 한번에 처리

### 작업 후:
- [ ] 브라우저에서 실제 동작 확인
- [ ] 콘솔 에러 체크
- [ ] HTML 구조 검증

## [*] 실제 사례: API Keys 섹션 제거

### 1단계: 구조 파악
```bash
2150: </div>  # Auto-Response 항목 닫기
2151: </div>  # SOAR 섹션 닫기 (⚠️ 보존 필요!)
2152: 
2153: <!-- API Keys Management -->  # 여기부터
2154: <div class="nav-section">
...
2186: </div>  # API Keys 섹션 닫기
2187: </nav>  # 네비게이션 닫기 (⚠️ 보존 필요!)
```

### 2단계: 올바른 제거
```json
{
  "p": "index.html",
  "e": [{
    "startLine": 2153,  // <!-- API Keys --> 시작
    "endLine": 2186,    // API Keys 섹션 </div>
    "content": ""       // 삭제
  }]
}
```

### 3단계: 빈 줄 정리
```json
{
  "p": "index.html", 
  "e": [{
    "startLine": 2152,  // 남은 빈 줄
    "endLine": 2152,
    "content": ""
  }]
}
```

## [!!] 암전/깨짐 방지 팁

1. **작은 단위로 작업**: 한번에 큰 섹션 X → 작은 부분씩 O
2. **백업 먼저**: 중요한 수정 전 항상 백업
3. **검증 도구 활용**: get_file_lines로 전후 확인
4. **단계별 접근**: 삭제 → 빈줄 정리 → 추가 순서로

## [*] 고급 기능

### strMatch vs regexMatch
- **strMatch**: 단순 문자열 매칭 (빠름, 안전)
- **regexMatch**: 정규식 패턴 (강력하지만 복잡)

### dryRun 모드
```json
{
  "dryRun": true  // 실제 수정 없이 diff만 확인
}
```

### approve_edit 활용
1. dryRun으로 미리보기
2. stateId 받기
3. approve_edit로 적용

## [!] 트러블슈팅

### Q: 화면이 암전됨
A: HTML 구조 깨짐. 닫는 태그 확인

### Q: 수정이 안됨  
A: 줄 번호 확인 (1부터 시작)

### Q: 예상과 다른 결과
A: content가 전체 범위를 교체함을 기억

---
작성일: 2025-08-28
작성자: Claude Code
버전: 1.0