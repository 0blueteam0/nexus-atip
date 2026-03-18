# NEXUS MCP Gateway Rules (자동 로드)

## 개요
NEXUS MCP Gateway는 39개 MCP 서버를 1개 게이트웨이로 통합 관리합니다.
8개 메타 도구를 통해 on-demand로 MCP 서버를 발견, 라우팅, 호출합니다.

## Gateway MCP 도구 (nexus-gateway 서버)
| 도구 | 용도 | 언제 사용 |
|------|------|----------|
| `nexus_catalog` | MCP 서버 카탈로그 조회 | 어떤 MCP 서버가 있는지 확인할 때 |
| `nexus_discover` | 키워드로 도구 검색 | 특정 기능의 도구를 찾을 때 |
| `nexus_list_tools` | 서버별 도구 목록 | 특정 서버의 전체 도구 확인 시 |
| `nexus_call` | MCP 도구 프록시 호출 | 직접 연결 안 된 MCP 도구 호출 시 |
| `nexus_smart_route` | 작업 의도 분석/라우팅 | 어떤 MCP를 쓸지 모를 때 |
| `nexus_status` | 시스템 상태 확인 | 게이트웨이 건강 체크 |
| `nexus_cli` | mcp2cli 직접 실행 | OpenAPI/GraphQL CLI 호출 |
| `nexus_evolve` | 진화 상태 조회 | 시스템 학습 현황 확인 |

## 직접 연결 유지 서버 (4개)
다음 서버는 높은 빈도/낮은 레이턴시 때문에 직접 연결 유지:
- `desktop-commander` - P1 파일 작업
- `edit-file-lines` - P2 정밀 편집
- `shrimp-task` - P3 작업 관리
- `sequential-thinking` - 깊은 사고

## mcp2cli 직접 사용
```bash
# 전체 경로로 호출
"K:/PortableApps/genai/.local/bin/mcp2cli.exe" --spec <URL> --list
```

## CLI-Anything 사용
```bash
# Claude Code 내에서 플러그인 명령어
/cli-anything <app-path>
/cli-anything:refine <app-path>
/cli-anything:test <app-path>
```

## 관련 파일
- Gateway 서버: `nexus/gateway/mcp-gateway/index.js`
- 도구 캐시: `nexus/gateway/mcp-gateway/tool-cache.json`
- 캐시 빌더: `nexus/gateway/mcp-gateway/build-cache.js`
- 상세 문서: `documentation/guides/NEXUS-MCP-GATEWAY.md`
