# 로그 형식 최적화 플랜

## 메타 정보
- **플랜 ID**: compiled-crafting-whisper
- **버전**: 3.0.0
- **작성일**: 2026-02-04
- **이전**: v2.1.0 (K드라이브 정리) → 완료, plans/completed/로 이동됨

---

## 조사 결과 요약

### 1. 형식별 특성 비교

| 형식 | 장점 | 단점 | 적합 용도 |
|------|------|------|----------|
| **Markdown** | 가독성, Git 친화적, 토큰 효율 (JSON 대비 34-38% 절약) | 구조화 약함, 파싱 어려움 | Changelog, 문서, 일일 로그 |
| **JSON** | 기계 파싱, API 통합, 스키마 검증 | 토큰 소모 높음, 주석 불가 | 자동화, 쿼리, 데이터 저장 |
| **YAML** | 가독성 + 구조화, JSON 대비 20-30% 토큰 절약 | 들여쓰기 민감, 파싱 느림 | 설정 파일, 복잡한 구조 |

### 2. LLM 컨텍스트 최적화 관점

| 발견 | 출처 |
|------|------|
| Markdown이 가장 토큰 효율적 (JSON 대비 34-38% 절약) | [ImprovingAgents](https://www.improvingagents.com/blog/best-nested-data-format/) |
| JSON 테이블은 열 이름 반복으로 토큰 낭비 | [JetBrains Research](https://blog.jetbrains.com/research/2025/12/efficient-context-management/) |
| 컨텍스트 압축으로 40-60% 토큰 감소 가능 | [Agenta](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms) |

### 3. Changelog 업계 표준

| 표준 | 권장 |
|------|------|
| [Keep a Changelog](https://keepachangelog.com/) | CHANGELOG.md (Markdown) |
| [Common Changelog](https://common-changelog.org/) | Markdown + 동사 시작 (Add, Fix, Remove) |
| Git 커밋 로그 | 기계용, Changelog와 분리 권장 |

---

## 판단: 현재 Markdown 로그의 적절성

### [O] 적절한 부분
1. **일일 로그** (`planning-log/daily/*.md`) → Markdown 최적
2. **플랜 파일** (`plans/*.md`) → Markdown 표준
3. **ACTIVE-PLAN.md** → 사람이 읽는 현황 → Markdown 적합

### [!] 개선 필요 부분
1. **구조화된 데이터 부재** - 자동화/쿼리 불가
2. **세션 복원용 데이터** - JSON이 더 적합
3. **통계/분석용** - 현재 형식으로 집계 어려움

---

## 권장 아키텍처: 하이브리드 접근

```
planning-log/
├── daily/
│   ├── 2026-02-04.md        # [유지] 사람용 Markdown 로그
│   └── 2026-02-04.json      # [추가] 기계용 구조화 데이터
├── index.json               # [추가] 전체 로그 인덱스
└── schema.json              # [추가] 데이터 스키마 정의
```

### 역할 분리

| 파일 형식 | 역할 | 소비자 |
|-----------|------|--------|
| `*.md` | 가독성, 리뷰, Git diff | 사람, Claude (컨텍스트) |
| `*.json` | 쿼리, 자동화, 통계 | 스크립트, 대시보드 |

### JSON 스키마 예시

```json
{
  "date": "2026-02-04",
  "sessions": [
    {
      "id": "session-1770158948649-3s4z8cua3",
      "start": "2026-02-04T07:49:08.495Z",
      "actions": [
        {
          "time": "07:52",
          "type": "delete",
          "target": "papers/",
          "destination": "workspaces/research/projects/papers/",
          "status": "completed"
        }
      ],
      "plan": "compiled-crafting-whisper",
      "phase": "phase-6"
    }
  ]
}
```

---

## 구현 계획 (하이브리드 접근 - 확정)

### Phase 1: 스키마 정의
- [ ] `planning-log/schema.json` 생성
- [ ] 필수 필드: date, sessions[], actions[], status, plan, phase

**생성 파일**: `planning-log/schema.json`

### Phase 2: 로그 작성기 구현
- [ ] `planning-system/log-writer.js` 생성
  - `writeMarkdown(date, data)` - MD 파일 작성
  - `writeJson(date, data)` - JSON 파일 작성
  - `writeBoth(date, data)` - 동시 작성

**생성 파일**: `planning-system/log-writer.js`

### Phase 3: Hook 연동
- [ ] `.claude-hooks.json` 수정
  - `planning-workflow-start`: JSON 로그 시작
  - `planning-workflow-end`: JSON 로그 종료 + 저장

**수정 파일**: `.claude-hooks.json`

### Phase 4: 오늘 로그 변환 (테스트)
- [ ] `planning-log/daily/2026-02-04.json` 생성
- [ ] 기존 MD 내용과 동기화 확인

**생성 파일**: `planning-log/daily/2026-02-04.json`

---

## 수정 대상 파일 목록

| 파일 | 작업 | 위험도 |
|------|------|--------|
| `planning-log/schema.json` | 신규 생성 | LOW |
| `planning-system/log-writer.js` | 신규 생성 | LOW |
| `.claude-hooks.json` | Hook 스크립트 경로 추가 | MEDIUM |
| `planning-log/daily/2026-02-04.json` | 신규 생성 (테스트) | LOW |

---

## 검증 계획

1. **스키마 검증**: JSON Schema 유효성 확인
2. **동기화 검증**: MD와 JSON 내용 일치 여부
3. **Hook 테스트**: 세션 시작/종료 시 자동 로깅 확인
4. **쿼리 테스트**: `jq` 등으로 JSON 쿼리 가능 여부

---

## 결론

| 질문 | 답변 |
|------|------|
| **현재 Markdown이 적절한가?** | [O] 부분적으로 적절 - 가독성/토큰 효율 우수 |
| **개선 필요한가?** | [O] 자동화/쿼리용 JSON 병행 권장 |
| **권장 접근법** | **하이브리드** - Markdown(사람) + JSON(기계) |

---

## 참고 자료

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [JSON Logging Best Practices - Loggly](https://www.loggly.com/use-cases/json-logging-best-practices/)
- [Structured Logging Guide - SigNoz](https://signoz.io/blog/structured-logs/)
- [LLM Context Optimization - JetBrains](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)
- [Nested Data Format for LLMs - ImprovingAgents](https://www.improvingagents.com/blog/best-nested-data-format/)

---

**버전**: 3.0.0
**목적**: 로그 형식 최적화 분석 및 하이브리드 접근 제안
