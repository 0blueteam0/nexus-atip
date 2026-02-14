# Claude Code의 VMware 제어 능력 (MCP 서버 불필요)

## ✅ 현재 즉시 가능한 작업들

### 1. **Bash/명령 프롬프트를 통한 직접 제어**
```bash
# VM 목록 확인
"C:/Program Files (x86)/VMware/VMware Workstation/vmrun.exe" list

# VM 시작 (GUI 모드)
vmrun start "C:/VMs/Ubuntu/Ubuntu.vmx" gui

# VM 중지
vmrun stop "C:/VMs/Ubuntu/Ubuntu.vmx" soft

# 스냅샷 생성
vmrun snapshot "C:/VMs/Ubuntu/Ubuntu.vmx" "BeforeUpdate"

# 스냅샷 복원
vmrun revertToSnapshot "C:/VMs/Ubuntu/Ubuntu.vmx" "BeforeUpdate"
```

### 2. **Python 스크립트를 통한 자동화**
```python
import subprocess

# vmrun 명령 실행 함수
def vmrun_command(cmd_args):
    vmrun_path = r"C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
    full_cmd = [vmrun_path] + cmd_args
    return subprocess.run(full_cmd, capture_output=True, text=True)

# 사용 예시
result = vmrun_command(["list"])
print(result.stdout)
```

### 3. **게스트 OS 제어 (VMware Tools 설치 후)**
```bash
# 게스트에서 프로그램 실행
vmrun -gu username -gp password runProgramInGuest "vm.vmx" "C:/Windows/notepad.exe"

# 파일 복사
vmrun -gu user -gp pass copyFileFromHostToGuest "vm.vmx" "host.txt" "C:/guest.txt"

# 스크립트 실행
vmrun -gu user -gp pass runScriptInGuest "vm.vmx" "/bin/bash" "echo Hello"
```

## ⚠️ 제한사항

1. **초기 VM 생성**: VMware GUI나 명령줄 도구로 수동 생성 필요
2. **OS 자동 설치**: Kickstart/Preseed 파일 사전 준비 필요
3. **게스트 제어**: VMware Tools 설치 필수

## 💡 하지만 이것만으로도 충분!

- VM 시작/정지/재시작 ✅
- 스냅샷 관리 ✅
- 게스트 OS 명령 실행 ✅
- 파일 전송 ✅
- 네트워크 정보 확인 ✅
- 프로세스 관리 ✅

## 🚀 실제 사용 시나리오

1. **자동 백업 시스템**
   - 매일 VM 스냅샷 생성
   - 오래된 스냅샷 자동 삭제

2. **테스트 자동화**
   - VM 시작 → 소프트웨어 설치 → 테스트 실행 → 결과 수집 → VM 초기화

3. **개발 환경 관리**
   - 여러 VM 동시 제어
   - 환경 설정 자동화

## 결론
**MCP 서버 없이도 Claude Code는 VMware를 충분히 제어할 수 있습니다!**
subprocess, Bash 도구만으로 vmrun API를 통해 대부분의 VM 작업이 가능합니다.