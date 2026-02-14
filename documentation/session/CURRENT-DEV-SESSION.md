# 현재 개발 세션 상태 (Current Development Session)
**최종 업데이트: 2025-01-31**

## [LIVE] 실시간 개발 환경 활성화 중

### 현재 상태
- **편집기**: VSCode (활성화)
- **서버**: Vite Dev Server (실행 중)
- **대상 파일**: vite-app/index.html
- **브라우저**: 실시간 미리보기 열림
- **작업 방식**: 사용자 직접 편집 + Claude 보조

### 활성 프로세스
```
[VSCode] ←→ [vite-app/index.html] ←→ [Vite Server] ←→ [브라우저]
                        ↑
                   [Claude Code]
                   (보조 역할)
```

### 주의사항
- **파일 충돌 방지**: 동일 파일 동시 편집 자제
- **저장 시점**: VSCode 저장 → Vite HMR 트리거
- **Claude 역할**: 요청 시에만 파일 수정

### Claude Code 협업 가이드

#### ✅ 해야 할 것
- 사용자 요청 시 특정 부분만 수정
- 새 모듈/컴포넌트 생성
- 복잡한 로직 구현 지원
- 코드 분석 및 최적화 제안

#### ❌ 하지 말아야 할 것
- index.html 전체 덮어쓰기
- 사용자 모르게 자동 수정
- Vite 서버 재시작 명령
- 불필요한 백업 생성

### 현재 작업 컨텍스트
- **주 작업**: vite-app/index.html UI 개선
- **세부 편집**: 부분적인 요소 수정 중
- **개발 모드**: Hot Module Replacement 활성화

### 파일 상태 추적
```
vite-app/
├── index.html          [편집 중 - VSCode]
├── style.css           [대기]
├── app.js              [대기]
└── modules/            [Claude 지원 가능]
```

---
**이 문서는 현재 세션 동안 유효합니다**
세션 종료 시 삭제 또는 아카이브하세요.