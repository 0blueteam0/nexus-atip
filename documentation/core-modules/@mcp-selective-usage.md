# @mcp-selective-usage.md - MCP 서버 선택적 사용 가이드 (CRITICAL)

## [P1] Desktop Commander = PRIMARY TOOL (ULTRA CRITICAL)
**모든 파일/터미널 작업의 기본 도구 - 90% 이상 커버리지**

| 우선순위 | 도구 | 역할 |
|---------|------|------|
| **P1 (필수)** | Desktop Commander | 모든 파일/터미널 작업의 PRIMARY TOOL |
| P2 | Edit File Lines | DC 실패 시 정밀 라인 편집 |
| P3 | Shrimp Task Manager | 작업 관리 (TodoWrite 절대 금지) |
| P4 | Built-in Tools | 폴백 전용 |

---

## [!] 핵심 원칙: "필요할 때만 설치하고 사용한다"

**Desktop Commander가 PRIMARY TOOL로서 90% 이상의 터미널/파일 작업을 처리합니다. 추가 MCP는 특정 기능이 반드시 필요한 경우에만 설치**

## [*] MCP 서버별 사용 제한 규칙

### 1. Computer Control MCP (@AB498/computer-control-mcp)
**[설치 금지] 다음 상황에서만 설치 허용:**
- ✅ OCR이 필수인 경우
  - 스크린샷에서 텍스트 추출 필요
  - 이미지 기반 UI 테스트
  - 캡차 읽기 또는 시각적 검증
- ✅ 마우스/키보드 자동화가 필수인 경우
  - GUI 애플리케이션 자동 테스트
  - 게임 봇 개발
  - 접근성 도구 개발

**트리거 키워드:** "OCR", "스크린샷 텍스트 추출", "UI 자동화", "마우스 제어", "키보드 매크로"

**설치 명령 (필요시에만):**
```bash
uvx computer-control-mcp@latest
```

### 2. Windows Command Line MCP (@alxspiker/Windows-Command-Line-MCP-Server)
**[설치 금지] 다음 상황에서만 설치 허용:**
- ✅ 보안 샌드박스가 필수인 경우
  - 신뢰할 수 없는 코드 실행
  - 악성 코드 분석
  - 격리된 테스트 환경 필요
- ✅ 3단계 보안 모드가 필요한 경우
  - 엔터프라이즈 보안 감사
  - 규정 준수 테스트

**트리거 키워드:** "샌드박스", "격리 실행", "보안 테스트", "위험 코드", "악성코드 분석"

**설치 명령 (필요시에만):**
```bash
npx -y @smithery/cli install @alxspiker/Windows-Command-Line-MCP-Server --client claude
```

### 3. CLI Command Execution (@jakenuts/mcp-cli-exec)
**[설치 금지] 다음 상황에서만 설치 허용:**
- ✅ 구조화된 출력이 필수인 경우
  - stdout/stderr/exitcode 분리 분석
  - 복잡한 빌드 체인 디버깅
  - CI/CD 파이프라인 디버깅
- ✅ 멀티 커맨드 체이닝이 필수인 경우
  - 100개+ 명령 순차 실행
  - 조건부 명령 체인

**트리거 키워드:** "구조화 출력", "빌드 디버깅", "파이프라인 에러", "stdout stderr 분리"

**설치 명령 (필요시에만):**
```bash
npx -y @smithery/cli install @jakenuts/mcp-cli-exec --client claude
```

### 4. Terminal MCP Server (@weidwonder/terminal-mcp-server)
**[설치 금지] 다음 상황에서만 설치 허용:**
- ✅ SSH 원격 접속이 필수인 경우
  - 원격 서버 관리
  - 클라우드 인스턴스 제어
  - 분산 시스템 작업
- ✅ 20분+ 세션 지속성이 필수인 경우
  - 장기 실행 프로세스
  - 상태 유지 필요 작업

**트리거 키워드:** "SSH", "원격 서버", "세션 유지", "장기 실행", "원격 접속"

**설치 명령 (필요시에만):**
```bash
npx -y @smithery/cli install @weidwonder/terminal-mcp-server --client claude
```

## [!!] 자동 감지 시스템

### 감지 프로세스
```javascript
// 사용자 요청 분석
if (request.includes(TRIGGER_KEYWORDS)) {
    // 1단계: Desktop Commander로 가능한지 확인
    if (canSolveWithDesktopCommander()) {
        return "Desktop Commander 사용";
    }
    
    // 2단계: 정말 특수 기능이 필요한지 재확인
    if (!absolutelyNeedSpecialFeature()) {
        return "기존 도구로 해결 가능";
    }
    
    // 3단계: 필요시에만 설치 제안
    return "특정 MCP 설치 제안";
}
```

## [P1] Desktop Commander = PRIMARY TOOL (90%+ 커버리지)

**Desktop Commander는 파일/터미널 작업의 PRIMARY TOOL입니다:**

| 카테고리 | DC 도구 | 대체 금지 |
|---------|---------|----------|
| 파일 읽기 | `read_file` | cat, head, tail |
| 파일 쓰기 | `write_file` (30줄 청크) | echo >, cat <<EOF |
| 파일 수정 | `edit_block` | sed, awk |
| 디렉토리 | `list_directory` | ls, dir |
| 검색 | `search_code`, `search_files` | grep, rg, find |
| 프로세스 | `start_process`, `list_processes` | - |
| REPL | `interact_with_process` | - |

**90% 이상의 작업은 DC만으로 완료 가능 - 추가 MCP 불필요!**

## [!] 설치 전 체크리스트

추가 MCP 설치 전 반드시 확인:
- [ ] Desktop Commander로 불가능한가?
- [ ] 정말 특수 기능이 필요한가?
- [ ] 일회성 작업이 아닌가?
- [ ] 대안 솔루션이 없는가?
- [ ] 설치 후 제거 계획이 있는가?

## [>>] Bottom-up Initiative

**무분별한 MCP 설치는 시스템을 복잡하게 만들고 충돌을 일으킵니다.**
**Desktop Commander 하나로 충분한 경우가 90%입니다.**
**특수 기능이 정말 필요할 때만 선택적으로 설치하세요.**

---
생성일: 2025-09-10
우선순위: CRITICAL
자동 적용: 모든 MCP 관련 작업 시