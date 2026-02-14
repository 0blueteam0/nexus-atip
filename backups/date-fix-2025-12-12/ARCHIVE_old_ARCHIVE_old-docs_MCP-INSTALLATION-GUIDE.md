# 📦 MCP 서버 완전 설치 가이드
작성일: 2025-01-19
환경: Windows K드라이브 포터블 환경

## 🚀 빠른 설치 (필수 10개)

### 1단계: 기본 디렉토리 생성
```bash
# MCP 서버 디렉토리 생성
mkdir K:\PortableApps\genai\mcp-servers
cd K:\PortableApps\genai\mcp-servers
```

### 2단계: 필수 MCP 서버 설치

#### 1. 파일시스템 서버
```bash
cd K:\PortableApps\genai\mcp-servers
npm install @modelcontextprotocol/server-filesystem
```

#### 2. 메모리 서버
```bash
npm install @modelcontextprotocol/server-memory
```

#### 3. Shrimp Task Manager
```bash
cd K:\PortableApps\genai
npm install mcp-shrimp-task-manager
```

#### 4. Git MCP 서버
```bash
npm install @cyanheads/git-mcp-server
```

#### 5. Edit File Lines
```bash
cd K:\PortableApps\genai\mcp-servers
git clone https://github.com/modelcontextprotocol/mcp-edit-file-lines.git
cd mcp-edit-file-lines
npm install
npm run build
```

### 3단계: .claude.json 설정
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\mcp-servers\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js"
      ],
      "env": {
        "ALLOWED_DIRECTORIES": "K:\\"
      }
    },
    "memory": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\mcp-servers\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"
      ]
    },
    "shrimp-task": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\node_modules\\mcp-shrimp-task-manager\\dist\\index.js"
      ],
      "env": {
        "TASK_DATA_PATH": "K:\\PortableApps\\genai\\ShrimpData"
      }
    }
  }
}
```

## 📋 전체 19개 서버 설치 방법

### A. NPM 설치 서버 (로컬)

#### 기본 설치 명령
```bash
# 메인 디렉토리에서
cd K:\PortableApps\genai
npm install mcp-shrimp-task-manager
npm install @cyanheads/git-mcp-server

# mcp-servers 디렉토리에서  
cd K:\PortableApps\genai\mcp-servers
npm install @modelcontextprotocol/server-filesystem
npm install @modelcontextprotocol/server-memory
```

#### Git Clone 후 빌드
```bash
# Edit File Lines
git clone https://github.com/xyz/mcp-edit-file-lines.git
cd mcp-edit-file-lines
npm install
npm run build

# Kiro Memory (Python)
git clone https://github.com/kirosc/mcp-memory.git kiro-memory
cd kiro-memory
pip install -r requirements.txt
```

### B. NPX 실행 서버 (온라인)

NPX로 실행되는 서버는 별도 설치 불필요. .claude.json에 설정만 추가:

#### Context7 (문서 검색)
```json
"context7": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
}
```

#### Google Search
```json
"google-search": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "google-search-mcp"],
  "env": {
    "GOOGLE_SEARCH_API_KEY": "YOUR_API_KEY",
    "GOOGLE_SEARCH_ENGINE_ID": "YOUR_CSE_ID"
  }
}
```

#### Firecrawl (웹 스크래핑)
```json
"firecrawl": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@firecrawl/mcp-server@latest"],
  "env": {
    "FIRECRAWL_API_KEY": "YOUR_API_KEY"
  }
}
```

#### GitHub
```json
"github": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "github_pat_YOUR_TOKEN"
  }
}
```

#### Playwright (브라우저 자동화)
```json
"playwright": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@executeautomation/playwright-mcp-server"]
}
```

#### YouTube Data
```json
"youtube-data": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "youtube-data-mcp-server"],
  "env": {
    "YOUTUBE_API_KEY": "YOUR_API_KEY"
  }
}
```

#### Websearch
```json
"websearch": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "websearch-mcp"],
  "env": {
    "TAVILY_API_KEY": "YOUR_API_KEY"
  }
}
```

#### Perplexity
```json
"perplexity": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "perplexity-mcp"],
  "env": {
    "PERPLEXITY_API_KEY": "YOUR_API_KEY"
  }
}
```

### C. Python 기반 서버

#### Kiro Memory 설치
```bash
# Python 3.13 필요
cd K:\PortableApps\genai\mcp-servers
git clone https://github.com/kirosc/mcp-memory.git kiro-memory
cd kiro-memory

# 의존성 설치
C:\Python313\python.exe -m pip install mcp uvloop orjson
```

설정:
```json
"kiro-memory": {
  "type": "stdio",
  "command": "C:\\Python313\\python.exe",
  "args": [
    "K:\\PortableApps\\genai\\mcp-servers\\kiro-memory\\mcp_server_enhanced.py"
  ]
}
```

## 🔑 API 키 발급 방법

### 1. GitHub Personal Access Token
1. https://github.com/settings/tokens 접속
2. "Generate new token (classic)" 클릭
3. 권한 선택: repo, workflow, read:org
4. 생성된 토큰 복사

### 2. Google Search API
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성
3. Custom Search API 활성화
4. API 키 생성
5. https://cse.google.com 에서 검색 엔진 ID 생성

### 3. Firecrawl API
1. https://firecrawl.dev 가입
2. Dashboard에서 API 키 확인

### 4. YouTube Data API
1. Google Cloud Console에서 YouTube Data API v3 활성화
2. API 키 생성 (일일 할당량 제한 있음)

### 5. Tavily API (Websearch)
1. https://tavily.com 가입
2. API 키 발급 (무료 플랜 가능)

### 6. Perplexity API
1. https://www.perplexity.ai/settings/api
2. 유료 구독 필요할 수 있음

## 🛠️ 설치 확인 방법

### 1. 개별 서버 테스트
```bash
# Node.js 서버 직접 실행 테스트
node K:\PortableApps\genai\mcp-servers\node_modules\@modelcontextprotocol\server-filesystem\dist\index.js

# Python 서버 테스트
C:\Python313\python.exe K:\PortableApps\genai\mcp-servers\kiro-memory\mcp_server_enhanced.py
```

### 2. Claude에서 확인
```bash
# Claude 실행
K:\PortableApps\genai\claude.bat

# MCP 서버 목록 확인
/mcp
```

### 3. 연결 상태 확인
```bash
# Windows 명령 프롬프트에서
K:\PortableApps\genai\claude.bat mcp list
```

## ⚠️ 자주 발생하는 문제 해결

### 1. "Module not found" 에러
```bash
# node_modules 재설치
npm install
npm dedupe
```

### 2. Python 경로 문제
```bash
# Python 경로 확인
where python
# 또는
C:\Python313\python.exe --version
```

### 3. NPX 실행 실패
```bash
# npm 캐시 정리
npm cache clean --force
# npx 재설치
npm install -g npx
```

### 4. 경로 이스케이프 문제
- 단일 백슬래시: `K:\Path` (명령줄)
- 이중 백슬래시: `K:\\Path` (JSON 파일)

### 5. API 키 인식 안됨
- 환경변수 설정 확인
- .claude.json의 env 섹션 확인
- Claude 재시작

## 📝 설치 체크리스트

- [ ] Node.js 설치 확인 (K:\PortableApps\tools\nodejs)
- [ ] Python 설치 확인 (C:\Python313 또는 K:\PortableApps\tools\python)
- [ ] mcp-servers 디렉토리 생성
- [ ] 필수 5개 서버 설치
- [ ] .claude.json 설정 파일 생성
- [ ] API 키 설정 (최소 GitHub, Google)
- [ ] Claude 재시작
- [ ] /mcp 명령으로 연결 확인

## 💡 Pro Tips

### 1. 일괄 설치 스크립트
```batch
@echo off
REM install-mcp-servers.bat
cd K:\PortableApps\genai
npm install mcp-shrimp-task-manager @cyanheads/git-mcp-server

cd mcp-servers
npm install @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory

echo MCP 서버 설치 완료!
pause
```

### 2. 환경변수 일괄 설정
```batch
@echo off
REM set-api-keys.bat
set GITHUB_TOKEN=YOUR_TOKEN
set GOOGLE_SEARCH_API_KEY=YOUR_KEY
set FIRECRAWL_API_KEY=YOUR_KEY
set TAVILY_API_KEY=YOUR_KEY

echo API 키 설정 완료!
```

### 3. 최소 설치 (핵심 5개만)
- filesystem (파일 작업)
- shrimp-task (작업 관리)
- git-mcp (Git 작업)
- github (GitHub 통합)
- context7 (문서 검색)

---
**이 가이드를 따라하면 모든 MCP 서버를 완벽하게 설치할 수 있습니다!**