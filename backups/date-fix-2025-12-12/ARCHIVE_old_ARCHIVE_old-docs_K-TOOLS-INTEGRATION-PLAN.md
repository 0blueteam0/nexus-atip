# 🚀 K드라이브 도구 통합 실행 계획

## 📋 현재 상태 (2025-01-20)
- **위치**: K:\PortableApps\genai (유지)
- **SSD**: 1TB (800GB+ 가용)
- **목표**: K:\tools로 모든 개발 도구 통합

## 🎯 최종 구조
```
K:\
├── tools\                    # 🔧 모든 개발 도구 (새로 생성)
│   ├── nodejs\              # Node.js 18.x
│   ├── python\              # Python 3.11+
│   ├── git\                 # Git + Bash
│   ├── java\                # JDK 17+
│   ├── android\             # Android SDK/Studio
│   ├── docker\              # Docker/Podman Desktop
│   └── llm\                 # Ollama 등 로컬 LLM
│
├── cache\                   # 💾 전역 캐시 (새로 생성)
│   ├── npm\                 # NPM 캐시
│   ├── pip\                 # Python 패키지 캐시
│   ├── gradle\              # Gradle 캐시
│   └── docker\              # Docker 이미지 캐시
│
├── PortableApps\            # 📦 기존 구조 유지
│   └── Claude-Code\         # ✅ 현재 프로젝트 위치 유지
│       ├── node_modules\    
│       ├── mcp-servers\     
│       └── ...              
│
├── workspace\               # 🏗️ 추가 프로젝트 (선택사항)
└── backup\                  # 💿 백업 (선택사항)
```

## 🔄 마이그레이션 단계

### Phase 1: 준비 (즉시)
```batch
# 1. 디렉토리 생성
mkdir K:\tools
mkdir K:\cache
mkdir K:\cache\npm
mkdir K:\cache\pip

# 2. 백업 (안전)
xcopy K:\PortableApps\genai\tools K:\backup\tools-backup /E /I
```

### Phase 2: 도구 이동
```batch
# Node.js 이동
move K:\PortableApps\genai\tools\nodejs K:\tools\nodejs
move K:\PortableApps\tools\nodejs K:\tools\nodejs  # 다른 위치에 있다면

# Python 이동
move K:\PortableApps\genai\tools\python-portable K:\tools\python
move K:\PortableApps\tools\python K:\tools\python

# Git 이동
move K:\PortableApps\genai\tools\git K:\tools\git
move K:\PortableApps\tools\git K:\tools\git
```

### Phase 3: 환경변수 업데이트
```batch
# claude.bat 수정
set NODE_PATH=K:\tools\nodejs
set PYTHON_PATH=K:\tools\python
set GIT_PATH=K:\tools\git
set PATH=%NODE_PATH%;%PYTHON_PATH%;%GIT_PATH%\bin;%PATH%

# 캐시 경로
set NPM_CONFIG_CACHE=K:\cache\npm
set PIP_CACHE_DIR=K:\cache\pip
```

### Phase 4: MCP 설정 업데이트
.claude.json의 모든 경로를 K:\tools로 변경:
- "K:/PortableApps/tools/nodejs/node.exe" → "K:/tools/nodejs/node.exe"
- "K:/PortableApps/genai/tools/" → "K:/tools/"

### Phase 5: 검증
```batch
# 도구 확인
K:\tools\nodejs\node.exe --version
K:\tools\python\python.exe --version
K:\tools\git\bin\git.exe --version

# Claude 실행 테스트
K:\PortableApps\genai\claude.bat --version
```

## ⚠️ 주의사항
1. **백업 필수**: 이동 전 반드시 백업
2. **경로 일관성**: 모든 스크립트의 경로 업데이트
3. **권한 확인**: 새 디렉토리에 실행 권한
4. **심볼릭 링크**: 하위 호환성 필요시 생성

## 🎉 예상 효과
- ✅ 경로 단순화: K:\tools로 통일
- ✅ 중복 제거: 단일 도구 설치
- ✅ 공간 절약: 30-40% 예상
- ✅ 관리 용이: 중앙 집중식
- ✅ 멀티 디바이스: 일관된 경로

## 📝 체크리스트
- [ ] K:\tools 디렉토리 생성
- [ ] 백업 실행
- [ ] Node.js 이동
- [ ] Python 이동
- [ ] Git 이동
- [ ] claude.bat 수정
- [ ] .claude.json 수정
- [ ] 테스트 실행
- [ ] 구 디렉토리 삭제

## 🚦 실행 명령
```batch
# 통합 실행 스크립트
K:\PortableApps\genai\EXECUTE-TOOLS-INTEGRATION.bat
```

---
준비되면 실행하겠습니다!