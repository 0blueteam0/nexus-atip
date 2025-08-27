@echo off
chcp 65001 >nul 2>&1
echo =====================================
echo   Podman K드라이브 포터블 실행
echo   완전 포터블 컨테이너 환경
echo =====================================
echo.

REM Podman 환경 변수 설정
set CONTAINERS_STORAGE_CONF=K:\PortableApps\Claude-Code\tools\podman\storage.conf
set CONTAINERS_CONF=K:\PortableApps\Claude-Code\tools\podman\containers.conf

REM Podman 머신 시작
echo [*] Podman 머신 시작 중...
"C:\Program Files\RedHat\Podman\podman.exe" machine start

if %errorLevel% == 0 (
    echo [+] Podman 머신 시작 완료!
    echo.
    echo     웹 접근: http://localhost:5678
    echo     Docker API: npipe:////./pipe/docker_engine
    echo.
    echo [*] n8n 컨테이너 실행하시겠습니까? (Y/N)
    choice /c YN /n
    if errorlevel 2 goto end
    if errorlevel 1 (
        echo [*] n8n 컨테이너 실행 중...
        "C:\Program Files\RedHat\Podman\podman.exe" run -d --name n8n-portable -p 5678:5678 -v K:\PortableApps\Claude-Code\data\n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n
        echo [+] n8n 실행 완료! http://localhost:5678 접속 가능
    )
) else (
    echo [-] Podman 머신 시작 실패
)

:end
pause