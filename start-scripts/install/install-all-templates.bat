@echo off
echo === Claude Code Templates 전체 설치 ===
echo.
echo 이 스크립트는 모든 컴포넌트를 설치합니다.
echo 설치 후 필요한 것만 선택적으로 사용하세요.
echo.
pause

REM 에이전트 설치 (20개씩 배치로)
echo [1/10] 에이전트 설치 중... (1-20)
K:/PortableApps/tools/nodejs/npx.cmd claude-code-templates@latest --agent development-team/frontend-developer,development-team/backend-architect,development-tools/mcp-expert,development-tools/context-manager,development-tools/debugger,database/database-architect,security/security-auditor,documentation/technical-writer,performance-testing/performance-engineer,devops-infrastructure/cloud-architect,data-ai/ml-engineer,api-graphql/graphql-architect,web3/smart-contract-specialist,business-marketing/product-strategist,game-development/unity-game-developer

timeout /t 2 /nobreak

echo [2/10] 더 많은 에이전트 설치 중... (21-40)
REM 추가 에이전트들...

echo [3/10] 명령어 설치 중... (1-20)
K:/PortableApps/tools/nodejs/npx.cmd claude-code-templates@latest --command git-workflow/create-pr,git-workflow/commit,utilities/ultra-think,testing/generate-tests,performance/performance-audit,documentation/generate-api-documentation,setup/setup-linting,security/security-audit,deployment/blue-green-deployment,orchestration/optimize

timeout /t 2 /nobreak

echo [4/10] Hook 설치 중...
K:/PortableApps/tools/nodejs/npx.cmd claude-code-templates@latest --hook automation/build-on-change,git-workflow/auto-commit,testing/test-before-commit,performance/memory-monitor,security/secrets-scanner

echo.
echo === 설치 완료 ===
echo.
echo 설치된 컴포넌트 확인:
dir /B .claude\agents
echo.
dir /B .claude\commands
echo.
pause