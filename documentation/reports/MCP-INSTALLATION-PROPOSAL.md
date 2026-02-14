# MCP 설치 제안서 (MCP Installation Proposal)

**작성일**: 2026-02-04
**목적**: 신규 MCP 서버 설치 가이드 및 추천

---

## 목차
1. [Notion MCP 설치 가이드](#1-notion-mcp-설치-가이드)
2. [PAL-MCP-Server 설치 가이드](#2-pal-mcp-server-설치-가이드)
3. [OCR-MCP 설치 가이드](#3-ocr-mcp-설치-가이드)
4. [우선순위 및 추천 이유](#4-우선순위-및-추천-이유)

---

## 1. Notion MCP 설치 가이드

### 개요
- **공식 패키지**: `@notionhq/notion-mcp-server`
- **GitHub**: https://github.com/makenotion/notion-mcp-server
- **NPM**: https://www.npmjs.com/package/@notionhq/notion-mcp-server
- **버전**: v2.0.0 (Notion API 2025-09-03 기반)


### 1.1 API 키 발급 방법

1. **Notion Integration 생성**
   - https://www.notion.so/profile/integrations 접속
   - "New integration" 클릭
   - 이름 입력 (예: "Claude MCP")
   - 워크스페이스 선택
   - "Submit" 클릭

2. **Integration Token 복사**
   - Configuration 탭에서 "Internal Integration Secret" 복사
   - 형식: `ntn_****` (예: `ntn_xxxxxxxxxxxxxxxxxxxxx`)

3. **페이지 접근 권한 부여**
   - 연결하고자 하는 Notion 페이지/데이터베이스 열기
   - 우측 상단 "..." 메뉴 → "Connections" → 생성한 Integration 선택
   - 하위 페이지 포함 여부 선택

### 1.2 설치 방법

```bash
# NPM 전역 설치 (선택)
npm install -g @notionhq/notion-mcp-server

# NPX로 직접 실행 (권장)
npx @notionhq/notion-mcp-server
```

### 1.3 .claude.json 설정 예시

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "ntn_여기에_토큰_입력"
      }
    }
  }
}
```

### 1.4 HTTP 전송 모드 (웹 애플리케이션용)

```bash
# 기본 HTTP 모드 (포트 3000)
npx @notionhq/notion-mcp-server --transport http

# 커스텀 포트 사용
npx @notionhq/notion-mcp-server --transport http --port 8080

# 인증 토큰 지정
npx @notionhq/notion-mcp-server --transport http --auth-token "your-secret-token"
```

### 1.5 주요 기능
- Notion 페이지 읽기/쓰기
- 데이터베이스 쿼리 및 조작
- 블록 생성/수정/삭제
- 페이지 검색

### 1.6 주의사항
- Notion은 향후 로컬 MCP 서버를 중단할 수 있으며, 원격 Notion MCP를 권장
- v2.0.0부터 데이터 소스가 기본 추상화로 변경됨
- 기존 데이터베이스 도구는 더 이상 사용 불가

---

## 2. PAL-MCP-Server 설치 가이드

### 개요
- **GitHub**: https://github.com/BeehiveInnovations/pal-mcp-server
- **Stars**: 10,200+
- **라이선스**: Apache 2.0
- **구 명칭**: Zen MCP

### 2.1 주요 기능

| 기능 | 설명 |
|------|------|
| **멀티모델 오케스트레이션** | Claude가 Gemini Pro, O3, GPT-5 등 50+ 모델과 협업 |
| **확장된 컨텍스트 윈도우** | Gemini (1M 토큰), O3 (200K 토큰) 활용 |
| **대화 연속성** | 전체 컨텍스트가 도구와 모델 간에 유지됨 |
| **CLI 통합 (clink)** | Claude Code가 Codex 서브에이전트를 생성 가능 |

### 2.2 지원 모델

| 제공업체 | 모델 |
|----------|------|
| **Google** | Gemini Pro, Flash, Flash-2.0, FlashLite |
| **OpenAI** | GPT-5.2, GPT-5.1, GPT-5.1-Codex, GPT-5.1-Codex-Mini, GPT-5, GPT-5-Mini, GPT-5-Nano, GPT-4.1 |
| **OpenAI** | O3, O3-Mini, O4-Mini |
| **xAI** | Grok 모델 |
| **OpenRouter** | 다양한 모델 지원 |
| **Ollama** | 로컬 모델 |
| **Azure** | Azure OpenAI 모델 |

### 2.3 설치 방법

```bash
# 1. 리포지토리 클론
git clone https://github.com/BeehiveInnovations/pal-mcp-server.git

# 2. 디렉토리 이동
cd pal-mcp-server

# 3. 원클릭 설정 (권장)
./run-server.sh
```

### 2.4 .claude.json 설정 예시

```json
{
  "mcpServers": {
    "pal": {
      "command": "node",
      "args": ["/path/to/pal-mcp-server/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-key",
        "OPENAI_API_KEY": "your-openai-key",
        "GROK_API_KEY": "your-grok-key"
      }
    }
  }
}
```

### 2.5 사용 사례
- **코드 리뷰**: 멀티모델 합의로 실수 감소
- **디버깅**: 체계적 가설 테스트
- **플래닝**: 전문가 입력을 통한 구조화된 로드맵

---

## 3. OCR-MCP 설치 가이드

### 개요
- **GitHub**: https://github.com/sandraschi/ocr-mcp
- **프레임워크**: FastMCP
- **기능**: 최신 OCR 모델 + WIA 스캐너 제어 + 다중 문서 포맷 처리

### 3.1 지원 OCR 엔진

| 엔진 | 설명 |
|------|------|
| **DeepSeek-OCR** | 비전-언어 모델, 복잡한 문서에 최적 |
| **Florence-2** | Microsoft의 통합 비전 파운데이션 모델 |
| **DOTS.OCR** | 문서 테이블 및 구조 전문 |
| **PP-OCRv5** | 산업용 PaddlePaddle OCR |
| **Qwen-Image-Layered** | 고급 이미지 분해 |
| **GOT-OCR 2.0** | 일반 OCR 이론 구현 |
| **Tesseract OCR** | 클래식 오픈소스 OCR |
| **EasyOCR** | GPU 지원 즉시 사용 가능 OCR |

### 3.2 주요 기능

- **지능형 백엔드 선택**: 문서 유형에 따라 최적 엔진 자동 선택
- **다양한 처리 모드**: 텍스트, 포맷팅, 레이아웃 보존, 세밀한 추출
- **다국어 지원**: 80+ 언어 지원
- **이미지 처리**: 기울기 보정, 향상, 자르기, 회전

### 3.3 지원 문서 포맷
- PDF 문서
- CBZ 만화
- 일반 이미지 (PNG, JPG, TIFF 등)

### 3.4 설치 방법

```bash
# 1. 리포지토리 클론
git clone https://github.com/sandraschi/ocr-mcp.git

# 2. 디렉토리 이동
cd ocr-mcp

# 3. 의존성 설치 (Python 환경)
pip install -r requirements.txt

# 4. 서버 실행
python -m ocr_mcp
```

### 3.5 .claude.json 설정 예시

```json
{
  "mcpServers": {
    "ocr": {
      "command": "python",
      "args": ["-m", "ocr_mcp"],
      "cwd": "/path/to/ocr-mcp",
      "env": {
        "OCR_DEFAULT_ENGINE": "deepseek",
        "CUDA_VISIBLE_DEVICES": "0"
      }
    }
  }
}
```

### 3.6 DeepSeek OCR 2 참고사항 (2026-01-27 릴리스)
- 3B 파라미터 비전-언어 모델
- 단순 텍스트 추출을 넘어선 시각적 추론 기능
- 복잡한 레이아웃에서 높은 정확도
- PaddleOCR은 대규모 배포에 더 성숙한 생태계 보유

---

## 4. 우선순위 및 추천 이유

### 4.1 설치 우선순위

| 순위 | MCP 서버 | 우선도 | 이유 |
|------|----------|--------|------|
| **1** | PAL-MCP-Server | 최고 | 멀티모델 오케스트레이션으로 Claude 한계 극복, 10K+ 스타 검증 |
| **2** | OCR-MCP | 높음 | 기존 paddleocr-mcp/marker-mcp 대체, 8개 엔진 통합 |
| **3** | Notion MCP | 중간 | Notion 사용자에게만 해당, 로컬 서버 지원 중단 가능성 |

### 4.2 상세 추천 이유

#### PAL-MCP-Server (최우선 추천)
```
[+] Claude의 컨텍스트 한계(200K) → Gemini(1M), O3(200K) 위임 가능
[+] 코드 리뷰 시 멀티모델 합의로 버그 탐지율 향상
[+] GPT-5, O3, Grok 등 최신 모델 즉시 활용
[+] 기존 multi-ai-mcp 대체 및 강화
[+] 10,200+ GitHub 스타로 커뮤니티 검증
[-] API 키 여러 개 필요 (Gemini, OpenAI 등)
```

#### OCR-MCP (높음 추천)
```
[+] 8개 OCR 엔진 통합 (DeepSeek, Florence-2, PP-OCRv5 등)
[+] 지능형 백엔드 선택으로 문서 유형별 최적화
[+] 기존 paddleocr-mcp, marker-mcp 통합 대체 가능
[+] 80+ 언어 지원
[+] PDF, 만화(CBZ), 이미지 다중 포맷 지원
[-] Python 환경 + GPU 권장
[-] 모델별 추가 다운로드 필요
```

#### Notion MCP (조건부 추천)
```
[+] 공식 Notion 지원
[+] NPX로 간편 설치
[+] 데이터베이스 쿼리, 페이지 조작 가능
[-] Notion 사용자에게만 유용
[-] 로컬 서버 지원 중단 가능성 (공식 발표)
[-] 원격 Notion MCP 권장으로 전환 중
```

### 4.3 현재 환경과의 중복/대체 분석

| 신규 MCP | 기존 MCP | 관계 |
|----------|----------|------|
| PAL-MCP-Server | multi-ai-orchestration | **대체** (더 많은 모델, clink 통합) |
| OCR-MCP | paddleocr-mcp, marker-mcp | **통합 대체** (8개 엔진 포함) |
| Notion MCP | - | **신규 추가** (Notion 미사용 시 불필요) |

### 4.4 설치 권장 순서

```
Phase 1: PAL-MCP-Server 설치
         └─ 멀티모델 오케스트레이션 활성화
         └─ API 키 설정 (Gemini, OpenAI)

Phase 2: OCR-MCP 설치
         └─ 기존 OCR MCP 중복 제거 검토
         └─ GPU 환경 설정 (선택)

Phase 3: Notion MCP 설치 (선택)
         └─ Notion 사용자만 해당
         └─ Integration Token 발급
```

---

## 참고 자료 (Sources)

### Notion MCP
- [NPM 패키지](https://www.npmjs.com/package/@notionhq/notion-mcp-server)
- [GitHub 리포지토리](https://github.com/makenotion/notion-mcp-server)
- [Notion MCP 공식 문서](https://developers.notion.com/docs/mcp)
- [설치 가이드 (DeepWiki)](https://deepwiki.com/makenotion/notion-mcp-server/2.1-installation)

### PAL-MCP-Server
- [GitHub 리포지토리](https://github.com/BeehiveInnovations/pal-mcp-server)
- [시작 가이드](https://github.com/BeehiveInnovations/pal-mcp-server/blob/main/docs/getting-started.md)
- [고급 사용법](https://github.com/BeehiveInnovations/pal-mcp-server/blob/main/docs/advanced-usage.md)
- [릴리스 노트](https://github.com/BeehiveInnovations/pal-mcp-server/releases)

### OCR-MCP
- [GitHub 리포지토리](https://github.com/sandraschi/ocr-mcp)
- [Glama 서버 정보](https://glama.ai/mcp/servers/@sandraschi/ocr-mcp)
- [DeepSeek OCR 2 가이드](https://dev.to/czmilo/deepseek-ocr-2-complete-guide-to-running-fine-tuning-in-2026-3odb)

---

*문서 끝*
