# Claude Code 설치 방법 3종 비교 분석
생성일: 2025-08-21

## 🔍 설치 방법 비교표

| 구분 | NPM Global | Native Install | K드라이브 Portable |
|------|------------|----------------|-------------------|
| **설치 명령** | `npm install -g @anthropic-ai/claude-code` | `curl -fsSL claude.ai/install.sh \| bash` | `npm init` + `npm install @anthropic-ai/claude-code` |
| **설치 위치** | `%AppData%\npm\node_modules` (Windows)<br>`/usr/local/lib/node_modules` (Linux/Mac) | `~/.claude/` 디렉토리 | `K:\PortableApps\Claude-Code\node_modules` |
| **실행 파일** | 시스템 PATH에 자동 등록 | 바이너리 직접 설치 | `claude.bat` 커스텀 래퍼 |
| **설정 파일** | `~/.claude.json` | `~/.claude.json` | `K:\PortableApps\Claude-Code\.claude.json` |
| **package.json** | ❌ 없음 | ❌ 없음 | ✅ 있음 (MCP 서버 관리용) |
| **MCP 서버** | 별도 설치 필요 | 별도 설치 필요 | dependencies로 통합 관리 |
| **업데이트** | `npm update -g` | 자동 업데이트 | `npm update` |
| **포터블성** | ❌ 시스템 의존 | ❌ 홈 디렉토리 의존 | ✅ USB로 이동 가능 |
| **C드라이브 의존성** | 높음 | 높음 | 없음 (Zero Dependency) |

## 📁 파일 구조 상세 비교

### 1. NPM Global 설치
```
C:\Users\[username]\AppData\Roaming\npm\
├── node_modules\
│   └── @anthropic-ai\
│       └── claude-code\
│           ├── cli.js
│           ├── sdk.mjs
│           └── package.json
└── claude.cmd (실행 래퍼)

~\.claude.json (설정 파일)
```

### 2. Native Install
```
~\.claude\
├── bin\
│   └── claude (실행 바이너리)
├── anthropic_key_helper.sh
└── claude.json

시스템 PATH에 ~/.claude/bin 추가
```

### 3. K드라이브 Portable (현재 환경)
```
K:\PortableApps\Claude-Code\
├── package.json (✅ 정당함 - MCP 관리용)
├── package-lock.json
├── node_modules\
│   ├── @anthropic-ai\claude-code\
│   │   └── cli.js (9MB 번들)
│   ├── @cyanheads\git-mcp-server\
│   ├── firecrawl-mcp\
│   ├── mcp-shrimp-task-manager\
│   └── [기타 MCP 서버들]
├── claude.bat (커스텀 실행 스크립트)
└── .claude.json (포터블 설정)
```

## 🎯 K드라이브 방식의 정당성

### 장점
1. **완전한 포터블성**: USB에 모든 환경 포함
2. **통합 관리**: Claude Code + MCP 서버 일괄 관리
3. **의존성 격리**: 시스템 npm과 완전 분리
4. **백업 용이**: 폴더 전체 복사로 백업 가능
5. **버전 고정**: package-lock.json으로 버전 일관성 보장

### package.json이 필요한 이유
- **MCP 서버 의존성 관리**: 20개 이상의 MCP 서버를 dependencies로 관리
- **스크립트 실행**: npm scripts로 자동화 가능
- **버전 관리**: 정확한 버전 명시 및 업데이트 추적
- **포터블 환경 구축**: 전역 설치 없이 로컬 환경 완성

## 📊 결론

**현재 K드라이브 구성은 포터블 개발 환경을 위한 최적의 선택**입니다.

- `package.json` 존재: ✅ 정당함
- `cli.js` 9MB: ✅ 정상 (번들된 파일)
- 구조: ✅ 포터블 환경에 최적화

이는 의도적으로 설계된 구조이며, 전역 설치나 Native 설치보다 더 유연하고 관리하기 쉬운 방식입니다.