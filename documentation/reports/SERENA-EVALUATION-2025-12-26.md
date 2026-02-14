# Serena 평가 보고서

> **평가일**: 2025-12-26
> **대상**: oraios/serena
> **라이선스**: MIT
> **저장소**: https://github.com/oraios/serena

---

## 1. 개요

Serena는 **의미론적 코드 검색 및 편집** 기능을 제공하는 코딩 에이전트 툴킷입니다.
LSP(Language Server Protocol)를 활용하여 30+ 프로그래밍 언어를 지원합니다.

### 핵심 가치
| 항목 | 내용 |
|------|------|
| **목적** | AI를 위한 IDE 수준의 코드 도구 제공 |
| **방식** | LSP 기반 의미론적 코드 분석 |
| **지원 언어** | 30+ (TypeScript, Python, Rust, Go 등) |
| **호환성** | Claude Code, Claude Desktop, Codex, ChatGPT |

### 스폰서
- VS Code 팀 + Microsoft OSPO
- GitHub Open Source

---

## 2. 주요 기능 분석

### 2.1 핵심 도구
| 도구 | 설명 | 유사 IDE 기능 |
|------|------|--------------|
| **find_symbol** | 심볼 정의 검색 | Go to Definition |
| **find_referencing_symbols** | 참조 위치 검색 | Find All References |
| **insert_after_symbol** | 심볼 뒤에 코드 삽입 | Smart Insert |
| **get_project_context** | 프로젝트 구조 분석 | Project Explorer |
| **semantic_search** | 의미론적 코드 검색 | Semantic Search |

### 2.2 지원 언어 (30+)
- **주요**: TypeScript, JavaScript, Python, Rust, Go, Java, C/C++
- **추가**: Ruby, PHP, Swift, Kotlin, Scala, Haskell, Elixir 등
- **LSP 기반**: 표준 Language Server 활용

### 2.3 통합 방식
| 방식 | 설명 |
|------|------|
| **MCP Server** | Claude Code/Desktop 통합 |
| **JetBrains Plugin** | IntelliJ, PyCharm 등 |
| **mcpo** | ChatGPT 연동 |

---

## 3. 현재 환경과의 비교

### 3.1 기존 코드 분석 도구
| 도구 | 현재 상태 | 기능 |
|------|----------|------|
| **Grep** | 내장 | 텍스트 패턴 검색 |
| **Glob** | 내장 | 파일 패턴 검색 |
| **Read** | 내장 | 파일 읽기 |
| **LSP Tool** | 2.0.74 추가 | 기본 LSP 기능 |

### 3.2 Serena vs 기존 도구
| 항목 | Grep/Glob | LSP Tool | Serena |
|------|-----------|----------|--------|
| **의미론적 검색** | X | 부분 | **O** |
| **심볼 참조 추적** | X | O | **O** |
| **스마트 삽입** | X | X | **O** |
| **프로젝트 컨텍스트** | X | X | **O** |
| **30+ 언어 지원** | X | O | **O** |
| **MCP 통합** | N/A | X | **O** |

### 3.3 차별화 포인트
1. **insert_after_symbol**: 정확한 위치에 코드 삽입 (Edit 도구보다 정밀)
2. **프로젝트 컨텍스트**: 전체 코드베이스 구조 파악
3. **의미론적 검색**: 코드 의미 기반 검색

---

## 4. 설치 및 통합 방법

### 4.1 기본 설치
```bash
# uvx로 MCP 서버 시작
uvx --from git+https://github.com/oraios/serena serena start-mcp-server

# 또는 pip 설치
pip install serena
serena start-mcp-server
```

### 4.2 Claude Code 통합
```json
// .claude.json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--project-root", "K:/PortableApps/genai"
      ]
    }
  }
}
```

### 4.3 프로젝트 설정
```yaml
# serena.yaml (프로젝트 루트)
project:
  name: "Claude-Code"
  root: "K:/PortableApps/genai"
  languages:
    - javascript
    - typescript
    - python
```

---

## 5. 평가 점수

### 5.1 세부 평가
| 항목 | 점수 | 근거 |
|------|------|------|
| **기능 완성도** | 8/10 | IDE 수준 도구, 의미론적 검색 |
| **성능** | 8/10 | LSP 기반, 대규모 프로젝트 지원 |
| **호환성** | 9/10 | Claude Code 공식 지원, MCP 통합 |
| **설치 용이성** | 7/10 | uvx 간편 설치, 프로젝트 설정 필요 |
| **문서화** | 8/10 | 상세한 README, 예제 제공 |
| **유지보수** | 8/10 | 활발한 개발, MS 스폰서 |

### 5.2 종합 점수
**8.0 / 10** - **권장**

---

## 6. 권장 사항

### 6.1 도입 판단
| 조건 | 권장 |
|------|------|
| 대규모 코드베이스 작업 | **즉시 도입** |
| 심볼 참조 추적 필요 | **즉시 도입** |
| 정밀한 코드 삽입 필요 | 도입 고려 |
| 현재 Grep/Glob 충분 | 중기 과제 |

### 6.2 기존 도구와의 공존
- **Grep/Glob**: 단순 텍스트/파일 검색에 계속 사용
- **LSP Tool**: 기본 언어 서버 기능
- **Serena**: 의미론적 코드 분석/편집으로 보완

### 6.3 실행 계획
| 단계 | 작업 | 우선순위 |
|------|------|----------|
| 1 | uvx로 MCP 서버 테스트 | 높음 |
| 2 | .claude.json에 MCP 서버 추가 | 중간 |
| 3 | serena.yaml 프로젝트 설정 | 중간 |
| 4 | 기존 워크플로우 통합 | 낮음 |

---

## 7. 결론

**Serena**는 현재 환경에서 **코드 의미론적 분석** 기능을 강화할 수 있습니다.

### 핵심 장점
1. **IDE 수준 도구**: find_symbol, find_referencing_symbols
2. **스마트 삽입**: insert_after_symbol로 정밀한 코드 편집
3. **30+ 언어 지원**: LSP 기반 광범위 지원
4. **MS 스폰서**: 안정적 유지보수 기대

### 고려 사항
1. **설정 복잡도**: serena.yaml 프로젝트 설정 필요
2. **기존 LSP Tool 중복**: 2.0.74에서 추가된 LSP Tool과 기능 중복 가능

### 최종 권장
- **점수**: 8.0/10
- **판정**: **권장 (테스트 후 도입)**
- **우선순위**: 중기 과제 유지
- **조건**: LSP Tool과 기능 비교 후 결정

---

**작성**: Claude Code 에이전틱 학습 시스템
**참조**: https://github.com/oraios/serena
