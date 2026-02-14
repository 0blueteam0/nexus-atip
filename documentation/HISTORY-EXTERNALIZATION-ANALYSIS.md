# History 외부화 영향 분석 - 지속 로드 시 문제점

## [!] 핵심 답변: 문제 있을 수 있습니다

### 1. Claude Code의 현재 동작 방식
- **claude.json은 세션 시작 시 전체 로드**
- **외부 파일 참조는 기본 지원 안함**
- **history는 컨텍스트 유지에 필수**

## [*] 예상되는 문제점

### 1️⃣ 컨텍스트 손실 문제
```
문제: Claude Code가 외부 history를 인식 못함
영향: 이전 대화 내용 참조 불가
심각도: ⚠️ HIGH
```

### 2️⃣ 성능 문제
```
문제: 매번 외부 파일 로드 시 I/O 오버헤드
영향: 응답 속도 저하
심각도: ⚠️ MEDIUM
```

### 3️⃣ 동기화 문제
```
문제: claude.json과 외부 파일 간 불일치
영향: 데이터 무결성 깨짐
심각도: ⚠️ HIGH
```

## [!] 더 나은 해결책: Hybrid Approach

### 방법 1: 선택적 외부화 (권장) ✅
```javascript
// 최근 7일 history만 claude.json에 유지
// 나머지는 외부 파일로 아카이빙
{
  "projects": {
    "projectId": {
      "history": [/* 최근 7일 */],
      "archivedHistory": {
        "location": "history-sessions/archive",
        "files": ["2025-01-01-history.json"]
      }
    }
  }
}
```

### 방법 2: Lazy Loading Hook
```javascript
// .claude-hooks.json에 SessionStart hook 추가
// 필요시에만 외부 history 로드
{
  "session-start": {
    "command": "node systems/history-loader.js inject"
  }
}
```

### 방법 3: 압축 전략
```javascript
// history를 요약본으로 압축
// 상세 내용은 외부 저장
{
  "history": [
    {
      "display": "요약: MCP 서버 비교 분석",
      "fullContentRef": "history/2025-01-03-mcp-analysis.json"
    }
  ]
}
```

## [*] 실제 구현 권장사항

### 1. 단계적 접근
```
1단계: 30일 이상된 history만 외부화
2단계: 성능 모니터링
3단계: 필요시 압축/요약 적용
```

### 2. 안전장치
- 항상 백업 유지
- 원본 claude.json 보존
- 롤백 메커니즘 구현

### 3. 테스트 절차
```bash
# 1. 백업
cp .claude.json .claude.json.original

# 2. 부분 외부화 테스트
node systems/history-externalizer.js extract --days=30

# 3. Claude Code 재시작
./claude.bat

# 4. 정상 동작 확인
# 5. 문제 시 롤백
cp .claude.json.original .claude.json
```

## [!!] 결론

**완전 외부화보다는 Hybrid 방식 권장:**
- 최근 history (7-14일)는 claude.json에 유지
- 오래된 history만 외부 아카이빙
- 필요시 수동으로 참조

**이유:**
1. Claude Code가 외부 참조 네이티브 지원 안함
2. 컨텍스트 유지 중요
3. 성능과 안정성 균형 필요