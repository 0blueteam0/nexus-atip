# 파일 정리 계획 - MD 및 JSON 파일

## 📌 유지해야 할 파일 (필수)

### MD 파일
- **CLAUDE.md** - 핵심 지침 파일 (절대 삭제 금지)
- **LESSON-LEARNED-20250820.md** - 오늘의 교훈 (증거)

### JSON 파일  
- **package.json** - 프로젝트 설정
- **package-lock.json** - 의존성 잠금
- **.claude.json** - Claude 설정 (시스템 파일)

## 🗑️ 아카이브로 이동할 파일들

### 구버전/중복 MD 파일 (37개 중 35개)
#### MCP 관련 (중복 많음)
- MCP-COMPARISON-2025-01-16.md
- MCP-PRIORITY-GUIDE.md
- MCP-ECOSYSTEM-COMPLETE.md
- MCP-INSTALLATION-ISSUES-2025-01-17.md
- MCP-API-KEYS.md
- MCP-INVENTORY-ULTRATHINK.md
- API-KEY-VALIDATION-REPORT.md
- MCP-INSTALLATION-STATUS.md
- MCP-CONNECTION-TEST-RESULTS.md
- MCP-FINAL-STATUS-REPORT.md
- MCP-COMPLETE-GUIDE.md
- MCP-INSTALLATION-GUIDE.md
- MCP-FINAL-STATUS-2025-01-19.md
- MCP-CONNECTION-STATUS-2025-01-19.md
- MCP-STATUS-REPORT.md

#### 마스터 플랜 관련 (너무 많은 버전)
- COMPLETE-MASTER-PLAN.md
- MASTER-PLAN-BRAINSTORM.md
- MASTER-PLAN-REVISED-SCALE.md
- ULTIMATE-MASTER-PLAN.md
- PHASE1-COMPLETE.md

#### 시스템 분석 관련 (구버전)
- CRITICAL-ISSUES-2025-01-16.md
- CONVERSATION-CONTEXT-2025-01-16.md
- PROJECT-AUDIT-2025-01-16.md
- COMPLETE-LEARNING-DOCUMENTATION-2025-01-16.md
- BASH-ERROR-DIAGNOSTIC.md
- SSD-ENVIRONMENT-REPORT-2025-01-20.md
- K-TOOLS-INTEGRATION-PLAN.md
- K-DRIVE-DEEP-ANALYSIS.md
- SYSTEM-HEALTH-REPORT-2025-01-20.md

#### 오케스트레이션 관련 (중복)
- ORCHESTRATION-HIERARCHY.md
- orchestration-flow.md
- ZEN-COMPLETE-METHODOLOGY.md
- HYBRID-COMPLETE-FLOW.md
- zen-orchestration-config.json

#### 기타
- CLAUDE-MINIMAL.md (구버전)
- INDEX.md (불필요)

### 구버전/중복 JSON 파일 (12개 중 8개)
- mcp-config-template.json (템플릿)
- MCP-CONFIG-ADDITION.json (임시)
- fix-filesystem-access.json (임시 수정)
- configure-mcp-phase1.json (구버전)
- claude-config-final.json (구버전)
- claude-mcp-complete.json (구버전)
- mcp-config-18.json (테스트용)
- mcp-config-clean.json (구버전)
- mcp-config-optimized.json (구버전)

## 📊 정리 요약
- **MD 파일**: 37개 중 35개 아카이브 대상
- **JSON 파일**: 12개 중 8개 아카이브 대상
- **총 43개 파일 정리 대상**

## 실행 명령
```cmd
# 아카이브 폴더 생성
mkdir K:\PortableApps\genai\ARCHIVE\old-docs
mkdir K:\PortableApps\genai\ARCHIVE\old-configs

# MD 파일 이동 (예시)
move MCP-*.md ARCHIVE\old-docs\
move MASTER-PLAN-*.md ARCHIVE\old-docs\
move *-2025-01-*.md ARCHIVE\old-docs\

# JSON 파일 이동 (예시)  
move mcp-config-*.json ARCHIVE\old-configs\
move claude-config-*.json ARCHIVE\old-configs\
```