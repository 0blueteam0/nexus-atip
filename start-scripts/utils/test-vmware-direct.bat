@echo off
echo [VMware 직접 제어 테스트]
echo.

echo [1] 현재 실행 중인 VM 목록:
"C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe" list
echo.

echo [2] VMware 버전:
"C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe" | findstr "version"
echo.

echo [3] 사용 가능한 명령어 예시:
echo    - VM 시작: vmrun start [vmx 파일]
echo    - VM 중지: vmrun stop [vmx 파일]
echo    - 스냅샷: vmrun snapshot [vmx 파일] [스냅샷 이름]
echo    - 게스트 명령 실행: vmrun -gu [사용자] -gp [암호] runProgramInGuest [vmx] [프로그램]
echo.

echo [결과] Claude Code가 VMware를 직접 제어 가능!
echo        추가 MCP 서버 필요 없음!