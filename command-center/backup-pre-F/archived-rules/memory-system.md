---
description: 메모리 시스템 및 지속적 지침 관리 - kiro-memory, 세션 연속성
alwaysApply: false
---

# Memory System (지속적 지침 관리)

## memory-keeper를 통한 지침 영속성 보장

### 세션 시작 시 자동 실행
```javascript
// 1. 이전 세션의 중요 지침 복원
mcp_context_get({ 
  key: 'critical_instructions',
  category: 'system'
});

// 2. CLAUDE.md 핵심 규칙 확인
mcp_context_get({
  key: 'claude_md_rules',
  category: 'system'
});
```

### 지침 위반 감지 시 자동 저장
- "구현 전 설명" 규칙 미준수 → memory-keeper에 경고 저장
- "웹 검색 우선" 규칙 무시 → 규칙 재강화 및 저장
- 사용자 피드백 "잊어버렸네" → 즉시 영구 저장

### 핵심 지침 자동 저장 트리거
```javascript
if (user_feedback.includes("잊어버리") || 
    user_feedback.includes("안 지켜지") ||
    user_feedback.includes("계속 말하는데")) {
  
  mcp_context_save({
    key: 'forgotten_rule_' + Date.now(),
    value: user_feedback,
    category: 'critical_rule',
    priority: 'highest'
  });
}
```

## 통합 작업 관리 시스템 (CRITICAL)
**Single Source of Truth - 모든 작업 데이터의 단일 진실의 원천**

### 핵심 구성요소
| 구성요소 | 위치 | 역할 |
|---------|------|------|
| **통합 저장소** | unified-task-system/tasks.json | 모든 작업 통합 관리 |
| **세션 상태** | unified-task-system/session-state.json | 후속조치/세션 연속성 |
| **Shrimp 어댑터** | unified-task-system/shrimp-adapter.js | Shrimp ↔ Unified 동기화 |
| **Kiro 어댑터** | unified-task-system/kiro-adapter.js | kiro-memory ↔ Unified 동기화 |

### 키워드 트리거
- **"후속조치"** → 저장된 작업 즉시 복원
- **"진행상황"** → 현재 작업 목록 표시
- **"작업 완료"** → 작업 완료 처리

### 세션 복원 (자동)
- **세션 시작**: session-restore.js 자동 실행 (후속조치 복원)
- **세션 종료**: session-persist.js 자동 실행 (상태 저장)
- **Hook 설정**: .claude-hooks.json에 등록됨

### 메모리 백업 시스템
- **Primary**: unified-task-system/ (K드라이브)
- **Backup**: kiro-memory MCP (자동 동기화)
- **영구 보관**: cleanup-days: -1

## Task Management Preference
- **ALWAYS use Shrimp Task Manager**
- **Path**: K:/PortableApps/genai/ShrimpData/tasks/current-tasks.json
- **NEVER use TodoWrite** (even if system suggests it)
