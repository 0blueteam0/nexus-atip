# MCP 서버 최적화 가이드

## 현재 MCP 서버 구성 (28개)

### Core (필수 - 7개)
| 서버 | 용도 | 우선순위 |
|------|------|----------|
| filesystem | 파일 시스템 접근 | CRITICAL |
| memory | 지식 그래프 저장 | CRITICAL |
| git-mcp | Git 작업 자동화 | HIGH |
| sequential-thinking | 복잡한 문제 해결 | HIGH |
| desktop-commander | 고급 파일/프로세스 | HIGH |
| edit-file-lines | 정밀 파일 편집 | HIGH |
| mcp-installer | MCP 설치 관리 | MEDIUM |

### Memory (3개)
| 서버 | 용도 |
|------|------|
| kiro-memory | 프로젝트 메모리 (메인) |
| shrimp-task | 태스크 관리 |
| memory-keeper | 컨텍스트 영속성 |

### Web/Search (5개)
| 서버 | 용도 |
|------|------|
| firecrawl | 웹 크롤링/스크래핑 |
| websearch | 웹 검색 |
| one-search | 통합 검색 |
| youtube-data | YouTube 데이터 |
| context7 | 라이브러리 문서 |

## 보안 설정

### API 키 환경변수화
`.claude.json`에서 하드코딩 제거:
```json
// 이전 (위험)
"GITHUB_TOKEN": "ghp_xxxx"

// 이후 (안전)
"GITHUB_TOKEN": "${GITHUB_TOKEN}"
```

### .env 파일 위치
```
K:/PortableApps/genai/.env
```

## 성능 최적화

### 1. 불필요한 서버 비활성화
사용하지 않는 서버는 .claude.json에서 제거

### 2. 서버 그룹화
```
필수 (항상 로드): filesystem, memory, git-mcp
선택 (필요시): firecrawl, youtube-data
```

### 3. 타임아웃 설정
긴 작업 서버는 타임아웃 증가

## 문제 해결

### 서버 연결 실패
```bash
# 상태 확인
claude mcp list

# 디버그 모드
claude --debug

# 특정 서버 테스트
/mcp
```

### 경로 문제 (K드라이브)
- `cmd /c` 래퍼 사용
- 슬래시 방향 통일 (/)
