@echo off
chcp 65001 > nul
echo ╔══════════════════════════════════════════════════════════╗
echo ║     Claude Code Templates - 전체 컴포넌트 설치          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 총 400개 이상의 컴포넌트를 설치합니다.
echo 시간이 오래 걸릴 수 있습니다 (약 10-15분)
echo.
echo 계속하려면 아무 키나 누르세요...
pause > nul

set NPX=K:/PortableApps/tools/nodejs/npx.cmd
set TEMPLATE=claude-code-templates@latest

echo.
echo [1/5] 에이전트 설치 중 (156개)...
echo ======================================

REM 에이전트를 20개씩 배치로 설치
echo 배치 1/8: AI 및 API 전문가들...
%NPX% %TEMPLATE% --agent ai-specialists/ai-ethics-advisor,ai-specialists/hackathon-ai-strategist,ai-specialists/llms-maintainer,ai-specialists/model-evaluator,ai-specialists/prompt-engineer,ai-specialists/search-specialist,ai-specialists/task-decomposition-expert,api-graphql/graphql-architect,api-graphql/graphql-performance-optimizer,api-graphql/graphql-security-specialist,blockchain-web3/smart-contract-auditor,blockchain-web3/smart-contract-specialist,blockchain-web3/web3-integration-specialist,business-marketing/business-analyst,business-marketing/content-marketer,business-marketing/customer-support,business-marketing/legal-advisor,business-marketing/marketing-attribution-analyst,business-marketing/payment-integration,business-marketing/product-strategist

timeout /t 2 /nobreak > nul

echo 배치 2/8: 데이터 및 데이터베이스 전문가들...
%NPX% %TEMPLATE% --agent data-ai/ai-engineer,data-ai/computer-vision-engineer,data-ai/data-engineer,data-ai/data-scientist,data-ai/ml-engineer,data-ai/mlops-engineer,data-ai/nlp-engineer,data-ai/quant-analyst,database/database-admin,database/database-architect,database/database-optimization,database/database-optimizer,database/nosql-specialist,database/supabase-schema-architect,business-marketing/risk-manager,business-marketing/sales-automator

timeout /t 2 /nobreak > nul

echo 배치 3/8: 연구 및 개발팀...
%NPX% %TEMPLATE% --agent deep-research-team/academic-researcher,deep-research-team/competitive-intelligence-analyst,deep-research-team/data-analyst,deep-research-team/fact-checker,deep-research-team/query-clarifier,deep-research-team/report-generator,deep-research-team/research-brief-generator,deep-research-team/research-coordinator,deep-research-team/research-orchestrator,deep-research-team/research-synthesizer,deep-research-team/technical-researcher,development-team/backend-architect,development-team/cli-ui-designer,development-team/devops-engineer,development-team/frontend-developer,development-team/fullstack-developer,development-team/ios-developer,development-team/mobile-developer,development-team/ui-ux-designer

timeout /t 2 /nobreak > nul

echo 배치 4/8: 개발 도구 및 DevOps...
%NPX% %TEMPLATE% --agent development-tools/code-reviewer,development-tools/command-expert,development-tools/context-manager,development-tools/debugger,development-tools/dx-optimizer,development-tools/error-detective,development-tools/mcp-expert,development-tools/performance-profiler,development-tools/test-engineer,devops-infrastructure/cloud-architect,devops-infrastructure/deployment-engineer,devops-infrastructure/devops-troubleshooter,devops-infrastructure/monitoring-specialist,devops-infrastructure/network-engineer,devops-infrastructure/security-engineer,devops-infrastructure/terraform-specialist,devops-infrastructure/vercel-deployment-specialist

timeout /t 2 /nobreak > nul

echo 배치 5/8: 문서화 및 전문 자문...
%NPX% %TEMPLATE% --agent documentation/api-documenter,documentation/changelog-generator,documentation/docusaurus-expert,documentation/technical-writer,expert-advisors/agent-expert,expert-advisors/architect-review,expert-advisors/dependency-manager,expert-advisors/documentation-expert,modernization/architecture-modernizer,modernization/cloud-migration-specialist,modernization/legacy-modernizer

timeout /t 2 /nobreak > nul

echo 배치 6/8: 미디어 및 게임 개발...
%NPX% %TEMPLATE% --agent ffmpeg-clip-team/audio-mixer,ffmpeg-clip-team/audio-quality-controller,ffmpeg-clip-team/podcast-content-analyzer,ffmpeg-clip-team/podcast-metadata-specialist,ffmpeg-clip-team/podcast-transcriber,ffmpeg-clip-team/social-media-clip-creator,ffmpeg-clip-team/timestamp-precision-specialist,ffmpeg-clip-team/video-editor,game-development/3d-artist,game-development/game-designer,game-development/unity-game-developer,game-development/unreal-engine-developer

timeout /t 2 /nobreak > nul

echo 배치 7/8: MCP 및 특수 팀들...
%NPX% %TEMPLATE% --agent mcp-dev-team/mcp-deployment-orchestrator,mcp-dev-team/mcp-integration-engineer,mcp-dev-team/mcp-protocol-specialist,mcp-dev-team/mcp-registry-navigator,mcp-dev-team/mcp-security-auditor,mcp-dev-team/mcp-server-architect,mcp-dev-team/mcp-testing-engineer,obsidian-ops-team/connection-agent,obsidian-ops-team/content-curator,obsidian-ops-team/metadata-agent,obsidian-ops-team/moc-agent,obsidian-ops-team/review-agent,obsidian-ops-team/tag-agent,obsidian-ops-team/vault-optimizer

timeout /t 2 /nobreak > nul

echo 배치 8/8: 보안, 성능 및 프로그래밍 언어...
%NPX% %TEMPLATE% --agent security/api-security-audit,security/compliance-specialist,security/incident-responder,security/penetration-tester,security/security-auditor,performance-testing/load-testing-specialist,performance-testing/performance-engineer,performance-testing/react-performance-optimization,performance-testing/test-automator,performance-testing/web-vitals-optimizer,programming-languages/python-pro,programming-languages/javascript-pro,programming-languages/typescript-pro,programming-languages/golang-pro,programming-languages/rust-pro,web-tools/nextjs-architecture-expert,web-tools/react-performance-optimizer

echo.
echo [2/5] 명령어 설치를 시작합니다...
echo ======================================
echo 명령어 설치는 다음 단계에서 진행됩니다.
echo.
pause