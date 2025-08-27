# @dev-rules.md - 개발 규칙 및 코딩 표준

## 📋 프로젝트 관리
- 시작: 항상 project_plan.md 파일 생성
- 진행: 각 작업 완료 시 project_plan.md 업데이트
- 백업: 매일 K:\PortableApps\Claude-Code\backup에 백업
- 실행 위치: 항상 K드라이브에서 작업

## 코딩 규칙
- 로그: 모든 이벤트에 console.log 추가
- 에러 처리: try-catch 블록 필수
- 주석: 복잡한 로직에는 상세 주석
- 테스트: 기능 구현 후 즉시 테스트
- 로그 파일: K:\PortableApps\Claude-Code\logs 폴더에 저장

## Git 워크플로우
1. .git이 없으면 git init
2. .gitignore 설정 (node_modules/, logs/, vendor/)
3. 기능 개발: git checkout -b feature/기능명
4. 작업 완료: git add . && git commit -m "feat: 설명"
5. 병합: git checkout main && git merge feature/기능명

## 파일 작업 순서
1. 현재 내용 확인: 파일 읽기
2. 수정 계획: dryRun: true로 테스트
3. 검토: diff 확인
4. 적용: 실제 수정
5. 커밋: git add && commit

## 성능 최적화
- 파일 크기: 18KB 초과 시 분할
- 병렬 처리: 다중 도구 동시 실행
- 캐시 활용: 반복 작업 최소화