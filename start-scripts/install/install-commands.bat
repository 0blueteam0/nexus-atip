@echo off
chcp 65001 > nul
echo ╔══════════════════════════════════════════════════════════╗
echo ║        Claude Code Templates - 명령어 설치              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

set NPX=K:/PortableApps/tools/nodejs/npx.cmd
set TEMPLATE=claude-code-templates@latest

echo [명령어 설치] 주요 카테고리별 설치 (204개)
echo ======================================

echo 1/10: Git 워크플로우...
%NPX% %TEMPLATE% --command git-workflow/create-pr,git-workflow/commit,git-workflow/branch-cleanup,git-workflow/pr-review,git-workflow/fix-github-issue,git-workflow/create-pull-request,git-workflow/create-worktrees,git-workflow/git-bisect-helper,git-workflow/update-branch-name

timeout /t 2 /nobreak > nul

echo 2/10: 유틸리티...
%NPX% %TEMPLATE% --command utilities/ultra-think,utilities/code-review,utilities/debug-error,utilities/refactor-code,utilities/explain-code,utilities/clean,utilities/prime,utilities/context-prime,utilities/directory-deep-dive,utilities/fix-issue

timeout /t 2 /nobreak > nul

echo 3/10: 테스팅...
%NPX% %TEMPLATE% --command testing/generate-tests,testing/test-coverage,testing/write-tests,testing/e2e-setup,testing/test-automation-orchestrator,testing/setup-comprehensive-testing,testing/generate-test-cases,testing/test-quality-analyzer

timeout /t 2 /nobreak > nul

echo 4/10: 성능 최적화...
%NPX% %TEMPLATE% --command performance/performance-audit,performance/optimize-bundle-size,performance/optimize-build,performance/optimize-api-performance,performance/optimize-database-performance,performance/optimize-memory-usage,performance/add-performance-monitoring,performance/implement-caching-strategy

timeout /t 2 /nobreak > nul

echo 5/10: 문서화...
%NPX% %TEMPLATE% --command documentation/generate-api-documentation,documentation/create-architecture-documentation,documentation/update-docs,documentation/create-onboarding-guide,documentation/migration-guide,documentation/troubleshooting-guide,documentation/doc-api,documentation/load-llms-txt

timeout /t 2 /nobreak > nul

echo 6/10: 프로젝트 관리...
%NPX% %TEMPLATE% --command project-management/init-project,project-management/create-prd,project-management/create-prp,project-management/milestone-tracker,project-management/todo,project-management/create-feature,project-management/add-package,project-management/release

timeout /t 2 /nobreak > nul

echo 7/10: 보안...
%NPX% %TEMPLATE% --command security/security-audit,security/dependency-audit,security/secrets-scanner,security/penetration-test,security/security-hardening,security/add-authentication-system

timeout /t 2 /nobreak > nul

echo 8/10: 배포...
%NPX% %TEMPLATE% --command deployment/prepare-release,deployment/blue-green-deployment,deployment/rollback-deploy,deployment/ci-setup,deployment/containerize-application,deployment/hotfix-deploy,deployment/setup-automated-releases

timeout /t 2 /nobreak > nul

echo 9/10: 설정 및 초기화...
%NPX% %TEMPLATE% --command setup/setup-linting,setup/setup-formatting,setup/setup-monorepo,setup/setup-development-environment,setup/setup-docker-containers,setup/migrate-to-typescript,setup/update-dependencies

timeout /t 2 /nobreak > nul

echo 10/10: 자동화...
%NPX% %TEMPLATE% --command automation/ci-pipeline,automation/workflow-orchestrator,automation/husky,automation/act

echo.
echo ✅ 명령어 설치 완료!
pause