---
title: 보험 FDS 실손 청구서류 위조탐지 데이터 수집/생성 계획
created_at: 2026-06-04T15:52:15.792423+09:00
project: insurance-fds-data
para_role: Projects
zettel_type: plan
status: draft_seed
source_url:
  - https://chatgpt.com/share/6a211cbf-28a8-83a5-9036-5cce56af8972
  - https://consumer.knia.or.kr/m/consumer/insurance-guide/0202.do
  - https://www.silson24.or.kr/claim/web/
collected_via: Hermes Codex browser/terminal/delegate_task
verification_status: initial_verified_urls_and_hf_api_partial
---

# 보험 FDS 실손 청구서류 위조탐지 데이터 수집/생성 계획

## 1. 목표
실손보험 청구에 필요한 보험금청구서, 진료비 영수증, 진료비 세부산정내역서, 처방전, 진단서/입퇴원확인서 등 문서 패키지를 대상으로 정상(NO), 공개 위조/변조 라벨(FK), 합성(AF) 데이터를 구축한다.

## 2. 네이밍 규칙
- `NO_`: 정상 공개/합법 문서 또는 정상 라벨 데이터.
- `FK_`: 공개 위조/변조/사기 라벨 데이터 또는 공개 사례 추상화. 실제 PII와 사기 수행 절차는 제외한다.
- `AF_`: 인공/합성 데이터. 실제 기관/환자/계좌/식별번호와 혼동되지 않도록 fake flag를 둔다.

## 3. 1차 수집 후보
세부 JSON: `source_catalog.json`, `dataset_schema.json`

우선순위:
1. `NO_CORD`, `NO_SROIE`, `NO_HF_RECEIPT`: 정상 영수증 OCR/KIE baseline.
2. `FK_DOCTAMPER`, `FK_COPYMOVE`: 문서 변조/복제 탐지 baseline.
3. `AF_SYN_MEDICAL_CLAIM_PACKAGE`: 실손 도메인 교차정합성 및 위변조 라벨 보강.
4. `NO_KNIA_SILSON_DOC_STANDARD`, `NO_SILSON24`: 필요서류/전자청구 제도 기반 스키마 검증.

## 4. FDS 탐지 아이디어
- 단일 문서: 금액 합계, 날짜 순서, 발행기관 식별자, 영수증번호 중복, 폰트/레이아웃/압축 흔적, 서명/직인 재사용.
- 문서 간: 영수증-세부내역서 합계, 처방전-약제비 영수증, 진단서-입퇴원확인서-영수증 기간, 청구서 계좌/수익자 관계.
- 네트워크: 동일 계좌/기기/IP/병원/약국/모집인/청구 패턴 클러스터.
- 모델링: OCR/KIE + 룰 엔진 + 그래프 이상탐지 + 이미지 변조 segmentation + evidence package 기반 human-review.

## 5. 데이터 윤리/보안 경계
- 실제 PII, 실제 주민등록번호, 실제 계좌, 실제 신분증 이미지는 수집하지 않는다.
- 실제 위조 방법을 상세 재현하지 않고, 방어적 라벨과 검증 규칙만 저장한다.
- 공개 데이터셋도 라이선스/상업 이용/재배포 조건을 다운로드 전 확인한다.

## 6. 생성된 seed artifact
- `J:\PortableApps\genai\data\insurance-fds-seed\manifests\insurance_fds_source_manifest.json`
- `J:\PortableApps\genai\data\insurance-fds-seed\synthetic\NO`
- `J:\PortableApps\genai\data\insurance-fds-seed\synthetic\AF`
- `J:\PortableApps\genai\data\insurance-fds-seed\public_case_labels\FK`

## 7. 다음 실행 단계
1. KNIA/실손24/FSC/HIRA/NHIS/law.go.kr 세부 페이지를 Firecrawl 또는 브라우저로 재수집한다.
2. HF 데이터셋별 라이선스와 샘플 파일을 다운로드 전 재검증한다.
3. 합성 PDF/PNG 렌더러를 추가해 JSON seed를 실제 문서 이미지로 변환하고 OCR round-trip 평가를 붙인다.
4. `NO/FK/AF` 통합 manifest와 train/val/test split 정책을 만든다.
