@echo off
REM Qdrant 서비스 백그라운드 시작
start /B python -m qdrant_client
echo Qdrant service started in background
