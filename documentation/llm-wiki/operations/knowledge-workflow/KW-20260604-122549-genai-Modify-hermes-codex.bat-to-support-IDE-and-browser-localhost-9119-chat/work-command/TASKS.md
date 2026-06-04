# TASKS

- Task: Modify `hermes-codex.bat` launcher for browser chat support.
  - status: completed
  - artifact_path: `J:/PortableApps/genai/hermes-codex.bat`
  - verification_command: `cmd.exe //C "J:\PortableApps\genai\hermes-codex.bat --chat"`
  - exit_code: 0

- Task: Preserve IDE/CLI invocation compatibility.
  - status: completed
  - evidence: Existing `call "%HERMES_EXE%" %*` forwarding path remains in the file.
  - verification_command: `cmd.exe //C "J:\PortableApps\genai\hermes-codex.bat --where"`
  - exit_code: 0
