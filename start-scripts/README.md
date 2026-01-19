# Start Scripts - 배치 파일 정리 구조

> 정리일: 2025-12-19
> 총 49개 파일을 6개 카테고리로 분류

## 폴더 구조

```
start-scripts/
├── ai-stack/      # AI/Ollama 관련 (12개)
├── services/      # 서비스 관리 (6개)
├── utils/         # 유틸리티 (20개)
├── install/       # 설치 스크립트 (4개)
├── runpod/        # RunPod GPU (3개)
└── startup/       # 시스템 시작 (4개)
```

---

## ai-stack/ (12 files)
AI 스택 및 Ollama 관련 스크립트

| 파일 | 용도 |
|------|------|
| ollama-download-models.bat | Ollama 모델 다운로드 |
| ollama-setup-env.bat | Ollama 환경 설정 |
| ollama-verify.bat | Ollama 설치 검증 |
| QUICK-START-OLLAMA.bat | Ollama 빠른 시작 |
| RESTART-OLLAMA-IP.bat | Ollama IP 재시작 |
| START-AI-STACK.bat | AI 스택 시작 |
| START-AI-STACK-IP.bat | AI 스택 IP 모드 |
| START-AI-STACK-SMART.bat | AI 스택 스마트 모드 |
| start-flowise.bat | Flowise 시작 |
| start-n8n.bat | n8n 시작 |
| start-ollama.bat | Ollama 시작 |
| start-qdrant.bat | Qdrant 시작 |

---

## services/ (6 files)
백그라운드 서비스 관리

| 파일 | 용도 |
|------|------|
| SUPABASE-KEEP-ALIVE.bat | Supabase 연결 유지 |
| START-DOCKER-MCP.bat | Docker MCP 시작 |
| START-PODMAN.bat | Podman 시작 |
| START-AUTO-BACKUP.bat | 자동 백업 시작 |
| START-DC-BACKUP.bat | DC 백업 시작 |
| INSTALL-SUPABASE-SCHEDULER.bat | Supabase 스케줄러 등록 |

---

## utils/ (20 files)
유틸리티 및 도구

| 파일 | 용도 |
|------|------|
| BACKUP-MANAGER.bat | 백업 관리 |
| claude-clean.bat | Claude 정리 |
| dashboard.bat | 대시보드 실행 |
| del-korean.bat | 한글 파일 삭제 |
| fix-mcp-servers.bat | MCP 서버 수정 |
| FIX-SHRIMP-LANGUAGE.bat | Shrimp 언어 수정 |
| fix-terminal-freeze.bat | 터미널 멈춤 수정 |
| kill-all-node-processes.bat | Node 프로세스 종료 |
| launch-browser-test.bat | 브라우저 테스트 |
| launch-superclaude.bat | SuperClaude 실행 |
| monitor-node-processes.bat | Node 프로세스 모니터링 |
| PROTECT-CONFIG.bat | 설정 보호 |
| RESTORE-CONFIG.bat | 설정 복원 |
| set-api-keys.bat | API 키 설정 |
| SET-MINIMAL-OUTPUT.bat | 최소 출력 설정 |
| start-server-debug.bat | 서버 디버그 |
| take-screenshot.bat | 스크린샷 |
| test-vmware-direct.bat | VMware 테스트 |
| UPDATE-CLAUDE.bat | Claude 업데이트 |
| VERIFY-KIRO-MEMORY.bat | Kiro 메모리 검증 |

---

## install/ (4 files)
설치 스크립트

| 파일 | 용도 |
|------|------|
| install-a2a-systems.bat | A2A 시스템 설치 |
| install-all-components.bat | 전체 컴포넌트 설치 |
| install-all-templates.bat | 템플릿 설치 |
| install-commands.bat | 명령어 설치 |

---

## runpod/ (3 files)
RunPod GPU 관리

| 파일 | 용도 |
|------|------|
| START-RUNPOD-GPU.bat | RunPod GPU 시작 |
| STOP-RUNPOD-GPU.bat | RunPod GPU 중지 |
| MONITOR-RUNPOD-COST.bat | RunPod 비용 모니터링 |

---

## startup/ (4 files)
시스템 자동 시작

| 파일 | 용도 |
|------|------|
| AUTO-STARTUP.bat | 전체 자동 시작 |
| INSTALL-AUTO-STARTUP.bat | 스케줄러 등록 |
| START-ANOMALY-DETECTOR.bat | 이상 감지 시작 |
| START-EVOLUTION.bat | 자가발전 시스템 시작 |

---

## 루트 폴더에 남은 파일
- `claude.bat` - 메인 진입점 (이동하지 않음)
