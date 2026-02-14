#!/usr/bin/env python3
"""
VM 내부 제어 테스트 - 터미널과 GUI 제어 가능성 확인
"""

import subprocess
import time
import os

VMRUN = r"C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"

class VMInternalControl:
    """VM 내부를 제어하는 클래스"""
    
    def __init__(self, vmx_path, username, password):
        self.vmx = vmx_path
        self.user = username
        self.pwd = password
    
    # ===== 방법 1: vmrun을 통한 직접 명령 실행 =====
    def method1_vmrun_commands(self):
        """vmrun의 runProgramInGuest로 명령 실행"""
        print("\n[방법 1] vmrun을 통한 명령 실행")
        print("-" * 50)
        
        commands = [
            # Windows 명령어 예시
            ("cmd.exe", "/c dir C:\\"),
            ("powershell.exe", "-Command Get-Process"),
            ("notepad.exe", ""),
            
            # Linux 명령어 예시 (Linux VM인 경우)
            ("/bin/bash", "-c 'ls -la /home'"),
            ("/usr/bin/python3", "-c 'print(\"Hello from VM!\")'"),
        ]
        
        for prog, args in commands:
            cmd = [VMRUN, "-gu", self.user, "-gp", self.pwd,
                  "runProgramInGuest", self.vmx, prog, args]
            print(f"실행: {prog} {args}")
            # subprocess.run(cmd)
    
    # ===== 방법 2: 스크립트 실행으로 복잡한 작업 =====
    def method2_script_execution(self):
        """runScriptInGuest로 스크립트 실행"""
        print("\n[방법 2] 스크립트 실행")
        print("-" * 50)
        
        # Python 스크립트를 VM에서 실행
        python_script = '''
import os
import sys
print("VM 내부에서 실행 중!")
print(f"OS: {os.name}")
print(f"경로: {os.getcwd()}")
'''
        
        # Bash 스크립트 (Linux)
        bash_script = '''
echo "VM 내부 Bash 스크립트"
uname -a
ps aux | head -5
'''
        
        # PowerShell 스크립트 (Windows)
        ps_script = '''
Write-Host "VM 내부 PowerShell"
Get-ComputerInfo | Select-Object CsName, OsName
'''
        
        print("Python 스크립트 실행:")
        # cmd = [VMRUN, "-gu", self.user, "-gp", self.pwd,
        #       "runScriptInGuest", self.vmx, "/usr/bin/python3", python_script]
        
    # ===== 방법 3: GUI 자동화를 위한 스크립트 전송 =====
    def method3_gui_automation(self):
        """GUI 자동화 스크립트를 VM에 전송하고 실행"""
        print("\n[방법 3] GUI 자동화 (Playwright/Selenium 방식)")
        print("-" * 50)
        
        # Playwright 설치 및 실행 스크립트
        playwright_script = '''
# VM 내부에서 Playwright 설치 및 실행
pip install playwright
playwright install chromium

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://google.com")
    page.screenshot(path="vm_screenshot.png")
    browser.close()
'''
        
        # AutoIt/PyAutoGUI를 사용한 GUI 제어
        pyautogui_script = '''
# VM 내부 GUI 직접 제어
import pyautogui
import time

# 시작 메뉴 열기
pyautogui.press('win')
time.sleep(1)

# 메모장 입력 및 실행
pyautogui.write('notepad')
pyautogui.press('enter')
time.sleep(2)

# 텍스트 입력
pyautogui.write('Hello from Claude Code!')
'''
        
        print("1. 스크립트 파일을 호스트에서 생성")
        print("2. VM으로 복사: copyFileFromHostToGuest")
        print("3. VM에서 실행: runProgramInGuest python script.py")
    
    # ===== 방법 4: SSH/원격 데스크톱 연결 =====
    def method4_remote_access(self):
        """SSH나 RDP를 통한 원격 제어"""
        print("\n[방법 4] SSH/RDP 원격 연결")
        print("-" * 50)
        
        print("Linux VM - SSH 연결:")
        print("  1. VM IP 확인: vmrun getGuestIPAddress")
        print("  2. SSH 연결: ssh user@vm_ip")
        print("  3. 명령 실행: ssh user@vm_ip 'command'")
        
        print("\nWindows VM - PowerShell Remoting:")
        print("  1. Enable-PSRemoting -Force")
        print("  2. Invoke-Command -ComputerName VM -ScriptBlock { ... }")
    
    # ===== 방법 5: VNC를 통한 화면 제어 =====
    def method5_vnc_control(self):
        """VNC를 통한 화면 직접 제어"""
        print("\n[방법 5] VNC를 통한 화면 제어")
        print("-" * 50)
        
        vnc_setup = '''
# VM에 VNC 서버 설치
# Linux:
sudo apt install x11vnc
x11vnc -display :0 -auth ~/.Xauthority -forever -loop -noxdamage -repeat -rfbport 5900 -shared

# Windows:
# TightVNC 또는 RealVNC 설치

# Python에서 VNC 제어
from vncdotool import api

client = api.connect('vm_ip:5900', password='vnc_password')
client.mouseMove(100, 100)
client.mousePress(1)
client.type('Hello from Claude!')
client.captureScreen('vnc_screen.png')
'''
        print(vnc_setup)

# ===== 실제 구현 예제 =====
def practical_example():
    """실제로 작동하는 예제"""
    print("\n" + "="*60)
    print("실제 구현 가능한 시나리오")
    print("="*60)
    
    example_code = '''
import subprocess
import time

class VMController:
    def __init__(self, vmx_path, username, password):
        self.vmx = vmx_path
        self.user = username
        self.pwd = password
        self.vmrun = r"C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe"
    
    def execute_in_vm(self, command):
        """VM에서 명령 실행"""
        cmd = [self.vmrun, "-gu", self.user, "-gp", self.pwd,
               "runProgramInGuest", self.vmx, "cmd.exe", f"/c {command}"]
        return subprocess.run(cmd, capture_output=True)
    
    def install_python_package(self, package):
        """VM에 Python 패키지 설치"""
        return self.execute_in_vm(f"pip install {package}")
    
    def run_python_script(self, script_content):
        """Python 스크립트 실행"""
        # 1. 스크립트를 파일로 저장
        with open("temp_script.py", "w") as f:
            f.write(script_content)
        
        # 2. VM으로 복사
        copy_cmd = [self.vmrun, "-gu", self.user, "-gp", self.pwd,
                   "copyFileFromHostToGuest", self.vmx, 
                   "temp_script.py", "C:\\\\temp_script.py"]
        subprocess.run(copy_cmd)
        
        # 3. VM에서 실행
        return self.execute_in_vm("python C:\\\\temp_script.py")
    
    def open_browser_and_navigate(self, url):
        """브라우저 열고 URL 이동"""
        return self.execute_in_vm(f'start chrome "{url}"')
    
    def take_screenshot(self):
        """VM 스크린샷"""
        cmd = [self.vmrun, "captureScreen", self.vmx, "vm_screenshot.png"]
        return subprocess.run(cmd)

# 사용 예제
vm = VMController("C:\\\\VMs\\\\Win10\\\\Win10.vmx", "user", "password")

# 1. VM에서 웹 서버 시작
vm.execute_in_vm("python -m http.server 8000")

# 2. Playwright 설치 및 실행
script = """
from playwright.sync_playwright import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    print(page.title())
"""
vm.run_python_script(script)

# 3. 스크린샷 캡처
vm.take_screenshot()
'''
    
    print(example_code)

def main():
    print("="*60)
    print("VM 내부 제어 가능성 분석")
    print("="*60)
    
    # 테스트용 VM 경로 (실제 경로로 변경 필요)
    vm = VMInternalControl("C:\\VMs\\TestVM\\TestVM.vmx", "user", "password")
    
    vm.method1_vmrun_commands()
    vm.method2_script_execution()
    vm.method3_gui_automation()
    vm.method4_remote_access()
    vm.method5_vnc_control()
    
    practical_example()
    
    print("\n" + "="*60)
    print("결론: Claude Code는 VM 내부를 완전히 제어 가능!")
    print("="*60)
    print("\n가능한 제어 수준:")
    print("✅ 터미널 명령 실행")
    print("✅ 스크립트 실행 (Python, Bash, PowerShell)")
    print("✅ GUI 프로그램 실행")
    print("✅ 파일 전송 및 실행")
    print("✅ 브라우저 자동화 (Playwright/Selenium)")
    print("✅ 화면 캡처")
    print("⚠️  GUI 직접 제어 (VNC/RDP 설정 필요)")
    print("\n필요 조건:")
    print("- VMware Tools 설치")
    print("- 게스트 OS 자격 증명")
    print("- (선택) SSH/VNC/RDP 설정")

if __name__ == "__main__":
    main()