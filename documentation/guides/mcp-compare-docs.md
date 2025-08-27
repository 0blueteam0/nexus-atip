# MCP 비교 분석 모듈

## ⚡ 자동 비교 프로세스 (CRITICAL)
**새로운 도구가 필요할 때 반드시 실행:**

1. **즉시 검색** → 관련 MCP/도구 3개 이상 찾기
2. **비교 테이블 작성** → 기능, 장단점, 호환성
3. **최적 선택** → Windows Native 환경 우선
4. **문서화** → 이 파일에 자동 추가
5. **학습 저장** → brain/patterns.json에 패턴 기록

## 📊 비교 사례들

### Task Manager MCP 비교

| MCP 서버 | 패키지명 | 주요 특징 | 장점 | 단점 | 추천도 |
|----------|----------|-----------|------|------|--------|
| **Shrimp Task Manager** | mcp-shrimp-task-manager | Chain-of-Thought, 웹 UI:3000 | 시각적 관리, 의존성 추적 | 웹 포트 필요 | ⭐⭐⭐⭐⭐ |
| **Chain of Thought Ver** | @liorfranko/mcp-chain-of-thought | ENABLE_THOUGHT_CHAIN 제어 | 상세 사고 과정 | 복잡한 설정 | ⭐⭐⭐⭐ |
| **Gist Task Manager** | gist-task-manager-mcp | GitHub Gist 클라우드 저장 | 원격 동기화 | GitHub 의존 | ⭐⭐⭐ |
| **Task Manager by kazuph** | @kazuph/taskmanager | 사용자 승인 워크플로우 | 안전한 실행 | 수동 승인 필요 | ⭐⭐⭐ |

**선택**: Shrimp Task Manager - 시각적 UI + Chain-of-Thought + 로컬 실행

### Diff MCP 비교
- **선택**: mcp-server-diff-typescript
- **이유**: Node.js만 필요, 가벼움, Windows Native 최적

### Git MCP
- **선택**: @cyanheads/git-mcp-server
- **이유**: 가장 완성도 높음, 풍부한 기능

## ⚠️ Windows Native cmd 버그
**모든 설치 후 반드시:**
```javascript
// 자동 체크 및 수정
if (args[0] === "C:/") {
  args[0] = "/c";  // 수정
}
```