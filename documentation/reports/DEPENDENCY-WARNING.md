# [!] 의존성 경고 - DEPENDENCY WARNING

## 생성된 파일과 의존성 (2025-08-27)

### 새로 만든 파일들
1. systems/shrimp-formatter.js - _ACTIVE/scripts/shrimp-view.bat이 의존
2. systems/mcp-output-formatter.js - 사용 안 됨 (삭제 가능)
3. systems/hooks/format-mcp-output.js - 사용 안 됨 (삭제 가능)  
4. claude-clean.bat - systems/claude-output-filter.js 의존
5. systems/claude-output-filter.js - claude-clean.bat이 의존

### [*] 의존성 체인
```
shrimp-view.bat 
    └── shrimp-formatter.js (삭제 시 shrimp-view 실패)

claude-clean.bat
    └── claude-output-filter.js (삭제 시 claude-clean 실패)
```

### [!] 권장사항
1. **사용하지 않는 파일 즉시 삭제**
   - systems/mcp-output-formatter.js
   - systems/hooks/format-mcp-output.js

2. **새 기능 추가 전 자문**
   - 정말 필요한가?
   - 기존 파일에 추가할 수 없나?
   - 의존성을 만들지 않을 수 없나?

3. **KISS 원칙**
   - Keep It Simple, Stupid
   - 복잡한 해결책보다 단순한 해결책
   - 파일 10개보다 파일 1개가 낫다

## [*] 교훈
"Raw JSON 출력"같은 작은 불편함을 해결하려다
더 큰 복잡성을 만들 수 있다.

때로는 그냥 두는 것이 최선이다.