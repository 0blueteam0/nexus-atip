---
type: worklog
status: draft
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
---

# Worklog

## 1. 작업 맥락

이 작업은 어떤 사용자 요청에서 시작됐는가?
이전 작업과 어떻게 연결되는가?
이번 작업이 성공하면 무엇이 달라지는가?

## 2. 회수한 기존 지식

읽은 MOC, handoff, qmd 검색 결과, 관련 문서를 기록한다.

## 3. 도구 선택

사용한 도구와 대안을 기록한다.
왜 이 도구를 선택했는지 설명한다.

## 4. 실행 기록

명령, 파일 수정, 수집, 분석을 시간순으로 적는다.
`ran` 같은 표현 대신 command, exit_code, artifact_path를 기록한다.

## 5. 실패와 수정

실패한 시도와 원인을 적는다.

## 6. 판단과 통찰

작업 중 내린 판단과 사용자에게 제안할 만한 통찰을 적는다.

## 7. 검증

테스트, 빌드, 문서 검증, 인코딩 검증 결과를 적는다.

## 8. 다음 작업

다음 사람이 무엇부터 해야 하는지 적는다.

# Worklog

- Started knowledge workflow session.
- Confirmed SPEC 23 names Bandit and Semgrep for Python static security inspection.
- Checked Semgrep current official release: 1.168.0.
- Attempted direct install into project `.venv`; detected dependency conflicts.
- Removed Semgrep from project `.venv` and restored conflicting package versions.
- Created isolated Semgrep tool venv under `고도화/tool-runtimes`.
- Added Semgrep local sample workspace, rule, manifest, runtime profile, preset, normalizer, and analyst agent.
- Added command availability mapping for isolated `semgrep.exe`.
- Updated regression tests and plan documents.
- Verified compile, tests, frontend contracts, real Semgrep scan, and governed Semgrep+Bandit API smoke.
