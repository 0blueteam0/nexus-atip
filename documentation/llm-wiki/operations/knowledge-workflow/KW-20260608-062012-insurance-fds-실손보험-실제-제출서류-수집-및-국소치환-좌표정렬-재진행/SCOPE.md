# Scope

- project: insurance-fds
- task: 실손보험 실제 제출서류 수집 및 국소치환 좌표정렬 재진행
- goal: 이전 실패 지점 두 가지(실제 제출서류 원본 확보 실패, 국소치환 bbox 위치 정렬 실패)를 실제 파일/테스트/manifest로 해결한다.
- in_scope:
  - 보험사 청구서 양식 제외 게이트
  - 병원/약국 제출서류 PDF 후보 수집
  - PDF text-layer word bbox 기반 label/right-value target 추출
  - text-layer 없는 스캔/이미지형 PDF fallback bbox 추출
  - NO 가명값 채움 및 AF 동일좌표 국소치환
  - outside-target diff == 0 검증
  - contact sheet와 manifest 생성
- out_of_scope:
  - 실제 개인정보 문서 원본 승격
  - 사기 실행 절차/회피 레시피
  - 이미지 내부 shortcut label 삽입
