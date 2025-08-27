@echo off
echo ============================================
echo   MCP 14개 전체 테스트
echo ============================================
echo.

echo [1/14] filesystem 테스트...
echo Testing: mcp__filesystem__list_directory
timeout /t 1 >nul

echo [2/14] kiro-memory 테스트...
echo Testing: mcp__kiro-memory__get_memory_context
timeout /t 1 >nul

echo [3/14] firecrawl 테스트...
echo Testing: mcp__firecrawl__firecrawl_scrape
timeout /t 1 >nul

echo [4/14] google-search 테스트...
echo Testing: mcp__google-search__search
timeout /t 1 >nul

echo [5/14] shrimp-task-manager 테스트...
echo Testing: mcp__shrimp-task-manager__list_tasks
timeout /t 1 >nul

echo [6/14] git 테스트...
echo Testing: mcp__git__status
timeout /t 1 >nul

echo [7/14] diff-typescript 테스트...
echo Testing: mcp__diff-typescript__diff
timeout /t 1 >nul

echo [8/14] memory-keeper 테스트...
echo Testing: mcp__memory-keeper__store
timeout /t 1 >nul

echo [9/14] rest-client 테스트...
echo Testing: mcp__rest-client__request
timeout /t 1 >nul

echo [10/14] playwright 테스트...
echo Testing: mcp__playwright__navigate
timeout /t 1 >nul

echo [11/14] context7 테스트 (API 키 필요)...
echo Testing: mcp__context7__resolve-library-id
timeout /t 1 >nul

echo [12/14] youtube-data 테스트 (API 키 필요)...
echo Testing: mcp__youtube-data__search
timeout /t 1 >nul

echo [13/14] prisma-postgres 테스트 (DB 필요)...
echo Testing: mcp__prisma-postgres__query
timeout /t 1 >nul

echo [14/14] mcp-installer 테스트...
echo Testing: mcp__mcp-installer__list
timeout /t 1 >nul

echo.
echo ============================================
echo   테스트 완료! 실제 연결은 Claude에서 확인
echo ============================================
pause