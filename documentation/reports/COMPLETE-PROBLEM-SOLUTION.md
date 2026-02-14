# 🔴 K:\PortableApps\genai 완전 문제 분석 및 해결책
생성: 2025-08-17 01:28 KST

## 1️⃣ 발견된 모든 문제 (우선순위순)

### 🚨 CRITICAL - 즉시 해결 필요

#### 1. MCP 완전 단절 (0/14 연결)
- **현상**: MCP 도구 하나도 연결 안됨
- **영향**: 파일 시스템 조작 불가능
- **원인**: .claude.json 78KB 비대화
- **해결**: .claude.json 초기화 및 재연결

#### 2. .claude.json 비대화 (78KB)
- **현상**: 정상 크기의 10배 이상
- **원인**: history 100+ 엔트리 누적
- **영향**: MCP 연결 실패, 성능 저하
- **해결**: projects 섹션 정리

#### 3. 루트 디렉토리 혼잡 (37개 파일)
- **현상**: 정리/분석/보고서 파일 난립
- **정상**: 10개 이하
- **해결**: 문서는 docs/로, 스크립트는 scripts/로

### ⚠️ HIGH - 24시간 내 해결

#### 4. 메모리 시스템 분산 (5개)
```
memory-data/     - ChromaDB 데이터
memory-archive/  - 백업용
brain/          - 패턴 학습
.claude/memory/ - Claude Desktop
ShrimpData/*/memory/ - 실제 사용 중
```
- **해결**: ShrimpData 중심으로 통합

#### 5. 중복 폴더 미정리
```
projects/  - 복사만 됨, 원본 남음
todos/     - 복사만 됨, 원본 남음  
npm-cache/ - 권한 문제로 미완료
```
- **해결**: 수동 삭제 필요

#### 6. 캐시 시스템 중복 (3개)
```
.cache/     - Huggingface
.local/     - Linux 스타일
npm-cache/  - NPM 캐시
```
- **해결**: 전부 제거 (재생성 가능)

### 🟡 MEDIUM - 주말 내 해결

#### 7. BAT 파일 과다 (11개)
- FIX-NPM-*.bat 3개
- CLEANUP-*.bat 2개
- MOVE-*.bat 2개
- **해결**: scripts/ 폴더로 이동

#### 8. 백업 파일 중복
- .claude.json.backup
- .claude.json.bloated
- **해결**: 하나만 유지

#### 9. MCP 폴더 분산
- mcp-servers/
- mcp-tools/
- **해결**: mcp/ 하나로 통합

#### 10. 임시 폴더 중복
- tmp/
- temp/
- **해결**: temp/ 하나로 통합

## 2️⃣ 즉시 실행 가능한 해결책

### Step 1: MCP 재연결 (최우선)
```bash
# 1. 백업
cp .claude.json .claude.json.broken

# 2. 초기화
echo '{"mcpServers": {"filesystem": {"command": "node", "args": ["K:/PortableApps/genai/mcp-servers/mcp-server-filesystem/dist/index.js"], "env": {"NODE_PATH": "K:/PortableApps/tools/nodejs/node_modules"}}}}' > .claude.json

# 3. Claude 재시작
./claude.bat --restart
```

### Step 2: 루트 정리
```bash
# 문서 이동
mkdir -p docs/reports
mv *.md docs/reports/

# 스크립트 이동  
mkdir -p scripts
mv *.bat scripts/

# 설정만 남기기
# 남길 파일: .claude.json, .env*, package.json, claude.bat
```

### Step 3: 중복 제거
```bash
# 원본 삭제 (권한 확인 후)
rm -rf projects todos
rm -rf npm-cache .cache .local

# 백업 정리
rm .claude.json.bloated
```

### Step 4: 폴더 통합
```bash
# MCP 통합
mv mcp-tools/* mcp-servers/
rmdir mcp-tools

# 임시 폴더 통합
mv tmp/* temp/
rmdir tmp
```

## 3️⃣ 장기 개선 계획

### 구조 개선 (최종 목표)
```
K:\PortableApps\genai\
├── .claude.json (5KB 이하)
├── claude.bat
├── package.json
├── CLAUDE.md (50줄 이하)
├── index.html (NEXUS ATIP)
├── node_modules/
├── threat-knowledge-graph/ (프로젝트)
├── ShrimpData/ (작업 관리)
├── brain/ (학습)
├── systems/ (자동화)
├── hooks/ (훅)
├── modules/ (지침)
├── docs/ (문서)
├── scripts/ (배치)
├── mcp/ (MCP 통합)
└── temp/ (임시)

총 16개 항목 (현재 62개 → 16개)
```

### 성능 목표
- .claude.json: 78KB → 5KB
- 루트 파일: 37개 → 5개
- MCP 연결: 0/14 → 14/14
- 시작 시간: 30초 → 5초

## 4️⃣ 실행 우선순위

### 🔴 지금 당장 (5분)
1. .claude.json 백업 및 초기화
2. MCP filesystem 재연결
3. Claude 재시작

### 🟡 오늘 중 (30분)
1. 문서/스크립트 폴더 정리
2. 중복 폴더 제거
3. TO-ARCHIVE 수동 이동

### 🟢 이번 주 (2시간)
1. 전체 구조 재편
2. 자동화 시스템 정비
3. 성능 최적화

## 5️⃣ 검증 방법

### 성공 지표
```bash
# MCP 연결 확인
./claude.bat mcp list | grep "filesystem"

# 파일 수 확인
find . -maxdepth 1 -type f | wc -l  # 목표: 10 이하

# .claude.json 크기
ls -lh .claude.json  # 목표: 5KB 이하

# 폴더 수
find . -maxdepth 1 -type d | wc -l  # 목표: 20 이하
```

## ⚠️ 주의사항

### 절대 삭제 금지
- threat-knowledge-graph/ (NEXUS ATIP)
- ShrimpData/ (현재 작업)
- node_modules/ (의존성)
- brain/ (학습 데이터)

### 백업 필수
- .claude.json 수정 전
- 폴더 삭제 전
- 구조 변경 전

---
이 제안서대로 진행하시겠습니까? (Y/N)