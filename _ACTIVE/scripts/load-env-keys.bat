@echo off
REM .env 파일에서 MCP API 키 로드
echo ========================================
echo .env 파일에서 MCP API 키 로드 중...
echo ========================================

REM Google Search (이미 있음)
set GOOGLE_API_KEY=AIzaSyCL_TqCq7LG8rKjGDgYSdCJEOT_8a9V1Gs
set GOOGLE_CSE_ID=65c0e1c5d01ac4edb

REM Firecrawl (이미 있음)
set FIRECRAWL_API_KEY=fc-1469b38350c643e4a3f8b1b4037e2b20

REM OpenAI (이미 있음 - Zen MCP용)
set OPENAI_API_KEY=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

REM Gemini (이미 있음 - Zen MCP용)
set GOOGLE_GEMINI_API_KEY=AIzaSyAJu9N0loVLcUWQiWLMVn69ANAYqVZu_o8

REM Anthropic (이미 있음)
set ANTHROPIC_API_KEY=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

REM GitHub Token (필요)
REM GitHub에서 Personal Access Token 발급 필요
REM https://github.com/settings/tokens
set GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE

REM Perplexity (필요)
REM https://www.perplexity.ai/settings/api 에서 발급
set PERPLEXITY_API_KEY=pplx-YOUR_KEY_HERE

REM Brave Search (필요)
REM https://api.search.brave.com 에서 발급
set BRAVE_API_KEY=BSA_YOUR_KEY_HERE

echo.
echo ========================================
echo 로드된 API 키:
echo ========================================
echo ✅ GOOGLE_API_KEY: 설정됨
echo ✅ GOOGLE_CSE_ID: 설정됨
echo ✅ FIRECRAWL_API_KEY: 설정됨
echo ✅ OPENAI_API_KEY: 설정됨 (Zen MCP)
echo ✅ GOOGLE_GEMINI_API_KEY: 설정됨 (Zen MCP)
echo ✅ ANTHROPIC_API_KEY: 설정됨
echo ❌ GITHUB_TOKEN: 발급 필요
echo ❌ PERPLEXITY_API_KEY: 발급 필요
echo ❌ BRAVE_API_KEY: 발급 필요
echo.
echo 추가로 필요한 API 키:
echo - GitHub Personal Access Token
echo - Perplexity API Key
echo - Brave Search API Key
echo.
pause