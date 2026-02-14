# MCP-Memory-Service 평가 보고서

> **평가일**: 2025-12-26
> **대상**: doobidoo/mcp-memory-service v8.54.3
> **라이선스**: Apache 2.0
> **저장소**: https://github.com/doobidoo/mcp-memory-service

---

## 1. 개요

MCP-Memory-Service는 AI 도구에 **영구적 의미론적 메모리**를 제공하는 MCP 서버입니다.
"프로젝트를 매 세션마다 다시 설명하지 마세요"라는 슬로건처럼, 세션 간 컨텍스트 연속성을 보장합니다.

### 핵심 가치
| 항목 | 내용 |
|------|------|
| **목적** | AI 세션 간 메모리 영속성 |
| **방식** | ChromaDB/SQLite-vec 기반 의미론적 검색 |
| **성능** | 5ms 로컬 읽기, 1700+ 메모리 처리 검증 |
| **호환성** | 13+ AI 도구 (Claude Code, Claude Desktop, VS Code, Cursor 등) |

---

## 2. 주요 기능 분석

### 2.1 핵심 기능
| 기능 | 설명 | 중요도 |
|------|------|--------|
| **Persistent Memory** | 세션 간 메모리 자동 유지 | **높음** |
| **Semantic Search** | 벡터 임베딩 기반 의미론적 검색 | **높음** |
| **Hybrid Backend** | SQLite-vec (로컬) + Cloudflare (클라우드) | 높음 |
| **Document Ingestion** | PDF, TXT, MD, JSON 문서 수집 | 중간 |
| **OAuth 2.1** | 팀 협업 및 메모리 공유 | 중간 |
| **Web Dashboard** | localhost:8000 관리 UI | 낮음 |

### 2.2 지원 AI 도구
- Claude Desktop, Claude Code (공식 지원)
- VS Code, Cursor, Windsurf
- Zed, Cody, Codium
- Amazon Q, JetBrains, Roo Cline
- LibreChat, Raycast

### 2.3 스토리지 백엔드
| 백엔드 | 특징 | 권장 용도 |
|--------|------|----------|
| **SQLite-vec** | 로컬, 5ms 읽기, 오프라인 가능 | 개인 개발 |
| **Cloudflare** | 클라우드, 글로벌 동기화 | 팀 협업 |
| **Hybrid** | 로컬 + 클라우드 동기화 | **권장** |

---

## 3. 현재 환경과의 비교

### 3.1 기존 메모리 솔루션
| 솔루션 | 현재 상태 | 특징 |
|--------|----------|------|
| **kiro-memory** | 설치됨 | 세션 메모리, 작업 추적, 컨벤션 학습 |
| **memory-keeper** | 설치됨 | 컨텍스트 저장/복원 |
| **mem0** | 평가 완료 | 지능형 메모리, MCP Wrapper 필요 |

### 3.2 mcp-memory-service vs 기존 솔루션
| 항목 | kiro-memory | memory-keeper | mcp-memory-service |
|------|-------------|---------------|-------------------|
| **의미론적 검색** | X | X | **O** |
| **벡터 임베딩** | X | X | **O (ChromaDB)** |
| **문서 수집** | X | X | **O** |
| **팀 협업** | X | X | **O (OAuth 2.1)** |
| **오프라인 지원** | O | O | **O** |
| **설치 복잡도** | 낮음 | 낮음 | 중간 |

### 3.3 차별화 포인트
1. **의미론적 검색**: 키워드가 아닌 의미 기반 검색 (가장 큰 장점)
2. **문서 수집**: PDF/MD 등 외부 문서 자동 인덱싱
3. **하이브리드 백엔드**: 로컬 + 클라우드 동기화

---

## 4. 설치 및 통합 방법

### 4.1 기본 설치
```bash
# pip 설치
pip install mcp-memory-service

# 또는 uvx 실행
uvx mcp-memory-service
```

### 4.2 Claude Code 통합
```json
// .claude.json
{
  "mcpServers": {
    "memory": {
      "command": "uvx",
      "args": ["mcp-memory-service"],
      "env": {
        "MCP_MEMORY_CHROMA_PATH": "K:/PortableApps/genai/data/chroma",
        "MCP_MEMORY_BACKUPS_PATH": "K:/PortableApps/genai/data/memory-backups"
      }
    }
  }
}
```

### 4.3 권한 설정
```json
// settings.local.json (이미 와일드카드 적용됨)
"mcp__memory__*"  // 현재 memory MCP 허용됨
```

---

## 5. 평가 점수

### 5.1 세부 평가
| 항목 | 점수 | 근거 |
|------|------|------|
| **기능 완성도** | 9/10 | 의미론적 검색, 다중 백엔드, 문서 수집 |
| **성능** | 9/10 | 5ms 로컬 읽기, 1700+ 메모리 검증 |
| **호환성** | 10/10 | Claude Code 공식 지원, 13+ 도구 |
| **설치 용이성** | 8/10 | pip/uvx 간편 설치, 환경변수 설정 필요 |
| **문서화** | 9/10 | 상세한 README, 다중 언어 지원 |
| **유지보수** | 9/10 | 활발한 개발 (v8.54.3, 2025-12-25) |

### 5.2 종합 점수
**9.0 / 10** - **강력 권장**

---

## 6. 권장 사항

### 6.1 도입 판단
| 조건 | 권장 |
|------|------|
| 의미론적 검색 필요 | **즉시 도입** |
| 문서 수집 필요 | **즉시 도입** |
| 팀 협업 필요 | 도입 고려 |
| 현재 메모리 충분 | 중기 과제 |

### 6.2 기존 솔루션과의 공존
- **kiro-memory**: 작업 관리/컨벤션 학습에 계속 사용
- **memory-keeper**: 단순 컨텍스트 저장에 계속 사용
- **mcp-memory-service**: 의미론적 장기 메모리로 추가

### 6.3 실행 계획
| 단계 | 작업 | 우선순위 |
|------|------|----------|
| 1 | pip install mcp-memory-service | 높음 |
| 2 | .claude.json에 MCP 서버 추가 | 높음 |
| 3 | 기존 메모리와 통합 테스트 | 중간 |
| 4 | 문서 수집 기능 활용 | 낮음 |

---

## 7. 결론

**mcp-memory-service**는 현재 환경에서 **가장 부족한 "의미론적 검색"** 기능을 제공합니다.

### 핵심 장점
1. **의미론적 검색**: 키워드가 아닌 맥락 기반 검색
2. **Claude Code 공식 지원**: 호환성 100%
3. **하이브리드 백엔드**: 로컬 속도 + 클라우드 동기화
4. **활발한 개발**: 최신 버전 (2025-12-25)

### 최종 권장
- **점수**: 9.0/10
- **판정**: **강력 권장 (즉시 도입 가능)**
- **우선순위**: 중기 과제 → **단기 과제로 상향**

---

**작성**: Claude Code 에이전틱 학습 시스템
**참조**: https://github.com/doobidoo/mcp-memory-service
