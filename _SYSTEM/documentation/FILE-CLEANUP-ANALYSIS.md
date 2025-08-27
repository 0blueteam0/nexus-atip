# 파일 정리 분석 보고서
날짜: 2025-08-27

## [*] 현재 상황
- 최상위 BAT 파일: 34개
- 최상위 TXT 파일: 22개
- 최상위 JS 파일: 9개
- 총 예상 파일: 80개 이상

## [>>] 파일 분류 카테고리

### 1. ESSENTIAL (필수 - 절대 삭제 금지)
**정의**: 시스템 작동에 필수적인 핵심 파일
```
- claude.bat (메인 실행 파일)
- CLAUDE.md (핵심 지침)
- package.json, package-lock.json
- .bashrc, .bash_profile
- shell-snapshots (블로커 파일)
```

### 2. ACTIVE (활성 - 현재 사용중)
**정의**: 최근 7일 이내 수정되거나 정기적으로 사용
```
- MAINTAIN-BASH-FIX.bat
- ASCII-STYLE-GUIDE.md
- 현재 작동중인 자동화 스크립트
```

### 3. BACKUP (백업 - 보관 필요)
**정의**: 현재 사용 안 하지만 참고/복구용으로 필요
```
- claude.bat.backup_* 파일들
- 이전 버전 설정 파일
- 작동했던 해결책 스크립트
```

### 4. TEMPORARY (임시 - 정리 가능)
**정의**: 테스트용, 디버그용으로 만든 일회성 파일
```
- FIX-*.bat (임시 수정 파일들)
- TEST-*.bat
- DEBUG-*.bat
- *-test.* 파일들
```

### 5. OBSOLETE (폐기 - 삭제 대상)
**정의**: 더 이상 필요 없고 가치 없는 파일
```
- 중복 파일
- 실패한 시도 파일
- 오래된 로그
- 빈 파일
```

## [>>] 정리 전략

### Phase 1: 분석 및 목록화
1. 모든 파일을 위 5개 카테고리로 분류
2. 각 파일의 최종 수정일, 크기, 용도 파악
3. 분류 결과를 리스트로 정리

### Phase 2: 안전한 이동
1. OBSOLETE → ARCHIVE/obsolete-2025-08-27/
2. TEMPORARY → ARCHIVE/temp-cleanup-2025-08-27/
3. BACKUP → ARCHIVE/backups-organized/
4. ACTIVE, ESSENTIAL은 그대로 유지

### Phase 3: 구조 재정리
```
K:/PortableApps/Claude-Code/
├── [필수 파일들만 최상위]
├── configs/          (설정 파일)
├── scripts/          (활성 스크립트)
├── documentation/    (문서)
├── systems/          (시스템 파일)
├── mcp-servers/      (MCP 서버)
├── ARCHIVE/          (모든 보관 파일)
│   ├── 2025-08-27-cleanup/
│   ├── backups/
│   └── reference/
└── temp/             (임시 파일용)
```

## [!] 안전 규칙
1. 삭제하지 않고 ARCHIVE로 이동
2. 이동 전 백업 리스트 생성
3. 단계별로 진행하며 확인
4. 의심스러운 경우 보관

---
다음 단계: 실제 파일 분석 시작