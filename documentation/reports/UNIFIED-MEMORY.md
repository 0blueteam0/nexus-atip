# 🧠 통합 메모리 시스템 아키텍처

## 현재 5개 메모리 시스템 분석

### 1. **kiro-memory** (메인)
- 위치: SQLite DB (C:\Users\...\data\mcp_memory.db)
- 용도: MCP 통합 메모리
- 상태: ✅ 작동 중

### 2. **memory-bank.json** (백업)
- 위치: K:\PortableApps\Claude-Code\memory-bank.json
- 용도: 수동 백업
- 상태: ✅ 활성

### 3. **ShrimpData/** (태스크)
- 위치: K:\PortableApps\Claude-Code\ShrimpData\
- 용도: 태스크 관리 전용
- 상태: ✅ 활성

### 4. **brain/** (학습)
- 위치: K:\PortableApps\Claude-Code\brain\
- 용도: 패턴 학습, 메트릭스
- 상태: ⚠️ 부분 활성

### 5. **memory-archive/** (영구)
- 위치: K:\PortableApps\Claude-Code\memory-archive\permanent\
- 용도: 영구 보관
- 상태: ⚠️ 미사용

## 🎯 통합 전략

### 계층적 메모리 아키텍처
```
┌─────────────────────────────────┐
│   kiro-memory (Primary MCP)     │ ← 실시간 대화
├─────────────────────────────────┤
│   ShrimpData (Task Memory)      │ ← 태스크 전용
├─────────────────────────────────┤
│   brain/ (Learning System)      │ ← 패턴 학습
├─────────────────────────────────┤
│   memory-archive/ (Permanent)   │ ← 영구 보관
└─────────────────────────────────┘
```

### 통합 규칙
1. **실시간**: kiro-memory가 모든 대화 저장
2. **태스크**: ShrimpData는 독립 유지 (태스크 전용)
3. **학습**: brain/이 패턴을 자동 학습
4. **백업**: 중요 내용만 memory-archive/로
5. **제거**: memory-bank.json 중복 제거

## 🔧 구현 계획

### Phase 1: 연결 설정
- kiro-memory ↔ brain/ 연동
- 자동 패턴 추출 시스템

### Phase 2: 자동 백업
- 일일 백업: kiro → archive
- 주간 정리: 중복 제거

### Phase 3: 지능형 관리
- 중요도 기반 자동 분류
- 오래된 메모리 자동 압축