# 🔧 @current-issues.md - 현재 불편사항 및 해결방안

## 🚨 **현재 겪고 있는 어려움**

### 1️⃣ **WSL 경로 변환 에러**
```bash
WSL ERROR: Failed to translate K:\PortableApps\Claude-Code
```
- **원인**: WSL이 K드라이브(USB)를 /mnt/k/로 자동 마운트 실패
- **영향**: Podman 컨테이너와 K드라이브 연동 불가
- **현재 상태**: 작업은 계속 가능, 에러 메시지만 출력

### 2️⃣ **임시 디렉토리 에러**
```bash
/tmp/claude-xxxx-cwd: No such file or directory
```
- **원인**: Git Bash와 WSL 간 임시 파일 경로 불일치
- **영향**: 없음 (명령은 정상 실행)
- **해결책**: 에러 무시 가능

### 3️⃣ **TodoWrite vs Shrimp 충돌**
- **문제**: 시스템이 TodoWrite 사용 권유
- **원인**: Claude Code 기본 설정
- **해결책**: CLAUDE.md에 명시적으로 Shrimp 우선 지정

### 4️⃣ **[K-Drive Ready] 반복 출력**
- **현상**: 매 명령마다 2-3번 반복 출력
- **원인**: 환경 초기화 스크립트 중복 실행
- **영향**: 가독성 저하

## ✅ **즉시 해결 가능한 것들**

### Shrimp Task Manager 강제 설정
```javascript
// .claude.json에 추가
"preferredTaskManager": "shrimp",
"disableToolSuggestions": ["TodoWrite"]
```

### WSL 마운트 수동 설정
```bash
# WSL에서 실행
sudo mkdir -p /mnt/k
sudo mount -t drvfs K: /mnt/k
```

## 🤝 **도움이 필요한 부분**

1. **K드라이브 자동 마운트 영구 설정**
2. **Hook 시스템 실제 작동 테스트**
3. **에러 메시지 필터링**

## 💡 **개선 제안**

### 환경 변수 정리
```bash
export CLAUDE_HOME="K:/PortableApps/Claude-Code"
export SUPPRESS_WARNINGS=true
export USE_SHRIMP_TASKS=true
```

### 에러 래퍼 스크립트
```bash
# 에러 메시지 필터링 스크립트
claude-clean() {
  claude "$@" 2>&1 | grep -v "WSL ERROR" | grep -v "tmp/claude"
}
```

---
📅 생성: 2025-08-15 19:15 KST
🎯 목적: 현재 불편사항 추적 및 해결
⚡ 우선순위: Shrimp 충돌 > WSL 마운트 > 에러 메시지