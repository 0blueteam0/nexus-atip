# MCP Servers Directory

## Overview
이 폴더에는 Claude Code에서 사용하는 MCP (Model Context Protocol) 서버들이 있습니다.

---

## Firecrawl Versions

| 폴더 | 유형 | 용도 | Docker 필요 |
|------|------|------|-------------|
| `firecrawl-self-hosted/` | Self-hosted | 메인 - Docker 기반 전체 기능 | O |
| `firecrawl-simple/` | API 기반 | 백업/테스트용 (API 키 필요) | X |

### firecrawl-self-hosted (권장)
- Docker Compose로 실행
- API 키 불필요
- 전체 기능 사용 가능
- 포트: 3002

### firecrawl-simple
- API 키 기반 (FIRECRAWL_API_KEY 필요)
- Docker 불필요
- 제한된 기능
- 폴백/테스트 용도

---

## 기타 MCP 서버

| 폴더 | 용도 |
|------|------|
| `searxng-crawl4ai-mcp/` | 메타 검색 + AI 크롤링 |
| `deep-research-mcp/` | 딥리서치 |
| `multi-ai-mcp/` | 멀티 AI 오케스트레이션 |
| `llm-council-mcp/` | LLM 합의 시스템 |
| `paper-search-mcp/` | 학술 논문 검색 |
| `marker-mcp/` | PDF 변환 |
| `paddleocr-mcp/` | OCR |

---

## 설정 참조
- 메인 설정: `../.claude.json` (40+ MCP 서버 정의)
- 확장 설정: `../.mcp.json` (추가 서버)

---

*Last Updated: 2026-01-19*
