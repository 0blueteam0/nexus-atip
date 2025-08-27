# 🧠 @memory-mcp-guide.md

## 📊 메모리 MCP 서버 비교 분석 (완료)

### 🏆 최종 결론 (2025-08-15)
**환경**: 128GB USB 3.2 Gen, RAM 충분, CPU 충분
**추천**: mcp-memory-service + ChromaDB (최고급)

### 📋 비교 결과 매트릭스

| 순위 | MCP 서버 | 점수 | 강점 | 약점 |
|------|----------|------|------|------|
| 🥇 | **mcp-memory-service** | 85 | 꿈기반 통합, 10+ AI 도구 지원 | 설치 복잡 |
| 🥈 | **claude-memory-mcp** | 80 | 연구기반, 균형잡힌 기능 | 문서화 부족 |
| 🥉 | **mcp-memory-keeper** | 75 | 단순함, 안정성 | 기능 제한 |
| 4️⃣ | **mcp-memory** | 60 | 클라우드 기반 | 인터넷 의존 |

### 🎯 선택 기준
1. **Windows Native 호환성** (25점)
2. **설치 용이성** (20점) 
3. **USB 환경 최적화** (20점)
4. **기능 풍부도** (20점)
5. **안정성/신뢰성** (15점)

### 💡 환경별 추천
- **고성능 PC**: mcp-memory-service + ChromaDB
- **균형형**: mcp-memory-service + SQLite-vec  
- **안정형**: mcp-memory-keeper

## 🚀 설치 경험 기록

### ❌ 설치 실패 패턴
1. **포터블 Python 한계**: venv, pip 모듈 없음
2. **권한 문제**: MarkupSafe 빌드 실패
3. **K 드라이브 tmp**: 임시 폴더 권한 제한

### ✅ 해결 방안
1. **시스템 Python 사용**: C:/Python313/python.exe
2. **관리자 권한 필요**: 복잡한 패키지 설치 시
3. **CPU 버전 우선**: CUDA 없이 안정성 확보

### 🔄 대안 전략
1. **mcp-memory-keeper 우선**: 단순하고 안정적
2. **점진적 업그레이드**: 안정화 후 고급 기능 추가
3. **하이브리드 구성**: 로컬 실행 + 클라우드 백업

## 🎯 즉시 적용 가능한 최적 선택

**현재 상황**: 설치 복잡도로 인한 지연 발생
**권장**: **mcp-memory-keeper** 즉시 설치 후 테스트
**이유**: 
- 단순한 SQLite 기반
- 최소 의존성
- 즉시 대화 기억 시작 가능

### 🚀 빠른 설치 명령
```bash
# 1. mcp-memory-keeper 설치
python -m pip install mcp-memory-keeper

# 2. .claude.json 설정
{
  "memory-keeper": {
    "type": "stdio",
    "command": "python",
    "args": ["-m", "memory_keeper"],
    "env": {
      "DATA_DIR": "K:/PortableApps/Claude-Code/memory/"
    }
  }
}
```

---
📅 작성: 2025-08-15 17:30 KST
🔄 마지막 업데이트: 설치 실패 패턴 기록
📍 다음 단계: mcp-memory-keeper 즉시 설치 시도