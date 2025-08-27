# 🧠 메모리 MCP 서버 비교 분석

## 📊 후보 서버 (4개)

### 1. **claude-memory-mcp** (WhenMoon-afk)
- **패키지**: `@WhenMoon-afk/claude-memory-mcp`
- **저장 방식**: JSON 파일 + 벡터 검색
- **특징**: 자동 중요도 기반 메모리 관리
- **설치**: Python + pip

### 2. **mcp-memory-service** (doobidoo)
- **패키지**: `mcp-memory-service`
- **저장 방식**: ChromaDB / SQLite-vec (선택)
- **특징**: 꿈 기반 통합 + 10+ AI 클라이언트 지원
- **설치**: Python + Docker 지원

### 3. **mcp-memory-keeper** (mkreyman)
- **패키지**: `mcp-memory-keeper`
- **저장 방식**: SQLite (context.db)
- **특징**: 컨텍스트 압축 방지 + 단순함
- **설치**: Python + SQLite

### 4. **mcp-memory** (Puliczek)
- **패키지**: `mcp-memory`
- **저장 방식**: Cloudflare Workers + 벡터 검색
- **특징**: 클라우드 기반 + 1000개 무료 메모리
- **설치**: 클라우드 서비스

## ⚖️ 비교 매트릭스

| 기준 | claude-memory-mcp | mcp-memory-service | mcp-memory-keeper | mcp-memory |
|------|-------------------|-------------------|-------------------|------------|
| **Windows 호환성** | ✅ Python | ✅ Python/Docker | ✅ Python | ✅ 클라우드 |
| **설치 복잡도** | 🟡 중간 | 🔴 복잡 | 🟢 단순 | 🟢 단순 |
| **의존성** | 적음 | 많음 (ChromaDB) | 최소 | 없음 |
| **로컬 저장** | ✅ JSON | ✅ DB | ✅ SQLite | ❌ 클라우드 |
| **벡터 검색** | ✅ 의미 검색 | ✅ 고급 검색 | ❌ 단순 | ✅ 의미 검색 |
| **자동 관리** | ✅ 중요도 기반 | ✅ 꿈 기반 통합 | ❌ 수동 | ✅ AI 기반 |
| **성능** | 🟡 중간 | 🟡 무거움 | 🟢 빠름 | 🟢 클라우드 |

## 🎯 Windows Native 환경 점수

### 1위: **mcp-memory-keeper** (85/100)
- ✅ 설치 용이성: Python + SQLite만
- ✅ 의존성 최소화: 외부 DB 불필요
- ✅ Windows 안정성: SQLite 네이티브 지원
- ✅ USB 환경 최적: 로컬 파일 기반
- ❌ 기능 제한: 단순 컨텍스트 저장만

### 2위: **claude-memory-mcp** (80/100)
- ✅ 균형잡힌 기능: 의미 검색 + 자동 관리
- ✅ 연구 기반: LLM 메모리 기법 적용
- ✅ JSON 저장: 단순하고 안정적
- 🟡 벡터 라이브러리: 설치 복잡도 증가
- 🟡 문서화: 상대적으로 부족

### 3위: **mcp-memory-service** (70/100)
- ✅ 강력한 기능: ChromaDB + 고급 검색
- ✅ 멀티 클라이언트: 10+ AI 도구 지원
- ✅ 백엔드 선택: SQLite-vec 경량 옵션
- ❌ 설치 복잡: Docker + 많은 의존성
- ❌ 리소스 사용: 무거운 ChromaDB

### 4위: **mcp-memory** (60/100)
- ✅ 제로 설치: 클라우드 기반
- ✅ 무료 티어: 1000개 메모리
- ✅ 성능: Cloudflare 인프라
- ❌ 인터넷 의존: 오프라인 불가
- ❌ 개인정보: 클라우드 저장 우려

## 🏆 최종 추천

### **1순위: mcp-memory-keeper**
**이유**: USB 포터블 환경에 최적화
- 단순한 SQLite 기반으로 안정성 보장
- 컨텍스트 압축 방지가 핵심 목적과 일치
- Windows Native 환경에서 검증된 안정성

### **2순위: claude-memory-mcp** 
**이유**: 기능과 안정성의 균형
- 연구 기반 메모리 기법으로 품질 보장
- JSON 저장으로 단순하면서도 효과적
- 의미 검색으로 실용적 기능 제공

## 🚀 설치 권장 순서

1. **mcp-memory-keeper 우선 설치**: 즉시 사용 가능한 안정적 솔루션
2. **성능 테스트**: 실제 대화에서 메모리 보존 확인
3. **필요시 업그레이드**: claude-memory-mcp로 기능 확장

---
분석일: 2025-08-15 16:30 KST
분석 방법: Shrimp Task Manager 기준 비교 분석