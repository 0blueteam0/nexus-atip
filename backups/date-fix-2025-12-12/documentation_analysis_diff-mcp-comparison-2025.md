# Diff MCP 서버 비교 분석 (2025-01-16)

## 📊 비교 테이블

| 기준 | mcp-server-diff-typescript | unified-diff-mcp | mcp-server-diff-editor |
|------|---------------------------|------------------|----------------------|
| **런타임** | Node.js/TypeScript | Bun (고성능) | Node.js |
| **설치 난이도** | ⭐⭐⭐⭐⭐ 매우 쉬움 | ⭐⭐⭐ Bun 필요 | ⭐⭐⭐⭐ 쉬움 |
| **출력 형식** | 텍스트 diff | HTML/PNG 시각화 | 고급 편집 |
| **GitHub 연동** | ❌ | ✅ Gist 자동생성 | ❌ |
| **시각화** | ❌ | ✅ 브라우저 자동열기 | ✅ 패턴 인식 |
| **메모리 사용** | 낮음 | 중간 | 중간 |
| **Windows 호환** | ✅ 완벽 | ⚠️ Bun 설치 필요 | ✅ 양호 |
| **기능 범위** | 단순 diff | 시각화 중심 | 편집 중심 |

## 🎯 Windows Native 환경 추천

### 1위: **mcp-server-diff-typescript** ✅
- **이유**: 
  - Node.js만 있으면 즉시 실행
  - Windows 완벽 호환
  - 가장 안정적
  - K드라이브 포터블 철학과 일치
  
### 2위: unified-diff-mcp
- **장점**: 시각화 강력
- **단점**: Bun 런타임 추가 설치 필요

### 3위: mcp-server-diff-editor
- **장점**: 고급 편집 기능
- **단점**: 복잡도 높음

## 💡 설치 명령

```bash
# 추천: mcp-server-diff-typescript
./claude.bat mcp add mcp-server-diff-typescript "npx -y @tatn/mcp-server-diff-typescript"

# 대안: unified-diff-mcp (Bun 설치 후)
./claude.bat mcp add unified-diff "bunx @gorosun/unified-diff-mcp"
```

## 📝 결론
K드라이브 포터블 환경에서는 **mcp-server-diff-typescript**가 최적입니다.
- 추가 런타임 불필요
- 안정성 최고
- 즉시 사용 가능