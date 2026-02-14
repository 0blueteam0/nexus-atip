# Claude Code Hooks 베스트 프랙티스

## 개요
Claude Code Hooks는 특정 이벤트 발생 시 자동으로 스크립트를 실행하는 시스템입니다.

## Hook 이벤트 종류

| 이벤트 | 설명 | 사용 예시 |
|--------|------|----------|
| session-start | 세션 시작 시 | 컨텍스트 로드, 환경 초기화 |
| session-end | 세션 종료 시 | 작업 요약 저장, 정리 |
| pre-commit | 커밋 전 | 린팅, 테스트 실행 |
| post-commit | 커밋 후 | 알림, 배포 트리거 |
| file-save | 파일 저장 시 | 포맷팅, 검증 |
| context-detection | 특정 키워드 감지 | 도구 자동 추천 |
| important-detection | 중요 키워드 감지 | 자동 저장 |
| periodic-save | 주기적 실행 | 자동 체크포인트 |
| pre-update | 업데이트 전 | 백업 생성 |
| post-update | 업데이트 후 | 최적화 실행 |

## 설정 파일 위치
```
K:/PortableApps/genai/.claude-hooks.json
```

## 기본 구조
```json
{
  "hooks": {
    "hook-name": {
      "enabled": true,
      "command": "node script.js",
      "description": "설명"
    }
  }
}
```

## 권장 패턴

### 1. 세션 시작 Hook
```json
"session-start": {
  "enabled": true,
  "command": "node systems/restore-instructions.js",
  "description": "이전 세션 컨텍스트 복원"
}
```

### 2. 중요 키워드 감지
```json
"important-detection": {
  "enabled": true,
  "triggers": ["결정", "해결", "완료"],
  "action": "auto-save"
}
```

### 3. 주기적 저장
```json
"periodic-save": {
  "enabled": true,
  "interval": "1h"
}
```

## 주의사항
- K드라이브 경로만 사용
- 긴 실행 시간 스크립트 피하기 (타임아웃 위험)
- 에러 핸들링 필수
