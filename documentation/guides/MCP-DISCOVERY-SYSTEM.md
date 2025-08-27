# MCP Discovery & Evaluation System
## MCP 자동 발견 및 평가 체계

### 🔍 MCP 추천 프로세스

#### 1. 비슷한 도구 검색 및 비교
```markdown
예시: Unified Diff 관련 MCP 비교

| MCP 서버 | 패키지명 | 주요 기능 | 장점 | 단점 | 추천도 |
|---------|----------|-----------|------|------|--------|
| **@gorosun/unified-diff-mcp** | Bun 런타임 기반 | HTML/PNG diff 시각화, GitHub Gist 자동 생성 | 아름다운 UI, 자동 삭제 | Bun 런타임 필요 | ⭐⭐⭐ |
| **mcp-server-diff-typescript** | TypeScript 기반 | unified diff 생성, 3줄 컨텍스트 | 가볍고 빠름, npm만 필요 | 시각화 제한적 | ⭐⭐⭐⭐ |
| **mcp-server-diff-editor** | 고급 편집기 | 패턴 인식, 충돌 해결, 시맨틱 분석 | 강력한 기능 | 복잡한 설정 | ⭐⭐⭐⭐⭐ |
```

#### 2. 평가 기준
- **호환성**: Windows Native 환경 지원
- **의존성**: 추가 런타임 필요 여부 (Node.js만 vs Bun/Deno)
- **설치 용이성**: npx로 즉시 실행 가능한가
- **기능성**: 실제 필요한 기능 제공
- **안정성**: 에러 발생 빈도

### 🚀 자동 발견 시스템

#### Claude Code 시작 시 체크리스트
```javascript
// 시작 시 자동 실행
1. 현재 프로젝트 분석
2. 필요한 MCP 자동 감지
3. 설치되지 않은 추천 MCP 제안
4. 업데이트 가능한 MCP 확인
```

#### 작업 중 자동 감지
```javascript
// 실시간 감지 트리거
- Git 명령 사용 시 → Git MCP 추천
- 파일 비교 작업 시 → Diff MCP 추천
- 웹 스크래핑 시 → Web Crawler MCP 추천
- DB 작업 시 → SQL MCP 추천
- API 작업 시 → REST Client MCP 추천
```

### 📝 자동 문서화 규칙

#### CLAUDE.md 업데이트 시점
1. **새 MCP 설치 성공 시**
   - 설치 방법 문서화
   - Windows Native 특별 주의사항 기록
   - cmd 인자 문제 해결 방법 포함

2. **설치 실패 및 해결 시**
   - 에러 패턴 기록
   - 해결 방법 문서화
   - 대체 패키지 정보 추가

3. **새로운 사용 패턴 발견 시**
   - 유용한 조합 문서화
   - 워크플로우 최적화 방법 기록

### 🎯 추천 MCP 목록 (우선순위)

#### 필수 MCP (Core)
1. ✅ **filesystem** - 파일 시스템 접근
2. ✅ **shrimp-task-manager** - 작업 관리
3. ✅ **git-mcp** - Git 작업 자동화

#### 강력 추천 (Highly Recommended)
4. ⏳ **mcp-server-diff-typescript** - 코드 비교
5. ⏳ **memory-mcp** - 컨텍스트 관리
6. ⏳ **web-crawler** - 웹 데이터 수집

#### 프로젝트별 추천 (Project-Specific)
7. 🔧 **sql-mcp** - DB 프로젝트용
8. 🔧 **docker-mcp** - 컨테이너 프로젝트용
9. 🔧 **aws-mcp** - AWS 프로젝트용
10. 🔧 **rest-client-mcp** - API 개발용

### 🔄 Windows Native cmd 인자 문제 해결

#### 자동 수정 스크립트
```powershell
# fix-mcp-cmd.ps1
$config = Get-Content ".claude.json" | ConvertFrom-Json
foreach ($server in $config.mcpServers.PSObject.Properties) {
    if ($server.Value.command -eq "cmd" -and $server.Value.args[0] -eq "C:/") {
        $server.Value.args[0] = "/c"
    }
}
$config | ConvertTo-Json -Depth 10 | Set-Content ".claude.json"
```

### 📊 설치 상태 대시보드

```
MCP 서버 상태 (2025-08-15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 설치됨 (8개)
- mcp-installer
- filesystem  
- playwright
- context7 (API 키 필요)
- youtube-data (API 키 필요)
- google-search
- shrimp-task-manager
- git-mcp

⏳ 설치 예정 (3개)
- mcp-server-diff-typescript
- memory-mcp
- web-crawler

❌ 설치 실패 (1개)
- @gorosun/unified-diff-mcp (Bun 런타임 필요)

🔧 API 키 설정 필요
- context7: CONTEXT7_API_KEY
- youtube-data: YOUTUBE_API_KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🤖 자동화 워크플로우

#### 매일 실행 (AUTO-MCP-CHECK.bat)
```batch
@echo off
echo [MCP Daily Check]
claude mcp list > mcp-status.log
claude mcp check-updates
echo Results saved to mcp-status.log
```

#### 프로젝트 시작 시 (PROJECT-INIT.bat)
```batch
@echo off
echo [Project MCP Analysis]
claude analyze-project
claude suggest-mcps
claude mcp install-missing --auto
```

### 📚 학습된 패턴 저장

#### patterns/mcp-patterns.json
```json
{
  "discovered_fixes": [
    {
      "issue": "cmd C:/ instead of /c",
      "solution": "Manual edit .claude.json",
      "affected_packages": ["all Windows Native npx MCPs"],
      "date": "2025-08-15"
    }
  ],
  "useful_combinations": [
    {
      "combo": ["git-mcp", "diff-typescript"],
      "use_case": "Code review workflow",
      "benefits": "Automated commit with visual diff"
    }
  ]
}
```

### 🔮 향후 개선 사항
1. **자동 cmd 인자 수정기** 개발
2. **MCP 호환성 매트릭스** 구축
3. **성능 벤치마크** 시스템
4. **사용 빈도 기반 추천** 알고리즘
5. **충돌 감지 및 해결** 시스템

---

이 문서는 Claude가 자동으로 업데이트합니다.
마지막 업데이트: 2025-08-15