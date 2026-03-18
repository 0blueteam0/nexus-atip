# New Tools Installation Guide (2026-03-16)

> 3개 오픈소스 도구 설치 및 활용 가이드
> mcp2cli | CLI-Anything | autoresearch (Karpathy)

---

## 1. mcp2cli v2.2.1

### 개요
| 항목 | 내용 |
|------|------|
| **Repository** | https://github.com/knowsuchagency/mcp2cli |
| **Stars** | 1.1k+ |
| **License** | MIT |
| **설치 위치** | `K:/PortableApps/genai/.local/bin/mcp2cli.exe` |
| **설치 방법** | `uv tool install mcp2cli` |
| **버전** | 2.2.1 |
| **Python** | uv 가상환경 (자동 관리) |

### 핵심 가치
MCP 서버, OpenAPI 스펙, GraphQL 엔드포인트를 **런타임에 CLI로 변환**.
LLM 컨텍스트에 전체 스키마를 주입하지 않고 **on-demand CLI 호출**로
토큰 비용을 **96~99% 절감**.

기존 방식: 38개 MCP 서버의 모든 도구 스키마를 매 턴마다 컨텍스트에 주입
-> ~145,000 토큰 소비

mcp2cli 방식: 필요한 도구만 CLI로 호출
-> ~3,300 토큰 (97.7% 감소)

### 지원 프로토콜
| 프로토콜 | 플래그 | 예시 |
|----------|--------|------|
| MCP (HTTP/SSE) | `--mcp <URL>` | `--mcp http://localhost:3000/mcp` |
| MCP (stdio) | `--mcp-stdio "<cmd>"` | `--mcp-stdio "npx server-fs /"` |
| OpenAPI | `--spec <URL/FILE>` | `--spec ./openapi.yaml` |
| GraphQL | `--graphql <URL>` | `--graphql http://localhost:4000/graphql` |

### 주요 CLI 명령어

```bash
# 도구 목록 조회
mcp2cli --mcp http://localhost:3000/mcp --list

# 도구 검색
mcp2cli --mcp http://localhost:3000/mcp --search "file"

# 도구 호출
mcp2cli --mcp http://localhost:3000/mcp read_file --path "/tmp/test.txt"

# OpenAPI 엔드포인트 조회
mcp2cli --spec https://petstore.swagger.io/v2/swagger.json --list

# GraphQL 쿼리
mcp2cli --graphql http://localhost:4000/graphql users --limit 10

# 설정 저장 (bake) - 반복 사용 시 편리
mcp2cli bake create firecrawl --mcp http://localhost:3002/mcp
mcp2cli @firecrawl --list

# 토큰 최적화 출력 (TOON 형식)
mcp2cli --mcp <URL> <tool> --toon

# 세션 관리 (persistent)
mcp2cli --session-start my-session --mcp <URL>
mcp2cli --session my-session <tool> --param value
mcp2cli --session-stop my-session

# 리소스 조회
mcp2cli --mcp <URL> --list-resources
mcp2cli --mcp <URL> --read-resource "resource://uri"
```

### 우리 환경에서의 활용 시나리오

```bash
# firecrawl self-hosted MCP 도구 확인
mcp2cli --mcp http://localhost:3002/mcp --list

# n8n MCP 서버 워크플로우 조회
mcp2cli --mcp http://localhost:5678/mcp --list

# stdio 기반 MCP 서버 테스트
mcp2cli --mcp-stdio "node K:/PortableApps/genai/mcp-servers/git-mcp-server/index.js" --list
```

### Claude Code Skill 등록
- 위치: `.claude/skills/mcp2cli/SKILL.md`
- 트리거: "mcp2cli", "MCP CLI", "토큰 절감"

---

## 2. CLI-Anything (HKUDS)

### 개요
| 항목 | 내용 |
|------|------|
| **Repository** | https://github.com/HKUDS/CLI-Anything |
| **Stars** | 15.1k+ |
| **License** | MIT |
| **설치 위치** | `~/.claude/plugins/cli-anything/` |
| **Clone 위치** | `K:/PortableApps/genai/mcp-servers/cli-anything/` |
| **요구사항** | Python 3.10+, 대상 소프트웨어 설치 필요 |

### 핵심 가치
GUI 소프트웨어를 **자동으로 CLI 인터페이스로 변환**하는 Claude Code 플러그인.
AI 에이전트가 GIMP, Blender, LibreOffice 등을 **프로그래밍적으로 제어** 가능.

기존 방식: 스크린샷 -> 픽셀 클릭 -> 불안정한 UI 파싱
CLI-Anything 방식: 실제 앱 백엔드 API를 직접 호출 -> 결정론적, 안정적

### 7단계 자동 파이프라인
```
Phase 1: Analyze   - 소스코드 스캔, GUI 액션 -> API 매핑
Phase 2: Design    - 명령어 그룹, 상태 모델, 출력 형식 설계
Phase 3: Implement - Click CLI + REPL + JSON 출력 구현
Phase 4: Plan Tests - 테스트 계획 수립
Phase 5: Write Tests - 포괄적 테스트 작성
Phase 6: Document  - 문서 자동 생성
Phase 7: Publish   - setup.py 생성, PATH 설치
```

### 지원 소프트웨어 (검증됨)
| 소프트웨어 | 분야 | CLI 명령어 |
|-----------|------|-----------|
| GIMP | 이미지 편집 | `cli-anything-gimp` |
| Blender | 3D 모델링 | `cli-anything-blender` |
| LibreOffice | 오피스 스위트 | `cli-anything-libreoffice` |
| Audacity | 오디오 편집 | `cli-anything-audacity` |
| Inkscape | 벡터 그래픽 | `cli-anything-inkscape` |
| OBS Studio | 스트리밍/녹화 | `cli-anything-obs` |
| Shotcut | 동영상 편집 | `cli-anything-shotcut` |
| Kdenlive | 동영상 편집 | `cli-anything-kdenlive` |
| Draw.io | 다이어그램 | `cli-anything-drawio` |
| Zoom | 화상회의 | `cli-anything-zoom` |
| AnyGen | 범용 | `cli-anything-anygen` |

### Claude Code 사용법

```bash
# 플러그인 리로드 (설치 후 첫 사용 시)
/reload-plugins

# GIMP CLI 하네스 생성 (10~15분 소요)
/cli-anything gimp

# 생성된 CLI 설치
cd K:/PortableApps/genai/mcp-servers/cli-anything/gimp/agent-harness
pip install -e .

# CLI 사용
cli-anything-gimp --help
cli-anything-gimp project new --width 800 --height 600 -o test.json
cli-anything-gimp repl  # REPL 모드

# 기존 CLI 개선 (리파인)
/cli-anything:refine gimp
/cli-anything:refine gimp "batch processing and filters"

# 테스트 실행
/cli-anything:test gimp

# 품질 검증
/cli-anything:validate gimp
```

### 플러그인 명령어 목록
| 명령어 | 설명 |
|--------|------|
| `/cli-anything <app>` | 전체 CLI 하네스 생성 (7단계) |
| `/cli-anything:refine <app>` | 기존 CLI 기능 확장 |
| `/cli-anything:test <app>` | 테스트 실행 |
| `/cli-anything:validate <app>` | 품질 검증 |
| `/cli-anything:list` | 생성된 CLI 목록 |

### 활용 시나리오
- GIMP으로 이미지 일괄 처리 자동화
- LibreOffice 문서 변환 파이프라인
- Blender 3D 모델 배치 렌더링
- OBS Studio 녹화 자동화

---

## 3. autoresearch (Karpathy)

### 개요
| 항목 | 내용 |
|------|------|
| **Repository** | https://github.com/karpathy/autoresearch |
| **Stars** | 36,000+ |
| **License** | MIT |
| **Clone 위치** | `K:/PortableApps/genai/mcp-servers/autoresearch/` |
| **요구사항** | NVIDIA GPU (H100 테스트), Python 3.10+, uv |
| **PyTorch** | 2.9.1+cu128 (설치 완료) |
| **의존성 상태** | 설치 완료 (`.venv/` 내) |

### 핵심 가치
AI 에이전트가 **자율적으로 ML 실험을 반복 수행**하는 자동 연구 시스템.
밤새 ~100개 실험 자동 수행. 코드 수정 -> 학습(5분) -> 평가 -> 유지/폐기 -> 반복.

"연구자가 자는 동안 AI가 연구한다"

### 아키텍처

```
program.md (인간이 편집 - 에이전트 지시사항)
     |
     v
[AI Agent] (Claude/Codex)
     |
     v
train.py (에이전트가 편집 - 모델/옵티마이저/하이퍼파라미터)
     |
     v
[GPU Training] (5분 고정 시간 예산)
     |
     v
[Evaluation] val_bpb (낮을수록 좋음)
     |
     +---> 개선됨 -> git commit (유지) -> 다음 실험
     +---> 동일/악화 -> git reset (폐기) -> 다음 실험
```

### 3개 핵심 파일
| 파일 | 역할 | 편집 |
|------|------|------|
| `prepare.py` | 데이터 준비, 토크나이저, 데이터로더, 평가 | 수정 금지 |
| `train.py` | 모델 아키텍처, 옵티마이저, 학습 루프 | 에이전트가 수정 |
| `program.md` | 에이전트 지시사항 (스킬) | 인간이 수정 |

### 실행 방법

#### 로컬 (NVIDIA GPU 있는 경우)
```bash
cd K:/PortableApps/genai/mcp-servers/autoresearch

# 1. 데이터 준비 (최초 1회, ~2분)
uv run prepare.py

# 2. 수동 학습 테스트 (~5분)
uv run train.py

# 3. AI 에이전트 실행
# Claude Code에서:
# "program.md를 읽고 새 실험을 시작해줘"
```

#### RunPod GPU (원격)
```bash
# RunPod에서 H100 인스턴스 시작
# SSH 접속 후:
git clone https://github.com/karpathy/autoresearch.git
cd autoresearch
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync
uv run prepare.py
uv run train.py

# Claude Code 원격 연결 후 program.md 참조
```

### 실험 결과 형식
```
commit    val_bpb    memory_gb  status   description
a1b2c3d   0.997900   44.0       keep     baseline
b2c3d4e   0.993200   44.2       keep     increase LR to 0.04
c3d4e5f   1.005000   44.0       discard  switch to GeLU activation
d4e5f6g   0.000000   0.0        crash    double model width (OOM)
```

### 설계 철학
- **단일 파일 수정**: train.py만 변경 -> 범위 관리 용이, diff 리뷰 가능
- **고정 시간 예산**: 항상 5분 -> 실험 간 직접 비교 가능
- **자체 완결**: PyTorch + 소수 패키지, 분산 학습 없음, 단일 GPU
- **간결성 우선**: 같은 결과라면 더 간단한 코드가 승리

### Windows RTX 포크
로컬 RTX GPU 사용 시: https://github.com/jsegov/autoresearch-win-rtx

### 제한 사항
- NVIDIA GPU 필수 (CPU/MPS 미지원)
- 현재 단일 GPU만 지원
- 로컬 Windows 환경에서는 GPU 없으면 실행 불가
- RunPod 등 클라우드 GPU 권장

---

## 비교 요약

| 항목 | mcp2cli | CLI-Anything | autoresearch |
|------|---------|-------------|--------------|
| **목적** | MCP 토큰 비용 절감 | GUI 앱 CLI 변환 | 자율 ML 연구 |
| **Stars** | 1.1k | 15.1k | 36k |
| **즉시 활용** | O (즉시) | O (플러그인) | X (GPU 필요) |
| **설치 난이도** | 쉬움 | 쉬움 | 중간 |
| **우리 환경 적합도** | 매우 높음 | 높음 | 조건부 (RunPod) |
| **ROI** | 토큰 97% 절감 | 앱 자동화 | ML 연구 가속 |

---

## 설치 경로 요약

| 도구 | 실행 파일/위치 |
|------|---------------|
| mcp2cli | `K:/PortableApps/genai/.local/bin/mcp2cli.exe` |
| CLI-Anything (plugin) | `~/.claude/plugins/cli-anything/` |
| CLI-Anything (repo) | `K:/PortableApps/genai/mcp-servers/cli-anything/` |
| autoresearch (repo) | `K:/PortableApps/genai/mcp-servers/autoresearch/` |
| autoresearch (venv) | `K:/PortableApps/genai/mcp-servers/autoresearch/.venv/` |

---

## PATH 설정

mcp2cli 사용을 위해 PATH에 추가 필요:
```bash
export PATH="K:/PortableApps/genai/.local/bin:$PATH"
```

claude.bat에 추가 권장:
```batch
set PATH=K:\PortableApps\genai\.local\bin;%PATH%
```

---

Version: 1.0.0
Date: 2026-03-16
Author: Claude Code (Auto-generated)
