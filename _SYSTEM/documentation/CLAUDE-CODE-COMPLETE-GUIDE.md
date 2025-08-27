# Claude Code Windows Native 완전 가이드
> K드라이브 포터블 환경 자가 점검 및 설치/설정/MCP 연동 통합 문서

⚠️ **중요**: Claude가 작업 시작 시 이 문서를 먼저 읽고 자가 점검해야 합니다.

---

## 📚 목차
1. [Claude Code 포터블 환경 구성](#claude-code-포터블-환경-구성)
2. [WSL과 K드라이브 환경 공존](#wsl과-k드라이브-환경-공존)
3. [MCP 자동 설치 가이드](#mcp-model-context-protocol-자동-설치-가이드)
4. [설정 파일 세팅 가이드](#설정-파일-세팅-가이드)
5. [필수 검증 절차](#필수-검증-절차-critical)
6. [MCP 서버 제거 방법](#mcp-서버-제거-방법)
7. [Claude Desktop MCP 가져오기](#claude-desktop-mcp-가져오기)
8. [JSON 설정 파일 직접 설정](#json-설정-파일-직접-설정-가이드)
9. [Args 배열 설계 체크리스트](#args-배열-설계-체크리스트)
10. [문제 해결 가이드](#문제-해결-가이드)

---

## Claude Code 포터블 환경 구성

### 🚀 K드라이브 포터블 Claude Code 설치 및 설정

#### 1단계: Git 포터블 버전 (이미 설치됨)
- **위치**: `K:\PortableApps\tools\git`
- **Git Bash**: `K:\PortableApps\tools\git\bin\bash.exe`
- **특징**: C드라이브 의존성 없음, USB에서 직접 실행

#### 2단계: Node.js 포터블 버전 (이미 설치됨)
- **위치**: `K:\PortableApps\tools\nodejs`
- **Node.exe**: `K:\PortableApps\tools\nodejs\node.exe`
- **NPM**: `K:\PortableApps\tools\nodejs\npm.cmd`
- **버전**: 18+ LTS (포터블 버전)
- **참고**: K드라이브 포터블 버전은 PATH를 claude.bat에서 수동 설정

#### 3단계: Claude Code 설치 (K드라이브 전용)
```batch
# K드라이브 Claude Code 디렉토리로 이동
cd /d K:\PortableApps\Claude-Code

# 로컬 설치 (글로벌 설치 대신)
K:\PortableApps\tools\nodejs\npm.cmd install @anthropic-ai/claude-code@latest

# 또는 이미 설치된 경우 업데이트
K:\PortableApps\tools\nodejs\npm.cmd update @anthropic-ai/claude-code
```

#### 4단계: 환경 변수 설정 (K드라이브 전용)
```batch
# claude.bat 파일에 이미 설정됨
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\git\bin;%PATH%
set NODE_PATH=K:\PortableApps\tools\nodejs
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set CLAUDE_CONFIG_FILE=K:\PortableApps\Claude-Code\.claude.json
```

### ✨ 포터블 환경의 장점
1. C드라이브 의존성 완전 제거
2. USB에서 직접 실행 가능
3. 다른 PC에서도 동일한 환경 유지
4. 백업 및 이동 용이

---

## WSL과 K드라이브 환경 공존

### ✅ WSL이 필요한 경우 (다른 작업용)
- WSL은 유지하되, Claude Code는 K드라이브 Git Bash 사용
- `run-claude.bat` 실행으로 Claude 전용 환경 시작
- WSL과 충돌 없이 독립적 작동

### ❌ WSL이 불필요한 경우 (리소스 확보)

#### WSL 완전 제거 방법

1. **WSL 제거 명령**
```powershell
# PowerShell에서 실행
wsl --uninstall
```

2. **WSL 가상 디스크 삭제**
```powershell
# WSL 배포판 경로 확인
Get-ChildItem HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Lxss |
  ForEach-Object {
      $p = Get-ItemProperty $_.PsPath
      [PSCustomObject]@{
          Name     = $p.DistributionName
          BasePath = $p.BasePath
      }
  }
```

3. **디스크 공간 회수**
   - 파일 탐색기에서 표시된 BasePath 접근
   - `ext4.vhdx` 파일 찾아서 삭제
   - 디스크 공간 회수 완료

### 🎯 K드라이브 환경의 이점
- WSL 없이도 Git Bash로 Linux 명령 사용 가능
- 시스템 리소스 절약 (메모리, 디스크)
- 포터블 환경으로 완전 독립 운영

---

## MCP (Model Context Protocol) 자동 설치 가이드

### 🔍 설치 전 필수 확인 사항

#### 1. 환경 확인 (K드라이브 포터블)
- **OS**: Windows (Native)
- **환경**: `K:\PortableApps\Claude-Code`
- **Node.js**: `K:\PortableApps\tools\nodejs\node.exe`
- **NPM**: `K:\PortableApps\tools\nodejs\npm.cmd`
- **Git Bash**: `K:\PortableApps\tools\git\bin\bash.exe`

#### 2. mcp-installer 설치 (K드라이브 로컬)
```batch
# K드라이브 Claude-Code 디렉토리에서 실행
cd /d K:\PortableApps\Claude-Code
K:\PortableApps\tools\nodejs\npm.cmd install @anaisbetts/mcp-installer
```

### 📦 MCP 설치 프로세스 (K드라이브 전용)

#### 단계 1: WebSearch로 공식 사이트 확인
```
# 예시: filesystem MCP 설치 전
- WebSearch로 "@modelcontextprotocol/server-filesystem github" 검색
- 공식 설치 방법 및 요구사항 확인
- Windows 호환성 체크
```

#### 단계 2: Context7 MCP로 재확인 (설치되어 있는 경우)
```
# context7으로 최신 문서 확인
- resolve-library-id로 패키지 확인
- get-library-docs로 설치 가이드 확인
```

#### 단계 3: K드라이브 로컬 설치 (user 스코프)
```batch
# mcp-installer 사용 (K드라이브 경로)
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\.bin\mcp-installer install [MCP이름] --user

# 또는 직접 npm 설치 (권장)
K:\PortableApps\tools\nodejs\npm.cmd install [MCP패키지명]
```

### 📋 주요 MCP 서버 설치 예시

#### 1. Filesystem MCP
```batch
# WebSearch로 공식 문서 확인 후
K:\PortableApps\tools\nodejs\npm.cmd install @modelcontextprotocol/server-filesystem
```

#### 2. GitHub MCP
```batch
# API 키 필요 - 먼저 GitHub token 생성
K:\PortableApps\tools\nodejs\npm.cmd install @modelcontextprotocol/server-github
```

#### 3. Shrimp Task Manager (이미 설치됨)
```batch
# K드라이브에 이미 설치 및 설정 완료
# 경로: K:\PortableApps\Claude-Code\mcp-servers\mcp-shrimp-task-manager
```

### ⚠️ K드라이브 환경 특별 주의사항

1. **경로 문제 해결**
   - 모든 설치는 `K:\PortableApps\Claude-Code` 내부에
   - 절대 C드라이브에 설치하지 않음
   - node_modules는 K드라이브에만 생성

2. **설정 파일 위치**
   - MCP 설정: `K:\PortableApps\Claude-Code\mcp-config.json`
   - 환경 변수: `K:\PortableApps\Claude-Code\claude.bat`에 통합
   - API 키: `K:\PortableApps\Claude-Code\.env` (gitignore 필수)

3. **Python 기반 MCP 처리**
```batch
# Python 포터블 사용
K:\PortableApps\tools\python\python.exe -m pip install [패키지]

# 가상환경은 K드라이브에 생성
K:\PortableApps\tools\python\python.exe -m venv K:\PortableApps\Claude-Code\venv
```

---

## 설정 파일 세팅 가이드

### 📝 K드라이브 환경 설정 파일 세팅 예시

#### YouTube MCP 설치 예시 (K드라이브 버전)
```batch
# K드라이브 Claude Code 디렉토리에서 실행
cd /d K:\PortableApps\Claude-Code

# claude.bat를 통한 MCP 추가 (K드라이브 경로)
K:\PortableApps\Claude-Code\claude.bat mcp add --scope user youtube-mcp ^
  -e YOUTUBE_API_KEY=YOUR_YT_API_KEY ^
  -e YOUTUBE_TRANSCRIPT_LANG=ko ^
  -- K:\PortableApps\tools\nodejs\npx.cmd -y youtube-data-mcp-server
```

### ⚠️ Windows K드라이브 환경 주의사항

#### 1. 경로 구분자 처리
```json
{
  "mcpServers": {
    "youtube-mcp": {
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": [
        "K:\\PortableApps\\Claude-Code\\node_modules\\youtube-data-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```
⚠️ JSON 내에서는 백슬래시를 이중으로 (`\\`) 이스케이프 처리

#### 2. K드라이브 포터블 Node.js 확인
```batch
# Node.js 버전 확인 (v18 이상 필수)
K:\PortableApps\tools\nodejs\node.exe --version

# NPX 사용 시 K드라이브 경로 명시
K:\PortableApps\tools\nodejs\npx.cmd -y [패키지명]
```

---

## 필수 검증 절차 (CRITICAL)

### 🔢 단계별 검증 프로세스

#### 1단계: 설치 목록 확인
```batch
# K드라이브 포터블 환경
K:\PortableApps\Claude-Code\claude.bat mcp list
```
✅ **확인 사항**: 설치한 MCP가 목록에 표시되어야 함

#### 2단계: 디버그 모드로 서브 에이전트 구동
```batch
# K드라이브 포터블 환경
K:\PortableApps\Claude-Code\claude.bat --debug
```
🕰️ **최대 2분 동안 관찰**
- Task 도구를 통해 서브 에이전트 시작
- 디버그 메시지 모니터링
- 에러 발생 시 관련 내용 캡처

#### 3단계: /mcp를 통한 실제 작동 확인 (필수)
```batch
# K드라이브 포터블 환경
echo "/mcp" | K:\PortableApps\Claude-Code\claude.bat --debug
```
🎯 **최종 검증**: MCP 서버가 정상 응답하는지 확인

### 📈 검증 결과 해석

| 단계 | 성공 지표 | 실패 지표 | 조치 방법 |
|------|-----------|-----------|-----------|
| 1. MCP List | MCP 이름 표시 | "No MCP servers" | 재설치 필요 |
| 2. Debug Mode | 에러 없음 | Error/Warning 메시지 | 로그 분석 필요 |
| 3. /mcp Test | 서버 응답 정상 | Connection refused | 설정 확인 필요 |

### 👑 검증 완료 체크리스트

- ☑️ `mcp list`에 MCP 표시 확인
- ☑️ 2분간 디버그 메시지 관찰
- ☑️ `/mcp` 명령으로 실제 작동 확인
- ☑️ 에러 없이 정상 작동

⚠️ **주의**: 이 검증 절차를 거치지 않으면 MCP가 제대로 작동하지 않을 수 있습니다!

---

## MCP 서버 제거 방법

### 🗑️ 기본 제거 명령어

**K드라이브 포터블 환경:**
```batch
K:\PortableApps\Claude-Code\claude.bat mcp remove [MCP이름]
```

### 제거 예시 (다양한 MCP)

```batch
# YouTube MCP 제거
K:\PortableApps\Claude-Code\claude.bat mcp remove youtube-mcp

# Filesystem MCP 제거
K:\PortableApps\Claude-Code\claude.bat mcp remove filesystem

# GitHub MCP 제거
K:\PortableApps\Claude-Code\claude.bat mcp remove github

# 모든 MCP 목록 확인 후 선택적 제거
K:\PortableApps\Claude-Code\claude.bat mcp list
K:\PortableApps\Claude-Code\claude.bat mcp remove [MCP이름]
```

### 제거 후 확인
```batch
# 제거 확인
K:\PortableApps\Claude-Code\claude.bat mcp list
# → 제거된 MCP가 목록에서 사라져야 함
```

---

## Claude Desktop MCP 가져오기

### 1️⃣ Claude Desktop 설치 확인

**Claude Desktop 설정 파일 위치:**
```
C:\Users\<사용자이름>\AppData\Roaming\Claude\claude_desktop_config.json
```

### 2️⃣ MCP 설정 복사 방법

#### K드라이브 포터블 환경

1. **소스 파일 (Claude Desktop - 있는 경우):**
   ```
   C:\Users\<사용자이름>\AppData\Roaming\Claude\claude_desktop_config.json
   ```

2. **대상 파일 (K드라이브 Claude Code):**
   ```
   K:\PortableApps\Claude-Code\mcp-config.json
   ```

3. **복사 절차:**
```batch
# 1. Claude Desktop 설정 백업
copy "C:\Users\%USERNAME%\AppData\Roaming\Claude\claude_desktop_config.json" ^
     "K:\PortableApps\Claude-Code\backup-desktop-config.json"

# 2. 메모장으로 편집
notepad "K:\PortableApps\Claude-Code\backup-desktop-config.json"
notepad "K:\PortableApps\Claude-Code\mcp-config.json"

# 3. mcpServers 내용 수동 복사
```

### 3️⃣ 경로 수정 (K드라이브 환경)

**원본 (C드라이브):**
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"]
}
```

**수정 (K드라이브):**
```json
{
  "command": "K:\\PortableApps\\tools\\nodejs\\npx.cmd",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"]
}
```

### 4️⃣ 가져온 후 검증 (필수)

```batch
# 1. MCP 목록 확인
K:\PortableApps\Claude-Code\claude.bat mcp list

# 2. 디버그 모드로 테스트
K:\PortableApps\Claude-Code\claude.bat --debug

# 3. 실제 작동 테스트
echo "/mcp" | K:\PortableApps\Claude-Code\claude.bat --debug
```

---

## JSON 설정 파일 직접 설정 가이드

### 📁 K드라이브 포터블 환경 설정 파일 위치

- **메인 설정**: `K:\PortableApps\Claude-Code\.claude.json`
- **MCP 설정**: `K:\PortableApps\Claude-Code\mcp-config.json`
- **환경 변수**: `K:\PortableApps\Claude-Code\.env`

### 🔄 성공한 인자를 JSON으로 변환하는 방법

#### 1단계: 터미널에서 성공한 명령어 캡처
```batch
# 예시: 성공한 명령어
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\@modelcontextprotocol\server-filesystem\dist\index.js --allowed-paths "K:/PortableApps" --port 3000

# 환경 변수
set FILESYSTEM_ROOT=K:/PortableApps
set MCP_PORT=3000
```

#### 2단계: mcp-config.json에 변환하여 추가
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": [
        "K:\\PortableApps\\Claude-Code\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js",
        "--allowed-paths",
        "K:/PortableApps",
        "--port",
        "3000"
      ],
      "env": {
        "FILESYSTEM_ROOT": "K:/PortableApps",
        "MCP_PORT": "3000"
      }
    }
  }
}
```

### 📚 주요 MCP 설정 예시 (K드라이브 버전)

#### NPX를 사용한 설정
```json
{
  "youtube-mcp": {
    "type": "stdio",
    "command": "K:\\PortableApps\\tools\\nodejs\\npx.cmd",
    "args": ["-y", "youtube-data-mcp-server"],
    "env": {
      "YOUTUBE_API_KEY": "YOUR_API_KEY_HERE",
      "YOUTUBE_TRANSCRIPT_LANG": "ko"
    }
  }
}
```

#### CMD.EXE 래퍼를 사용한 설정
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "cmd.exe",
      "args": [
        "/c",
        "K:\\PortableApps\\tools\\nodejs\\npx.cmd",
        "-y",
        "@modelcontextprotocol/server-filesystem"
      ],
      "env": {
        "ALLOWED_PATHS": "K:\\PortableApps"
      }
    }
  }
}
```

#### PowerShell을 사용한 설정
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "powershell.exe",
      "args": [
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "K:\\PortableApps\\tools\\nodejs\\npx.cmd -y @modelcontextprotocol/server-filesystem"
      ],
      "env": {
        "ALLOWED_PATHS": "K:\\PortableApps"
      }
    }
  }
}
```

#### Node를 직접 사용한 설정
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": [
        "K:\\PortableApps\\Claude-Code\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js"
      ],
      "env": {
        "ALLOWED_PATHS": "K:\\PortableApps"
      }
    }
  }
}
```

---

## Args 배열 설계 체크리스트

### ✅ 필수 체크리스트

#### 1️⃣ 토큰 단위 분리 (필수)

**✅ 올바른 방법:**
```json
{
  "args": [
    "/c",
    "K:\\PortableApps\\tools\\nodejs\\npx.cmd",
    "-y",
    "@modelcontextprotocol/server-filesystem"
  ]
}
```

**❌ 잘못된 방법:**
```json
{
  "args": [
    "/c",
    "K:\\PortableApps\\tools\\nodejs\\npx.cmd -y @modelcontextprotocol/server-filesystem"
  ]
}
```

#### 2️⃣ 경로 포함 시 이스케이프

```json
{
  "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
  "args": [
    "K:\\PortableApps\\Claude-Code\\mcp-servers\\server.js"
  ]
}
```

#### 3️⃣ 환경변수 전달

```json
{
  "env": {
    "UV_DEPS_CACHE": "K:\\PortableApps\\Claude-Code\\cache\\uvcache",
    "NODE_MODULES_CACHE": "K:\\PortableApps\\Claude-Code\\cache\\node_modules",
    "TEMP": "K:\\PortableApps\\Claude-Code\\temp",
    "API_KEY": "${API_KEY}"
  }
}
```

#### 4️⃣ 타임아웃 조정 (USB 속도별)

```json
{
  "env": {
    "MCP_TIMEOUT": "30000",  // USB 2.0: 30초
    "NODE_OPTIONS": "--max-old-space-size=512"
  }
}
```

### 📋 체크리스트 요약

- [ ] 토큰 단위로 분리했는가?
- [ ] 경로의 백슬래시를 이중 이스케이프 (`\\`) 했는가?
- [ ] K드라이브 전체 경로를 사용했는가?
- [ ] 환경변수를 K드라이브 기준으로 설정했는가?
- [ ] USB 속도에 맞는 타임아웃을 설정했는가?

---

## 문제 해결 가이드

### 🛠️ Cygpath 환경변수 설정 문제

#### K드라이브 포터블 환경
```batch
# K드라이브 Git 포터블 도구 경로 추가
set PATH=%PATH%;"K:\PortableApps\tools\git\usr\bin"

# 영구 설정 (claude.bat에 추가)
echo set PATH=%%PATH%%;K:\PortableApps\tools\git\usr\bin >> K:\PortableApps\Claude-Code\claude.bat

# 확인 방법
cygpath --version
cygpath -w /mnt/k
```

### 🛠️ Node.js PATH 문제
```batch
# K드라이브 환경변수 수동 설정
set PATH=K:\PortableApps\tools\nodejs;%PATH%
set NODE_PATH=K:\PortableApps\tools\nodejs

# claude.bat에 영구 추가
echo set PATH=K:\PortableApps\tools\nodejs;%%PATH%% >> K:\PortableApps\Claude-Code\claude.bat
```

### 🛠️ NPX 버전 호환성
```batch
# -y 옵션으로 최신 버전 강제 사용
K:\PortableApps\tools\nodejs\npx.cmd -y [패키지명]@latest
```

### 🛠️ JSON 이스케이프 문제
```batch
# PowerShell로 자동 변환
powershell -Command "'K:\PortableApps\tools\nodejs'.Replace('\', '\\')"
# 결과: K:\\PortableApps\\tools\\nodejs
```

### 🛠️ npm/npx 패키지를 찾을 수 없는 경우
```batch
# K드라이브 npm 전역 설치 경로 확인
K:\PortableApps\tools\nodejs\npm.cmd config get prefix

# npm/npx 경로 직접 설정
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\nodejs\node_modules\.bin;%PATH%

# 확인
K:\PortableApps\tools\nodejs\npm.cmd --version
K:\PortableApps\tools\nodejs\npx.cmd --version
```

### 🛠️ uvx 명령어를 찾을 수 없는 경우
```batch
# K드라이브에 uv 설치
K:\PortableApps\tools\python\python.exe -m pip install uv

# uvx 경로 설정
set PATH=K:\PortableApps\tools\python\Scripts;%PATH%

# 확인
K:\PortableApps\tools\python\Scripts\uvx.exe --version
```

---

## 📌 최종 통합 mcp-config.json 구조

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": ["K:\\PortableApps\\Claude-Code\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js"],
      "env": {"ALLOWED_PATHS": "K:\\PortableApps"}
    },
    "github": {
      "type": "stdio",
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": ["K:\\PortableApps\\Claude-Code\\node_modules\\@modelcontextprotocol\\server-github\\dist\\index.js"],
      "env": {"GITHUB_TOKEN": "YOUR_TOKEN"}
    },
    "shrimp-task": {
      "type": "stdio",
      "command": "K:\\PortableApps\\tools\\nodejs\\node.exe",
      "args": ["K:\\PortableApps\\Claude-Code\\mcp-servers\\mcp-shrimp-task-manager\\dist\\index.js"],
      "env": {"TASK_DB_PATH": "K:\\PortableApps\\Claude-Code\\ShrimpData\\tasks.db"}
    }
  },
  "globalEnv": {
    "NODE_PATH": "K:\\PortableApps\\Claude-Code\\node_modules",
    "PYTHONPATH": "K:\\PortableApps\\tools\\python\\Lib\\site-packages"
  }
}
```

---

⚠️ **이 문서는 K드라이브 포터블 환경에서 Claude Code Windows Native를 완벽하게 운영하기 위한 필수 가이드입니다.**

✅ **문서 버전**: 2.0.0 (Markdown Format)  
📅 **최종 업데이트**: 2025-08-21  
📍 **위치**: `K:\PortableApps\Claude-Code\CLAUDE-CODE-COMPLETE-GUIDE.md`