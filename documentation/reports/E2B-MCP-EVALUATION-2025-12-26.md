# e2b MCP Server 평가 보고서

> **평가일**: 2025-12-26
> **저장소**: github.com/e2b-dev/mcp-server
> **Stars**: 2,000+

---

## 1. 개요

### e2b란?
- **E2B (Execute To Build)**: 클라우드 기반 코드 실행 샌드박스
- **MCP 통합**: Claude Code와 직접 연동 가능
- **핵심 기능**: 안전한 격리 환경에서 코드 실행

### 주요 특징
| 특징 | 설명 |
|------|------|
| 클라우드 샌드박스 | 로컬 시스템 영향 없이 코드 실행 |
| 다중 언어 | Python, JavaScript, TypeScript, Bash 등 |
| 파일 시스템 | 가상 파일 시스템 제공 |
| 네트워크 격리 | 안전한 네트워크 환경 |
| MCP 프로토콜 | 표준 MCP 인터페이스 |

---

## 2. 설치 방법

### Smithery CLI (권장)
```bash
npx @smithery/cli install e2b --client claude
```

### 수동 설치
```bash
npm install -g @e2b/mcp-server
```

### 환경 변수
```bash
E2B_API_KEY=your-api-key
```

---

## 3. 현재 환경과의 비교

### 현재 코드 실행 도구
| 도구 | 환경 | 격리 | 위험도 |
|------|------|------|--------|
| Bash | 로컬 | X | 높음 |
| desktop-commander | 로컬 | X | 높음 |
| runpod-jupyter | 원격 | O | 낮음 |

### e2b 추가 시 장점
| 장점 | 설명 |
|------|------|
| 안전성 | 로컬 시스템 보호 |
| 재현성 | 동일한 실행 환경 보장 |
| 자원 격리 | CPU/메모리 제한 가능 |
| 빠른 시작 | 수초 내 샌드박스 생성 |

---

## 4. 비용 분석

### e2b 가격 (2025 기준)
| 플랜 | 가격 | 포함 |
|------|------|------|
| Free | $0 | 1,000 분/월 |
| Pro | $50/월 | 10,000 분/월 |
| Enterprise | 문의 | 무제한 |

### K드라이브 환경 고려사항
- **포터블 환경**: API 키만 필요 (로컬 의존성 없음)
- **오프라인 사용**: 불가 (클라우드 필수)
- **비용**: 무료 티어로 시작 가능

---

## 5. ATOS 통합 계획

### tool-registry.json 추가
```json
{
  "e2b": {
    "category": "code-execution",
    "priority": "high",
    "tools": ["e2b_execute", "e2b_upload", "e2b_download"],
    "triggers": ["안전하게 실행", "샌드박스", "격리 환경"],
    "chain_with": ["code-reviewer", "test-writer"]
  }
}
```

---

## 6. 권장 사항

### 설치 권장: **조건부 YES**

| 조건 | 권장 |
|------|------|
| 신뢰할 수 없는 코드 실행 필요 | **강력 권장** |
| 테스트 자동화 강화 | 권장 |
| 현재 Bash 충분 | 선택적 |

### 설치 단계
1. e2b 계정 생성 (e2b.dev)
2. API 키 발급
3. `npx @smithery/cli install e2b --client claude`
4. `.claude.json`에 e2b 서버 추가
5. ATOS tool-registry.json 업데이트

---

## 7. 결론

**평가 점수**: 8/10

| 항목 | 점수 | 이유 |
|------|------|------|
| 기능 | 9/10 | 완전한 샌드박스 환경 |
| 통합 용이성 | 8/10 | MCP 표준 준수 |
| 비용 | 7/10 | 무료 티어 제한적 |
| 포터블 호환 | 9/10 | API 키만 필요 |

**최종 권장**: 테스트/안전 실행 필요 시 설치
