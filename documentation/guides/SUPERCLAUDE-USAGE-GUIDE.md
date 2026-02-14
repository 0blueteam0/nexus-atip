# SuperClaude Framework 사용 가이드

## SuperClaude란?

SuperClaude는 Claude Code의 기능을 확장하는 메타 프로그래밍 프레임워크입니다.
- **22개 전문 명령어** (/sc: prefix)
- **14개 AI 전문가 페르소나**
- **6개 MCP 서버 통합**
- **6개 행동 모드**

## [!] 중요: SuperClaude 작동 원리

SuperClaude는 실행되는 소프트웨어가 아닙니다!
- Claude Code가 특수 지침 파일을 읽어 행동을 변경합니다
- `/sc:` 명령어는 Claude의 행동 패턴을 트리거합니다
- 실제 코드 실행이 아닌 컨텍스트 기반 행동 변경입니다

## 핵심 명령어 (Essential Commands)

### 1. `/sc:brainstorm` - 프로젝트 발견
```
/sc:brainstorm "아이디어"
```
- 대화형 요구사항 발견
- 프로젝트 계획 수립
- 예: `/sc:brainstorm "전자상거래 플랫폼"`

### 2. `/sc:implement` - 기능 개발
```
/sc:implement "기능 설명"
```
- 풀스택 기능 구현
- 전문가 자동 라우팅
- 예: `/sc:implement "JWT 로그인 시스템"`

### 3. `/sc:analyze` - 코드 분석
```
/sc:analyze [경로]
```
- 품질, 보안, 성능 분석
- 아키텍처 평가
- 예: `/sc:analyze --focus security`

### 4. `/sc:business-panel` - 비즈니스 전략 분석
```
/sc:business-panel "내용"
```
- 9명의 비즈니스 리더 관점
- 전략적 분석 제공

### 5. `/sc:test` - 테스트 생성
```
/sc:test [파일]
```
- 자동 테스트 케이스 생성
- 커버리지 분석

### 6. `/sc:optimize` - 성능 최적화
```
/sc:optimize [타겟]
```
- 성능 병목 지점 식별
- 최적화 제안

### 7. `/sc:secure` - 보안 강화
```
/sc:secure [경로]
```
- 취약점 스캔
- 보안 권장사항

### 8. `/sc:mode` - 행동 모드 변경
```
/sc:mode [brainstorm|orchestration|token-efficiency]
```
- 작업별 최적 모드 선택

## 전체 명령어 목록

### 개발 명령어
- `/sc:implement` - 기능 구현
- `/sc:build` - 프로젝트 빌드
- `/sc:fix` - 버그 수정
- `/sc:refactor` - 코드 리팩토링
- `/sc:architect` - 시스템 설계

### 분석 명령어
- `/sc:analyze` - 코드 분석
- `/sc:review` - 코드 리뷰
- `/sc:secure` - 보안 검사
- `/sc:test` - 테스트 생성

### 워크플로우 명령어
- `/sc:brainstorm` - 아이디어 탐색
- `/sc:plan` - 프로젝트 계획
- `/sc:mode` - 모드 전환
- `/sc:business-panel` - 비즈니스 분석

### 운영 명령어
- `/sc:deploy` - 배포 준비
- `/sc:monitor` - 모니터링 설정
- `/sc:optimize` - 성능 최적화
- `/sc:migrate` - 마이그레이션

### 유틸리티 명령어
- `/sc:help` - 도움말
- `/sc:document` - 문서화
- `/sc:sync` - 동기화
- `/sc:status` - 상태 확인

## AI 전문가 페르소나 (@agent)

### 사용법
```
@agent-[이름] "작업"
```

### 전문가 목록
- `@agent-security` - 보안 전문가
- `@agent-frontend` - 프론트엔드 전문가
- `@agent-backend` - 백엔드 전문가
- `@agent-architect` - 시스템 아키텍트
- `@agent-tester` - 테스트 전문가
- `@agent-devops` - DevOps 엔지니어
- `@agent-database` - 데이터베이스 전문가
- `@agent-performance` - 성능 엔지니어
- `@agent-ui-ux` - UI/UX 디자이너
- `@agent-product` - 제품 관리자
- `@agent-data` - 데이터 과학자
- `@agent-mobile` - 모바일 개발자
- `@agent-cloud` - 클라우드 아키텍트
- `@agent-reviewer` - 코드 리뷰어

## 행동 모드

### 1. Brainstorm Mode
```
/sc:mode brainstorm
```
- 창의적 문제 해결
- 대화형 탐색

### 2. Orchestration Mode
```
/sc:mode orchestration
```
- 체계적 작업 관리
- 병렬 처리 최적화

### 3. Token-Efficiency Mode
```
/sc:mode token-efficiency
```
- 토큰 사용 최적화
- 간결한 응답

### 4. Task Management Mode
```
/sc:mode task-management
```
- 작업 체계화
- 진행 상황 추적

### 5. Business Panel Mode
```
/sc:mode business-panel
```
- 다중 관점 분석
- 전략적 조언

### 6. Introspection Mode
```
/sc:mode introspection
```
- 메타 인지 분석
- 자기 성찰

## 실제 워크플로우 예시

### 새 프로젝트 시작
```
1. /sc:brainstorm "온라인 쇼핑몰"
2. /sc:architect "시스템 설계"
3. /sc:implement "사용자 인증"
4. /sc:test
5. /sc:secure
6. /sc:deploy
```

### 기존 프로젝트 개선
```
1. /sc:analyze .
2. /sc:review src/
3. /sc:refactor "성능 개선"
4. /sc:optimize
5. /sc:test
```

### 버그 수정
```
1. /sc:analyze --focus issues
2. /sc:fix "로그인 버그"
3. /sc:test auth/
4. /sc:secure auth/
```

## 플래그 옵션

### 공통 플래그
- `--think` - 심층 분석
- `--safe-mode` - 안전 모드
- `--verbose` - 상세 출력
- `--focus [영역]` - 특정 영역 집중

### 예시
```
/sc:analyze --focus security --verbose
/sc:implement "API" --type backend --think
/sc:brainstorm "앱" --strategy creative
```

## 자주 사용하는 조합

### 풀스택 개발
```
/sc:brainstorm → /sc:architect → /sc:implement → /sc:test → /sc:deploy
```

### 코드 품질 개선
```
/sc:analyze → /sc:review → /sc:refactor → /sc:optimize → /sc:test
```

### 보안 강화
```
/sc:secure → /sc:fix → /sc:test → /sc:review
```

## [!] Claude Code에서 사용 시 주의사항

1. **터미널이 아닌 Claude Code 채팅에서 사용**
2. **실제 실행이 아닌 행동 패턴 변경**
3. **MCP 서버는 별도 설치 필요**
4. **K드라이브 전용 환경에서 작동**

## 설치 확인

터미널에서:
```bash
K:/PortableApps/tools/python-portable/python.exe -m SuperClaude --version
```

Claude Code에서:
```
/sc:help
```

---
작성일: 2025-09-02
버전: SuperClaude 4.0.8
위치: K:/PortableApps/genai