# RunPod + Jupyter MCP 통합 가이드

## 📋 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [RunPod 계정 설정](#runpod-계정-설정)
4. [설치](#설치)
5. [설정](#설정)
6. [사용법](#사용법)
7. [비용 관리](#비용-관리)
8. [트러블슈팅](#트러블슈팅)
9. [FAQ](#faq)

---

## 개요

이 가이드는 K드라이브 Claude Code 환경에서 RunPod GPU 클라우드를 Jupyter MCP 서버를 통해 통합하는 방법을 설명합니다.

### 통합 아키텍처

```
Claude Code (K:/PortableApps/genai)
    ↓
MCP Server (runpod-jupyter)
    ↓
SSH Tunnel (localhost:8888)
    ↓
RunPod GPU Instance (Jupyter Lab)
    ↓
PyTorch/TensorFlow (GPU 가속)
```

### 주요 기능

- **자동 인스턴스 관리**: START/STOP 배치 파일로 간단한 GPU 인스턴스 제어
- **SSH 터널링**: 안전한 로컬 접속 (localhost:8888)
- **비용 추적**: 실시간 비용 모니터링 및 임계값 경고
- **MCP 통합**: Claude Code에서 직접 Jupyter 커널 제어
- **포터블**: K드라이브에 완전히 독립적인 환경

---

## 사전 요구사항

### 필수 소프트웨어

1. **Python 3.8+**
   - 경로: `K:/PortableApps/tools/python/python.exe`
   - 확인: `python --version`

2. **uv (Python 패키지 관리자)**
   - 경로: `K:/PortableApps/tools/uv/uvx.exe`
   - 설치: [uv 설치 가이드](#uv-설치)

3. **SSH 클라이언트**
   - Windows 10/11: 기본 포함
   - 확인: `ssh -V`

4. **Claude Code 2.0.23+**
   - 현재 버전: `claude --version`

### 선택 사항

- **Git**: 설정 백업용
- **텍스트 에디터**: config.json 수정용

---

## RunPod 계정 설정

### 1. 회원가입

1. [RunPod 공식 사이트](https://www.runpod.io/) 접속
2. **Sign Up** 클릭
3. 이메일 인증 완료
4. 크레딧 충전 (최소 $10 권장)

### 2. API 키 발급

1. RunPod 대시보드 로그인
2. 우측 상단 **Settings** → **API Keys**
3. **+ Create API Key** 클릭
4. 이름 입력 (예: `Claude-Code-Integration`)
5. **Read** 및 **Write** 권한 선택
6. **Create** 클릭
7. 생성된 API 키 복사 (한 번만 표시됨!)

### 3. SSH 키 등록

1. SSH 키 생성 (없는 경우):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   - 저장 위치: `C:/Users/[사용자명]/.ssh/id_ed25519`
   - 암호: 선택 사항 (권장: 설정)

2. 공개 키 복사:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. RunPod에 등록:
   - **Settings** → **SSH Keys**
   - **+ Add SSH Key** 클릭
   - 이름 입력 (예: `My-Laptop`)
   - 공개 키 붙여넣기
   - **Add Key** 클릭

---

## 설치

### 1. uv 설치

```batch
REM uv 다운로드 및 설치
curl -LsSf https://astral.sh/uv/install.sh | sh

REM 경로 확인
K:/PortableApps/tools/uv/uvx.exe --version
```

### 2. 디렉토리 구조 생성

```batch
cd K:/PortableApps/genai
mkdir runpod
mkdir runpod\scripts
mkdir runpod\logs
mkdir runpod\data
```

### 3. Python 스크립트 설치

다음 파일들이 자동으로 생성되어 있어야 합니다:
- `runpod/scripts/manager.py` (RunPod API 관리)
- `runpod/scripts/ssh-tunnel.py` (SSH 터널링)
- `runpod/scripts/monitor.py` (비용 추적)

### 4. 배치 파일 확인

다음 배치 파일들이 최상위 디렉토리에 있어야 합니다:
- `START-RUNPOD-GPU.bat`
- `STOP-RUNPOD-GPU.bat`
- `MONITOR-RUNPOD-COST.bat`

### 5. MCP 서버 설정

`.claude.json` 파일에 다음 설정이 포함되어 있는지 확인:

```json
"runpod-jupyter": {
  "type": "stdio",
  "command": "cmd",
  "args": [
    "/c",
    "K:/PortableApps/tools/uv/uvx.exe",
    "jupyter-mcp-server@latest"
  ],
  "env": {
    "JUPYTER_URL": "http://localhost:8888",
    "JUPYTER_TOKEN": "${RUNPOD_JUPYTER_TOKEN}",
    "ALLOW_IMG_OUTPUT": "true"
  }
}
```

### 6. 설치 확인

```batch
REM MCP 서버 목록 확인
claude mcp list

REM runpod-jupyter가 "✓ Connected" 상태인지 확인
```

---

## 설정

### config.json 생성

`K:/PortableApps/genai/runpod/config.json` 파일 생성:

```json
{
  "api_key": "YOUR_RUNPOD_API_KEY_HERE",
  "preferred_gpu": "NVIDIA RTX 4090",
  "max_hourly_cost": 2.0,
  "cost_thresholds": [10, 50, 100],
  "ssh_key_path": "C:/Users/YOUR_USERNAME/.ssh/id_ed25519",
  "jupyter_port": 8888,
  "auto_stop_on_idle": true,
  "idle_timeout_minutes": 30
}
```

### 설정 항목 설명

| 항목 | 설명 | 예시 값 |
|------|------|---------|
| `api_key` | RunPod API 키 | `"abcd1234..."` |
| `preferred_gpu` | 선호하는 GPU 모델 | `"NVIDIA RTX 4090"` |
| `max_hourly_cost` | 시간당 최대 비용 ($) | `2.0` |
| `cost_thresholds` | 경고 임계값 ($) | `[10, 50, 100]` |
| `ssh_key_path` | SSH 개인 키 경로 | `"C:/Users/.../id_ed25519"` |
| `jupyter_port` | Jupyter 포트 | `8888` |
| `auto_stop_on_idle` | 유휴 시 자동 종료 | `true` |
| `idle_timeout_minutes` | 유휴 타임아웃 (분) | `30` |

### 환경변수 설정 (선택)

Jupyter 토큰을 환경변수로 설정 (보안 강화):

```batch
REM 시스템 환경변수 설정
setx RUNPOD_JUPYTER_TOKEN "your_jupyter_token_here"
```

---

## 사용법

### 1. GPU 인스턴스 시작

```batch
REM 배치 파일 실행
START-RUNPOD-GPU.bat
```

**실행 과정**:
1. config.json 로드
2. RunPod API로 GPU 인스턴스 생성
3. 인스턴스 시작 대기 (30-60초)
4. SSH 터널 자동 연결
5. Jupyter 토큰 표시
6. 로그 저장: `runpod/logs/runpod-manager.log`

**출력 예시**:
```
[+] GPU 인스턴스 생성 중...
[*] 인스턴스 ID: abc123xyz
[*] GPU: NVIDIA RTX 4090
[*] 상태: RUNNING
[+] SSH 터널 연결 완료
[*] Jupyter Lab: http://localhost:8888
[*] 토큰: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 비용 모니터링 시작

```batch
REM 백그라운드로 비용 모니터링 시작
MONITOR-RUNPOD-COST.bat
```

**모니터링 기능**:
- 30초마다 비용 계산
- Jupyter 활동 감지 (유휴 경고)
- 임계값 초과 시 경고 ($10, $50, $100)
- 로그 저장: `runpod/logs/monitor.log`
- 비용 기록: `runpod/logs/cost-tracking.json`

**모니터링 종료**:
```batch
REM 방법 1: 모니터 창에서 Ctrl+C
REM 방법 2: 작업 관리자에서 종료
taskkill /FI "WINDOWTITLE eq *RunPod Cost Monitor*" /F
```

### 3. Jupyter에서 작업

#### 브라우저 접속
```
http://localhost:8888
```
- 토큰 입력 (START-RUNPOD-GPU.bat 출력 참조)
- Notebook 생성 또는 파일 업로드

#### PyTorch 예제
```python
import torch

# GPU 사용 가능 확인
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU count: {torch.cuda.device_count()}")
print(f"GPU name: {torch.cuda.get_device_name(0)}")

# 간단한 텐서 연산
x = torch.randn(1000, 1000).cuda()
y = torch.randn(1000, 1000).cuda()
z = torch.matmul(x, y)
print(f"Result shape: {z.shape}")
```

### 4. Claude Code에서 제어

Claude Code 프롬프트:
```
Jupyter 커널 목록을 보여줘
```

Claude가 자동으로 `runpod-jupyter` MCP 서버를 통해 커널 정보를 가져옵니다.

### 5. GPU 인스턴스 종료

```batch
REM 배치 파일 실행
STOP-RUNPOD-GPU.bat
```

**종료 과정**:
1. 실행 중인 인스턴스 검색
2. SSH 터널 종료
3. 인스턴스 중지 (STOP) 또는 삭제 (TERMINATE)
4. 비용 요약 출력
5. 로그 저장

**출력 예시**:
```
[*] 인스턴스 ID: abc123xyz
[*] 실행 시간: 1.5시간
[*] 예상 비용: $3.00
[!] 인스턴스를 종료하시겠습니까?
    1) STOP (일시 중지, 재시작 가능)
    2) TERMINATE (완전 삭제)
선택 (1/2): 2
[+] 인스턴스 삭제 완료
```

### 6. 비용 리포트 확인

```batch
REM Python 스크립트 직접 실행
K:/PortableApps/tools/python/python.exe runpod/scripts/monitor.py report
```

**리포트 예시**:
```
========================================
RunPod 비용 리포트
========================================

최근 5개 세션:
1. 2025-01-20 14:30:15
   - 실행 시간: 2.3시간
   - 비용: $4.60
   - GPU: NVIDIA RTX 4090

2. 2025-01-19 09:15:42
   - 실행 시간: 0.8시간
   - 비용: $1.60
   - GPU: NVIDIA RTX 3090

총 비용: $6.20
```

---

## 비용 관리

### 비용 최적화 팁

1. **유휴 시 즉시 종료**
   - config.json에서 `auto_stop_on_idle: true` 설정
   - 30분 유휴 시 자동 종료

2. **작업 완료 후 TERMINATE**
   - STOP: 인스턴스 유지 (재시작 빠름, 소량 과금)
   - TERMINATE: 완전 삭제 (과금 없음)

3. **적절한 GPU 선택**
   ```
   RTX 3090: $0.50-0.80/시간 (16GB VRAM)
   RTX 4090: $1.50-2.00/시간 (24GB VRAM)
   A100: $3.00-4.00/시간 (80GB VRAM)
   ```

4. **임계값 설정**
   - $10: 주의 (약 5-10시간)
   - $50: 경고 (약 25-50시간)
   - $100: 위험 (즉시 확인 필요)

5. **스팟 인스턴스 사용**
   - config.json에 `"instance_type": "SPOT"` 추가
   - 최대 70% 할인 (중단 위험 있음)

### 비용 추적 데이터

`runpod/logs/cost-tracking.json` 구조:
```json
[
  {
    "session_id": "20250120_143015",
    "start_time": "2025-01-20T14:30:15",
    "end_time": "2025-01-20T16:48:30",
    "duration_hours": 2.3,
    "cost": 4.6,
    "gpu_type": "NVIDIA RTX 4090",
    "hourly_rate": 2.0
  }
]
```

---

## 트러블슈팅

### 문제 1: SSH 연결 실패

**증상**:
```
[-] SSH 터널 연결 실패
```

**원인**:
- SSH 키가 RunPod에 등록되지 않음
- 방화벽이 SSH 포트 차단
- 인스턴스가 아직 준비되지 않음

**해결책**:
1. SSH 키 등록 확인:
   ```bash
   ssh -i ~/.ssh/id_ed25519 -p [PORT] root@[POD_IP] -L 8888:localhost:8888
   ```

2. 방화벽 확인:
   ```batch
   netsh advfirewall firewall show rule name=all | findstr SSH
   ```

3. 인스턴스 준비 대기:
   - START-RUNPOD-GPU.bat 재실행
   - RunPod 대시보드에서 상태 확인

### 문제 2: Jupyter 토큰 오류

**증상**:
```
403: Forbidden
Invalid credentials
```

**원인**:
- 잘못된 Jupyter 토큰
- 환경변수 미설정

**해결책**:
1. 토큰 확인:
   ```batch
   REM START-RUNPOD-GPU.bat 출력에서 토큰 복사
   ```

2. 환경변수 설정:
   ```batch
   setx RUNPOD_JUPYTER_TOKEN "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

3. Claude Code 재시작

### 문제 3: 인스턴스 시작 지연

**증상**:
```
[*] 인스턴스 시작 대기 중... (60초 이상)
```

**원인**:
- RunPod 서버 혼잡
- 선택한 GPU 재고 부족
- 계정 크레딧 부족

**해결책**:
1. 재고 확인:
   - RunPod 대시보드 → **GPU Instances**
   - 다른 GPU 선택 (config.json 수정)

2. 크레딧 확인:
   - **Billing** → **Credits**
   - 충전 필요 시 추가

3. 지역 변경:
   - config.json에 `"region": "EU"` 추가

### 문제 4: MCP 서버 연결 실패

**증상**:
```
runpod-jupyter: ✗ Not connected
```

**원인**:
- uvx 설치 안 됨
- jupyter-mcp-server 패키지 오류
- 환경변수 오류

**해결책**:
1. uvx 확인:
   ```batch
   K:/PortableApps/tools/uv/uvx.exe --version
   ```

2. 수동 테스트:
   ```batch
   K:/PortableApps/tools/uv/uvx.exe jupyter-mcp-server --help
   ```

3. .claude.json 확인:
   - 경로 정확성 검증
   - 환경변수 존재 확인

4. Claude Code 디버그 모드:
   ```batch
   claude --debug
   ```

### 문제 5: 비용 모니터링 시작 실패

**증상**:
```
[-] 모니터링 시작 실패
```

**원인**:
- monitor.py 파일 누락
- Python 경로 오류
- config.json 읽기 실패

**해결책**:
1. 파일 확인:
   ```batch
   dir K:\PortableApps\genai\runpod\scripts\monitor.py
   ```

2. Python 테스트:
   ```batch
   K:/PortableApps/tools/python/python.exe runpod/scripts/monitor.py --help
   ```

3. 로그 확인:
   ```batch
   type K:\PortableApps\genai\runpod\logs\monitor.log
   ```

### 로그 파일 위치

| 로그 파일 | 내용 | 경로 |
|----------|------|------|
| `runpod-manager.log` | 인스턴스 관리 | `runpod/logs/` |
| `monitor.log` | 비용 모니터링 | `runpod/logs/` |
| `cost-tracking.json` | 비용 기록 | `runpod/logs/` |

---

## FAQ

### Q1: RunPod 크레딧은 얼마나 충전해야 하나요?

**A**: 초보자는 $10-20 권장. RTX 4090 기준 5-10시간 사용 가능.

### Q2: 여러 인스턴스를 동시에 실행할 수 있나요?

**A**: 가능하지만 현재 스크립트는 단일 인스턴스만 지원. 여러 인스턴스 사용 시 config.json 별도 관리 필요.

### Q3: AWS/GCP 대신 RunPod를 선택한 이유는?

**A**:
- 저렴한 가격 (AWS 대비 50-70% 절감)
- 간단한 API (복잡한 IAM 없음)
- GPU 특화 (PyTorch/TensorFlow 최적화)
- 빠른 시작 (30초 이내)

### Q4: 인스턴스를 STOP 상태로 두면 과금되나요?

**A**: 예, STOP 상태에서도 스토리지 비용이 발생 ($0.01-0.05/시간). 작업 완료 후 TERMINATE 권장.

### Q5: Jupyter 노트북 파일은 어떻게 백업하나요?

**A**:
- 방법 1: Jupyter UI에서 다운로드
- 방법 2: SSH로 직접 접속하여 복사
  ```bash
  scp -P [PORT] root@[POD_IP]:/workspace/*.ipynb ./backups/
  ```
- 방법 3: Git 연동 (추천)

### Q6: Claude Code가 Jupyter 커널을 제어할 수 있나요?

**A**: 예, `runpod-jupyter` MCP 서버를 통해:
- 커널 목록 조회
- 코드 실행
- 변수 검사
- 노트북 파일 읽기/쓰기

### Q7: 스팟 인스턴스가 중단되면 데이터가 손실되나요?

**A**: 예, 스팟 인스턴스는 예고 없이 중단 가능. 중요 데이터는 반드시:
- Git 커밋
- 외부 스토리지 동기화
- 자동 백업 스크립트 사용

### Q8: 다른 Jupyter 이미지를 사용할 수 있나요?

**A**: 가능. config.json에 `"container_image"` 추가:
```json
{
  "container_image": "runpod/pytorch:2.1.0-py3.11-cuda12.1.1-devel-ubuntu22.04"
}
```

### Q9: 비용 모니터링을 자동으로 시작하려면?

**A**: START-RUNPOD-GPU.bat 마지막에 추가:
```batch
REM GPU 시작 후 모니터링 자동 실행
call MONITOR-RUNPOD-COST.bat
```

### Q10: Claude Code 없이 스크립트만 사용 가능한가요?

**A**: 가능. Python 스크립트는 독립 실행:
```batch
python runpod/scripts/manager.py create
python runpod/scripts/ssh-tunnel.py
python runpod/scripts/monitor.py monitor
```

---

## 추가 리소스

### 공식 문서
- [RunPod Documentation](https://docs.runpod.io/)
- [Jupyter MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/jupyter)
- [uv Documentation](https://docs.astral.sh/uv/)

### 커뮤니티
- [RunPod Discord](https://discord.gg/runpod)
- [MCP Discord](https://discord.gg/modelcontextprotocol)

### 관련 가이드
- `documentation/guides/@mcp-guide.md` - MCP 설치 가이드
- `CLAUDE.md` - Claude Code 전체 설정

---

## 라이선스 및 주의사항

### 라이선스
이 통합 시스템은 K드라이브 Claude Code 프로젝트의 일부입니다.

### 주의사항
1. **비용 관리**: GPU 인스턴스는 시간당 과금. 반드시 사용 후 종료.
2. **보안**: API 키와 SSH 키를 절대 공유하지 마세요.
3. **데이터 백업**: 스팟 인스턴스 사용 시 데이터 손실 위험.
4. **컴플라이언스**: RunPod 서비스 약관 준수.

---

## 프로젝트 개발 이력

### 프로젝트 메타데이터

- **프로젝트 코드명**: RunPod-Jupyter-MCP-Integration
- **개발 기간**: 2025-01-20 (1일 완성)
- **총 태스크**: 10개
- **총 코드 라인**: 902줄
- **개발 방법론**: Shrimp Task Manager (MCP 기반 자동화)

### 개발 타임라인

```
21:07 - 프로젝트 시작 (Task 1-10 생성)
21:16 - Task 1 완료: uv 포터블 설치
21:22 - Task 2 완료: 디렉토리 구조 생성
21:25 - Task 3 완료: manager.py (RunPod API)
21:26 - Task 4 완료: ssh-tunnel.py (SSH 터널)
21:27 - Task 5 완료: START-RUNPOD-GPU.bat
21:28 - Task 6 완료: STOP-RUNPOD-GPU.bat
21:32 - Task 7 완료: monitor.py (비용 추적)
21:34 - Task 8 완료: MONITOR-RUNPOD-COST.bat
21:39 - Task 9 완료: .claude.json MCP 추가
21:41 - Task 10 완료: 통합 가이드 문서 (본 문서)
```

### 완료된 태스크 상세

#### Task 1: uv 패키지 매니저 K드라이브 설치
- **Task ID**: `db8a3141-3c56-4438-8be7-f418e10452bd`
- **완료 시간**: 2025-01-20 21:16
- **산출물**: K:/PortableApps/tools/uv/uvx.exe
- **검증**: `uvx --version` → v0.9.8
- **목적**: jupyter-mcp-server 실행을 위한 포터블 환경

#### Task 2: RunPod 디렉토리 구조 및 config.json 생성
- **Task ID**: `3a235205-ac05-4caf-afcf-ecec0055ad6a`
- **완료 시간**: 2025-01-20 21:22
- **산출물**: 
  - `runpod/` (메인 디렉토리)
  - `runpod/scripts/` (Python 스크립트)
  - `runpod/logs/` (로그 파일)
  - `runpod/config.json` (설정 템플릿)
- **의존성**: 없음

#### Task 3: RunPod Manager Python 스크립트 작성
- **Task ID**: `40852e77-6dbf-4738-96ba-d94232588df1`
- **완료 시간**: 2025-01-20 21:25
- **산출물**: `runpod/scripts/manager.py` (171줄)
- **주요 기능**:
  - RunPodManager 클래스
  - create_instance(): GPU 인스턴스 생성
  - stop_instance(): 인스턴스 중지
  - terminate_instance(): 완전 삭제
  - get_instance_status(): 상태 조회
- **의존성**: Task 2
- **사용 라이브러리**: runpod-python SDK

#### Task 4: SSH 터널 자동화 스크립트 작성
- **Task ID**: `c0cd371d-25c7-401e-8d5c-918f6093a7fa`
- **완료 시간**: 2025-01-20 21:26
- **산출물**: `runpod/scripts/ssh-tunnel.py`
- **주요 기능**:
  - subprocess를 통한 SSH 터널 생성
  - `ssh -L 8888:localhost:8888` 자동 실행
  - 30초 간격 연결 상태 모니터링
  - 끊김 감지 시 자동 재연결
- **의존성**: Task 3
- **보안**: SSH 키 기반 인증

#### Task 5: START-RUNPOD-GPU.bat 배치 스크립트 작성
- **Task ID**: `576f817a-6fd0-4e43-b381-acd7163982e9`
- **완료 시간**: 2025-01-20 21:27
- **산출물**: `START-RUNPOD-GPU.bat`
- **자동화 단계**:
  1. config.json 로드
  2. manager.py start 실행 (인스턴스 생성)
  3. 최대 5분 부팅 대기
  4. Pod IP 입력 프롬프트
  5. ssh-tunnel.py 자동 실행
  6. Jupyter 토큰 표시
- **의존성**: Task 3, Task 4
- **명명 규칙**: 기존 K드라이브 START-*.bat 패턴 준수

#### Task 6: STOP-RUNPOD-GPU.bat 배치 스크립트 작성
- **Task ID**: `4015586c-1138-441d-bd83-2a0ea501ab80`
- **완료 시간**: 2025-01-20 21:28
- **산출물**: `STOP-RUNPOD-GPU.bat`
- **종료 절차**:
  1. taskkill로 SSH 터널 프로세스 종료
  2. manager.py stop 실행
  3. monitor.py report로 총 비용 출력
- **의존성**: Task 5
- **안전 장치**: 종료 전 확인 프롬프트

#### Task 7: Cost Tracking Monitor 스크립트 작성
- **Task ID**: `d768dc68-364f-4bf3-8e28-5dcd015477bf`
- **완료 시간**: 2025-01-20 21:32
- **산출물**: `runpod/scripts/monitor.py` (171줄)
- **주요 클래스**: CostMonitor
- **주요 메서드**:
  - `track_cost()`: 실시간 비용 계산
  - `detect_idle()`: Jupyter API로 유휴 감지 (30분 임계값)
  - `check_thresholds()`: $10/$50/$100 경고
  - `save_log()`: cost-tracking.json 저장
  - `report()`: 비용 리포트 생성
  - `monitor_loop()`: 30초 간격 모니터링
- **의존성**: Task 3
- **데이터 구조**: JSON 기반 세션 추적

#### Task 8: MONITOR-RUNPOD-COST.bat 배치 스크립트 작성
- **Task ID**: `5617bd30-9ddb-40cc-a22c-636370ec2b73`
- **완료 시간**: 2025-01-20 21:34
- **산출물**: `MONITOR-RUNPOD-COST.bat` (66줄)
- **기능**:
  - UTF-8 인코딩 설정 (`chcp 65001`)
  - K드라이브 절대 경로 사용
  - `start /MIN`으로 백그라운드 실행
  - tasklist로 프로세스 확인
  - 로그 위치 안내
  - 종료 방법 가이드
- **의존성**: Task 7
- **사용자 편의**: 초보자 친화적 출력 메시지

#### Task 9: .claude.json에 runpod-jupyter MCP 서버 추가
- **Task ID**: `3add9173-36bf-49b2-b70b-b3c8c8d39e55`
- **완료 시간**: 2025-01-20 21:39
- **수정 파일**: `.claude.json`
- **추가 내용**: 19번째 MCP 서버 설정
  ```json
  "runpod-jupyter": {
    "type": "stdio",
    "command": "cmd",
    "args": ["/c", "K:/PortableApps/tools/uv/uvx.exe", "jupyter-mcp-server@latest"],
    "env": {
      "JUPYTER_URL": "http://localhost:8888",
      "JUPYTER_TOKEN": "${RUNPOD_JUPYTER_TOKEN}",
      "ALLOW_IMG_OUTPUT": "true"
    }
  }
  ```
- **백업**: `backups/mcp-configs/.claude.json.backup-runpod-jupyter`
- **검증**: `claude mcp list` → ✓ Connected
- **의존성**: Task 1, Task 5

#### Task 10: RunPod 통합 가이드 문서 작성
- **Task ID**: `07aa1e7f-7c2b-4161-85c3-5781245252de`
- **완료 시간**: 2025-01-20 21:41
- **산출물**: `documentation/guides/runpod-integration.md` (665줄, 15.2KB)
- **섹션 구성**:
  1. 개요 및 아키텍처
  2. 사전 요구사항
  3. RunPod 계정 설정
  4. 설치 가이드
  5. config.json 설정
  6. 사용법 (예제 포함)
  7. 비용 관리
  8. 트러블슈팅 (5개 문제)
  9. FAQ (10개 질문)
- **특징**:
  - 초보자 친화적 단계별 설명
  - 실행 가능한 코드 블록
  - ASCII 아키텍처 다이어그램
  - PyTorch GPU 예제 코드
  - 공식 문서 링크
- **의존성**: Task 5, 6, 7, 8, 9

### 작업 재개 가이드

#### 이 프로젝트를 다시 작업하려면

1. **태스크 목록 확인**:
   ```
   Shrimp Task Manager를 통해 관리됨
   위치: K:/PortableApps/genai/ShrimpData/current-tasks.json
   ```

2. **현재 상태 조회**:
   ```
   shrimp-task list_tasks --status all
   ```

3. **특정 태스크 상세 조회**:
   ```
   shrimp-task get_task_detail --taskId [위의 Task ID 사용]
   ```

4. **새 태스크 추가**:
   ```
   shrimp-task plan_task
   → analyze_task
   → reflect_task
   → split_tasks
   ```

5. **작업 실행**:
   ```
   shrimp-task execute_task --taskId [ID]
   → verify_task --taskId [ID]
   ```

#### 추가 개발 아이디어

**Phase 2 (향후 확장)**:
- [ ] 자동 스냅샷 백업 (15분마다 Jupyter 노트북 저장)
- [ ] 다중 인스턴스 관리 (여러 GPU 동시 실행)
- [ ] 비용 대시보드 (웹 UI로 실시간 차트)
- [ ] Telegram 알림 (비용 경고, 유휴 감지)
- [ ] 스팟 인스턴스 자동 전환 (가격 최적화)
- [ ] Git 자동 커밋 (작업 결과물 버전 관리)

**Phase 3 (고급 기능)**:
- [ ] 멀티 클라우드 통합 (AWS/GCP/Azure)
- [ ] ML 모델 자동 배포 파이프라인
- [ ] 분산 훈련 자동 설정
- [ ] Weights & Biases 통합
- [ ] 하이퍼파라미터 튜닝 자동화

### 프로젝트 구조 맵

```
K:/PortableApps/genai/
│
├── runpod/                          # [Task 2] 메인 디렉토리
│   ├── config.json                  # [Task 2] 설정 파일
│   ├── config.example.json          # [Task 2] 템플릿
│   ├── scripts/
│   │   ├── manager.py               # [Task 3] RunPod API (171줄)
│   │   ├── ssh-tunnel.py            # [Task 4] SSH 터널
│   │   └── monitor.py               # [Task 7] 비용 추적 (171줄)
│   └── logs/
│       ├── runpod-manager.log       # 인스턴스 관리 로그
│       ├── monitor.log              # 비용 모니터링 로그
│       └── cost-tracking.json       # 비용 기록 데이터
│
├── START-RUNPOD-GPU.bat             # [Task 5] 인스턴스 시작
├── STOP-RUNPOD-GPU.bat              # [Task 6] 인스턴스 종료
├── MONITOR-RUNPOD-COST.bat          # [Task 8] 비용 모니터링 (66줄)
│
├── .claude.json                     # [Task 9] MCP 서버 설정 (수정됨)
│   └── mcpServers.runpod-jupyter    # 19번째 서버
│
├── documentation/guides/
│   └── runpod-integration.md        # [Task 10] 본 문서 (665줄)
│
├── tools/uv/                        # [Task 1] uv 포터블 설치
│   └── uvx.exe                      # uvx 실행 파일
│
└── backups/mcp-configs/
    └── .claude.json.backup-runpod-jupyter  # 자동 백업

총 파일: 13개
총 코드: 902줄
총 문서: 665줄
```

### 기술 스택 요약

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **클라우드** | RunPod | GPU 인스턴스 제공 |
| **Python SDK** | runpod-python | RunPod API 제어 |
| **패키지 관리** | uv/uvx | jupyter-mcp-server 실행 |
| **프로토콜** | MCP (stdio) | Claude Code 통합 |
| **터널링** | SSH (-L) | 포트 포워딩 |
| **개발 환경** | Jupyter Lab | 노트북 인터페이스 |
| **ML 프레임워크** | PyTorch/TensorFlow | GPU 가속 연산 |
| **자동화** | Windows Batch | 원클릭 시작/종료 |
| **모니터링** | Python (requests) | Jupyter API 감시 |
| **데이터 저장** | JSON | 비용 기록 |
| **태스크 관리** | Shrimp MCP | 작업 추적 |

### 주요 의사결정 기록

1. **왜 RunPod인가?**
   - AWS/GCP 대비 50-70% 저렴
   - GPU 특화 (PyTorch 최적화)
   - 간단한 API (복잡한 IAM 없음)
   - 빠른 부팅 (30초 이내)

2. **왜 SSH 터널인가?**
   - 보안: 암호화된 연결
   - 호환성: 기존 Jupyter 도구 그대로 사용
   - 안정성: 자동 재연결

3. **왜 MCP 통합인가?**
   - Claude Code에서 직접 제어
   - 자연어로 GPU 인스턴스 관리
   - 기존 18개 서버와 통합

4. **왜 포터블 환경인가?**
   - K드라이브 철학: Zero C-Drive Dependency
   - 이동성: 다른 PC에서도 동일 환경
   - 독립성: 시스템 설정 불필요

### 성능 메트릭

- **인스턴스 시작 시간**: 30-60초
- **SSH 터널 연결**: 2-3초
- **비용 모니터링 간격**: 30초
- **유휴 감지 임계값**: 30분
- **비용 경고 레벨**: $10, $50, $100

### 라이선스 및 크레딧

- **프로젝트**: K드라이브 Claude Code
- **MCP 프로토콜**: Anthropic
- **RunPod API**: RunPod Inc.
- **Jupyter MCP Server**: Model Context Protocol Community
- **uv**: Astral

---

**최종 업데이트**: 2025-01-20  
**버전**: 1.0.0  
**작성자**: Claude Code K-Drive Project  
**태스크 관리**: Shrimp Task Manager (MCP)
