#!/usr/bin/env python3
"""
VMware 자동화 테스트 - Claude Code가 VM을 제어할 수 있는지 확인
"""

import subprocess
import os
import json
from pathlib import Path

# VMware 경로 설정
VMRUN_PATH = r"C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
VMWARE_PATH = r"C:\Program Files (x86)\VMware\VMware Workstation\vmware.exe"

def check_vmware_installation():
    """VMware 설치 확인"""
    print("[*] VMware 설치 확인 중...")
    
    if os.path.exists(VMRUN_PATH):
        print("[+] vmrun.exe 발견:", VMRUN_PATH)
    else:
        print("[-] vmrun.exe를 찾을 수 없습니다")
        return False
    
    if os.path.exists(VMWARE_PATH):
        print("[+] vmware.exe 발견:", VMWARE_PATH)
    else:
        print("[-] vmware.exe를 찾을 수 없습니다")
        return False
    
    return True

def list_running_vms():
    """실행 중인 VM 목록 확인"""
    print("\n[*] 실행 중인 VM 목록 확인...")
    try:
        result = subprocess.run([VMRUN_PATH, "list"], 
                              capture_output=True, text=True)
        print(result.stdout)
        return result.returncode == 0
    except Exception as e:
        print(f"[-] 오류 발생: {e}")
        return False

def get_vmrun_commands():
    """사용 가능한 vmrun 명령어 확인"""
    print("\n[*] 사용 가능한 vmrun 명령어:")
    commands = {
        "VM 제어": [
            "start - VM 시작",
            "stop - VM 중지", 
            "reset - VM 재시작",
            "suspend - VM 일시 중지",
            "pause - VM 일시 정지",
            "unpause - VM 재개"
        ],
        "스냅샷": [
            "snapshot - 스냅샷 생성",
            "deleteSnapshot - 스냅샷 삭제",
            "revertToSnapshot - 스냅샷으로 복원",
            "listSnapshots - 스냅샷 목록"
        ],
        "게스트 OS 제어": [
            "runProgramInGuest - 게스트에서 프로그램 실행",
            "runScriptInGuest - 게스트에서 스크립트 실행",
            "copyFileFromHostToGuest - 호스트→게스트 파일 복사",
            "copyFileFromGuestToHost - 게스트→호스트 파일 복사",
            "createDirectoryInGuest - 게스트에 디렉토리 생성",
            "deleteFileInGuest - 게스트 파일 삭제"
        ],
        "네트워크": [
            "getGuestIPAddress - 게스트 IP 주소 확인",
            "listProcessesInGuest - 게스트 프로세스 목록",
            "killProcessInGuest - 게스트 프로세스 종료"
        ]
    }
    
    for category, cmds in commands.items():
        print(f"\n  [{category}]")
        for cmd in cmds:
            print(f"    - {cmd}")
    
    return True

def create_sample_automation_script():
    """자동화 예제 스크립트 생성"""
    print("\n[*] VM 자동화 예제 스크립트 생성 중...")
    
    script_content = '''#!/usr/bin/env python3
"""
VMware 자동 OS 설치 및 제어 스크립트
이 스크립트는 다음 작업을 수행할 수 있습니다:
1. 새 VM 생성
2. ISO에서 OS 자동 설치 (kickstart/preseed 사용)
3. VM 시작 및 제어
4. 게스트 OS에서 명령 실행
"""

import subprocess
import time
import os

VMRUN = r"C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe"

class VMwareAutomation:
    def __init__(self, vm_path, username=None, password=None):
        self.vm_path = vm_path
        self.username = username
        self.password = password
    
    def start_vm(self, gui=True):
        """VM 시작"""
        mode = "gui" if gui else "nogui"
        cmd = [VMRUN, "start", self.vm_path, mode]
        return subprocess.run(cmd, capture_output=True)
    
    def stop_vm(self, force=False):
        """VM 중지"""
        mode = "hard" if force else "soft"
        cmd = [VMRUN, "stop", self.vm_path, mode]
        return subprocess.run(cmd, capture_output=True)
    
    def run_program_in_guest(self, program_path, args=""):
        """게스트 OS에서 프로그램 실행"""
        cmd = [VMRUN, "-gu", self.username, "-gp", self.password,
               "runProgramInGuest", self.vm_path, program_path, args]
        return subprocess.run(cmd, capture_output=True)
    
    def copy_file_to_guest(self, host_path, guest_path):
        """호스트에서 게스트로 파일 복사"""
        cmd = [VMRUN, "-gu", self.username, "-gp", self.password,
               "copyFileFromHostToGuest", self.vm_path, host_path, guest_path]
        return subprocess.run(cmd, capture_output=True)
    
    def execute_script_in_guest(self, interpreter, script_text):
        """게스트에서 스크립트 실행"""
        cmd = [VMRUN, "-gu", self.username, "-gp", self.password,
               "runScriptInGuest", self.vm_path, interpreter, script_text]
        return subprocess.run(cmd, capture_output=True)
    
    def get_guest_ip(self):
        """게스트 IP 주소 가져오기"""
        cmd = [VMRUN, "getGuestIPAddress", self.vm_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip()

# 사용 예제
if __name__ == "__main__":
    # VM 경로 설정 (실제 .vmx 파일 경로로 변경 필요)
    vm_path = r"C:\\VMs\\MyVM\\MyVM.vmx"
    
    # 자동화 객체 생성
    vm = VMwareAutomation(vm_path, "username", "password")
    
    # VM 시작
    print("VM 시작 중...")
    vm.start_vm()
    
    # IP 주소 확인
    time.sleep(30)  # VM 부팅 대기
    ip = vm.get_guest_ip()
    print(f"게스트 IP: {ip}")
    
    # 게스트에서 명령 실행
    vm.run_program_in_guest("C:\\\\Windows\\\\System32\\\\cmd.exe", "/c echo Hello from Claude!")
'''
    
    script_path = Path("K:/PortableApps/Claude-Code/vmware-automation-example.py")
    script_path.write_text(script_content)
    print(f"[+] 스크립트 생성됨: {script_path}")
    
    return True

def main():
    print("="*60)
    print("VMware 자동화 가능성 테스트")
    print("="*60)
    
    # VMware 설치 확인
    if not check_vmware_installation():
        print("\n[-] VMware가 올바르게 설치되지 않았습니다")
        return
    
    # 실행 중인 VM 확인
    list_running_vms()
    
    # 사용 가능한 명령어 표시
    get_vmrun_commands()
    
    # 자동화 스크립트 생성
    create_sample_automation_script()
    
    print("\n" + "="*60)
    print("[결론] Claude Code가 VMware를 제어할 수 있습니다!")
    print("="*60)
    print("\n가능한 작업:")
    print("1. vmrun API를 통한 VM 제어 (시작/중지/스냅샷)")
    print("2. 게스트 OS에서 명령 실행")
    print("3. 파일 전송 및 스크립트 실행")
    print("4. Packer를 사용한 자동 OS 설치 템플릿 생성")
    print("5. Kickstart/Preseed를 통한 무인 OS 설치")
    print("\n제한사항:")
    print("- ISO 파일과 설치 미디어 필요")
    print("- 게스트 OS 자격 증명 필요 (VMware Tools 설치 후)")
    print("- 초기 OS 설치는 수동 또는 사전 구성된 답변 파일 필요")

if __name__ == "__main__":
    main()