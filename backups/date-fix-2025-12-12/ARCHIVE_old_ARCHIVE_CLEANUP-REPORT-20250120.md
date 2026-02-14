# 파일 정리 보고서 - 2025년 1월 20일

## 🔴 핵심 문제 분석

### 1. .claude.json 반복 손상 원인
- **동시 접근 충돌**: 여러 프로세스가 동시에 파일 수정 시도
- **비정상 종료**: Claude Code 강제 종료 시 파일 손상
- **인코딩 문제**: UTF-8 BOM 등 인코딩 충돌
- **경로 혼용**: K:\ 와 K:/ 혼용으로 인한 파싱 오류

### 2. 시간 로그 오류 원인
- **firstStartTime**: "2025-08-16" (미래 날짜 - 8월은 1월의 오타)
- **changelogLastFetched**: 타임스탬프 형식 불일치
- **UTC vs KST**: 시간대 혼용으로 인한 혼란

### 3. bat 파일 중복 문제
- 36개의 bat 파일이 같은 폴더에 존재
- 대부분 유사한 기능의 중복 파일들

## 📁 파일 분류 및 정리 계획

### 필수 유지 (4개)
- `claude.bat` - 메인 실행 파일
- `quick.bat` - 빠른 실행
- `load-env-keys.bat` - API 키 로드
- `set-api-keys.bat` - API 키 설정

### ARCHIVE 이동 대상 (32개)

#### 중복 Claude 실행 파일 (7개)
- `claude-fast.bat` - quick.bat과 중복
- `claude-original.bat` - 구버전
- `claude-fixed.bat` - 임시 수정본
- `claude-final.bat` - 불필요한 버전
- `claude-english.bat` - 언어별 분리 불필요
- `claude-work.bat` - 작업용 임시 파일
- `claude-global-tools.bat` - 통합됨

#### K드라이브 관련 임시 파일 (8개)
- `K-DRIVE-DEEP-SCAN.bat`
- `SCAN-K-DRIVE.bat`
- `MIGRATE-TO-GLOBAL-TOOLS.bat`
- `MOVE-TO-K-TOOLS.bat`
- `claude-k-tools.bat`
- `CREATE-SYMLINKS-FIRST.bat`
- `STEP2-PHYSICAL-MOVE.bat`
- `RUN-SYMLINK-NOW.bat`

#### MCP 설치/검사 중복 (6개)
- `CHECK-ALL-MCP.bat`
- `FINAL-MCP-VERIFY.bat`
- `PARALLEL-MCP-CONNECT.bat`
- `build-official-mcp.bat`
- `UPDATE-CLAUDE-CONFIG.bat`
- `init-sqlite.bat`

#### 임시 수정/실행 파일 (7개)
- `EXECUTE-NOW.bat`
- `EXECUTE-TOOLS-INTEGRATION.bat`
- `FINAL-FIX.bat`
- `CHECK-GIT-PATH.bat`
- `git.bat`
- `bash.bat`
- `CLEANUP-REDUNDANT-FILES.bat`

#### 프리플라이트 체크 중복 (3개)
- `pre-flight-check-utf8.bat`
- `pre-flight-check-v2.bat`
- `archive-cleanup.bat`

#### 아카이브 이동 스크립트 (1개)
- `move-to-external-archive.bat`

## 🛡️ 해결 방안

### 1. .claude.json 보호 시스템
```javascript
// claude-json-protector.js
const fs = require('fs');
const path = require('path');

class ClaudeJsonProtector {
    constructor() {
        this.configPath = 'K:\\PortableApps\\genai\\.claude.json';
        this.lockFile = this.configPath + '.lock';
        this.backupDir = 'K:\\PortableApps\\genai\\ARCHIVE\\json-backups';
    }
    
    // 자동 백업 (매 실행 시)
    autoBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `claude-${timestamp}.json`);
        fs.copyFileSync(this.configPath, backupPath);
    }
    
    // 무결성 검사
    validateJson() {
        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            const json = JSON.parse(content);
            
            // 필수 필드 검사
            if (!json.mcpServers || Object.keys(json.mcpServers).length === 0) {
                this.restoreFromBackup();
                return false;
            }
            
            return true;
        } catch (e) {
            this.restoreFromBackup();
            return false;
        }
    }
    
    // 백업에서 복원
    restoreFromBackup() {
        const backups = fs.readdirSync(this.backupDir)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();
            
        if (backups.length > 0) {
            const latestBackup = path.join(this.backupDir, backups[0]);
            fs.copyFileSync(latestBackup, this.configPath);
            console.log(`Restored from ${backups[0]}`);
        }
    }
}
```

### 2. 시간 동기화 수정
- 모든 날짜를 ISO 8601 형식으로 통일
- KST 시간대 명시적 사용
- 2025-08-16을 2025-01-16으로 수정

### 3. 파일 시스템 정리 실행 계획
1. ARCHIVE 하위 폴더 생성
   - `ARCHIVE/deprecated-bat/` - 구버전 bat 파일
   - `ARCHIVE/temp-scripts/` - 임시 스크립트
   - `ARCHIVE/json-backups/` - .claude.json 백업

2. 파일 이동 실행
3. 심볼릭 링크 생성 (호환성 유지)
4. 문서화 완료

## 🎯 즉시 실행 작업
1. .claude.json 백업 생성 ✅
2. 보호 시스템 구축
3. bat 파일 정리
4. 시간 로그 수정