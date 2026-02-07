# Ralph Wiggum Autonomous Loop Skill

> **키워드**: "자율 루프", "autonomous loop", "반복 개선", "ralph wiggum", "자동 코딩"
> **난이도**: 고급
> **출처**: aisparkup.com - Ralph Wiggum 자율 코딩 기법

---

## 개요

Ralph Wiggum 기법은 Claude Code를 무한 루프에서 실행하여 자율적으로 코드를 개선하는 패턴입니다.
`PROMPT.md` 파일을 반복적으로 실행하며, 테스트 기반 품질 보증을 통해 안전하게 동작합니다.

---

## 핵심 패턴

### 기본 루프 명령어

```bash
# 기본 루프 (무한 반복)
while :; do cat PROMPT.md | claude-code ; done

# 횟수 제한 루프 (5회)
for i in {1..5}; do cat PROMPT.md | claude-code ; done

# 조건부 루프 (테스트 실패 시 계속)
while ! npm test; do cat PROMPT.md | claude-code ; done
```

### 안전 장치

| 장치 | 설명 |
|------|------|
| **테스트 기반** | 모든 변경은 테스트 통과 필수 |
| **커밋 게이트** | 테스트 통과 시만 자동 커밋 |
| **롤백 지점** | 각 반복 전 Git 스냅샷 |
| **시간 제한** | timeout 명령어로 무한 실행 방지 |

---

## PROMPT.md 템플릿

### 기본 템플릿

```markdown
# Task: [작업 설명]

## 목표
[구체적인 목표 기술]

## 제약 조건
- 테스트 통과 필수
- 기존 기능 유지
- 문서 업데이트

## 완료 조건
1. 모든 테스트 통과
2. lint 오류 없음
3. 변경 사항 커밋

## 실행 후
- 테스트 실패 시: 오류 수정 후 재시도
- 테스트 통과 시: "TASK_COMPLETE" 출력
```

### 고급 템플릿 (TDD 기반)

```markdown
# TDD Loop: [기능명]

## 현재 상태
- 실패 테스트: `npm test 2>&1 | grep FAIL`
- 커버리지: `npm run coverage`

## 지시사항
1. 실패 테스트 분석
2. 최소 코드로 테스트 통과
3. 리팩토링 (테스트 유지)
4. 다음 테스트로 이동

## 종료 조건
모든 테스트 통과 시 "ALL_TESTS_PASS" 출력
```

---

## 워크플로우

### Phase 1: 준비
```bash
# 1. 작업 디렉토리 설정
cd /path/to/project

# 2. PROMPT.md 작성
cat > PROMPT.md << 'EOF'
[템플릿 내용]
EOF

# 3. 테스트 환경 확인
npm test  # 또는 pytest, go test 등
```

### Phase 2: 안전 루프 실행
```bash
# 타임아웃 + 횟수 제한 + 로깅
for i in {1..10}; do
  echo "=== Iteration $i ===" | tee -a loop.log
  timeout 300 bash -c 'cat PROMPT.md | claude-code' 2>&1 | tee -a loop.log

  # 완료 조건 확인
  if grep -q "TASK_COMPLETE\|ALL_TESTS_PASS" loop.log; then
    echo "Task completed at iteration $i"
    break
  fi

  sleep 5  # 쿨다운
done
```

### Phase 3: 검증
```bash
# 테스트 최종 확인
npm test

# 변경 사항 리뷰
git diff --stat

# 커밋 (테스트 통과 시)
git add -A && git commit -m "Ralph Wiggum: automated improvements"
```

---

## 안전 가이드라인

### 필수 체크리스트
- [ ] 테스트 커버리지 80% 이상
- [ ] PROMPT.md에 명확한 종료 조건
- [ ] Git 클린 상태에서 시작
- [ ] 타임아웃 설정 (5분 권장)
- [ ] 최대 반복 횟수 제한 (10회 권장)

### 금지 사항
```
[X] 프로덕션 환경에서 실행
[X] 인증/보안 코드 자동 수정
[X] 데이터베이스 직접 조작
[X] 외부 API 호출 자동화
```

### 권장 사용 케이스
```
[O] 리팩토링 (테스트 있는 코드)
[O] 버그 수정 (재현 테스트 작성 후)
[O] 코드 스타일 정리
[O] 테스트 커버리지 증가
```

---

## 고급 패턴

### 다단계 루프
```bash
# Phase 1: 테스트 작성
cat PROMPT-write-tests.md | claude-code

# Phase 2: 구현
while ! npm test; do
  cat PROMPT-implement.md | claude-code
done

# Phase 3: 리팩토링
cat PROMPT-refactor.md | claude-code
```

### 조건부 프롬프트 선택
```bash
if npm test 2>&1 | grep -q "TypeError"; then
  cat PROMPT-fix-types.md | claude-code
elif npm test 2>&1 | grep -q "undefined"; then
  cat PROMPT-fix-undefined.md | claude-code
else
  cat PROMPT-general.md | claude-code
fi
```

---

## 트러블슈팅

| 문제 | 해결책 |
|------|--------|
| 무한 루프 | 종료 조건 명확화, 타임아웃 추가 |
| 같은 오류 반복 | 프롬프트에 "다른 접근법 시도" 추가 |
| 테스트 불안정 | flaky 테스트 식별 및 격리 |
| 컨텍스트 손실 | 상태를 파일로 저장 (STATE.md) |

---

## 참조

- **원본 기사**: aisparkup.com - Ralph Wiggum 자율 코딩
- **관련 스킬**: vibe-coding (빠른 개발)
- **관련 도구**: Git hooks, CI/CD 통합

---

**버전**: 1.0.0
**작성일**: 2026-02-07
