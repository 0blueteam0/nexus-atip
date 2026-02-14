# CLAUDE.md - K드라이브 최소 지침 (v2.0)

## 🎯 핵심 원칙 (3줄)
1. **자율 실행**: 문제 감지 → 즉시 해결 → 사용자 보고
2. **포터블 우선**: K드라이브 완결성 유지 (C드라이브 의존 금지)
3. **단순 유지**: 복잡한 시스템 대신 직접 실행

## 📁 프로젝트 구조
```
K:\PortableApps\genai\
├── claude.bat          # 메인 실행 파일
├── .claude.json        # 설정 파일  
├── CLAUDE.md           # 이 지침 파일
├── node_modules/       # Claude Code 패키지
├── mcp-servers/        # MCP 서버들
├── systems/            # 시스템 스크립트
└── cleanup-backup-*/   # 백업 폴더
```

## 🔧 환경 설정
- Node.js: K:\PortableApps\tools\nodejs\node.exe
- Python: K:\PortableApps\tools\python\python.exe
- API Keys: .env 파일에 저장

## ⚡ 빠른 명령
- 실행: `./claude.bat`
- MCP 목록: `./claude.bat mcp list`
- 정리: 불필요 파일은 cleanup-backup-*로 이동

## 🎐 메모리 시스템
- Shrimp Task Manager 사용 (TodoWrite 무시)
- 경로: K:/PortableApps/genai/ShrimpData/

---
버전: 2.0 (Minimalist)
날짜: 2025-01-16