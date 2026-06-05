# V4 Reference Calibration Notes

## 목적

이 문서는 `claim_fds_v3_pipeline`을 v4 reference-calibrated synthetic lab으로 전환하면서, 실제 이미지에 더 가까운 충실도를 얻기 위한 작업방식과 사고방식을 기록한다. 실제 참조 이미지는 안전한 통계 추정에만 사용하며, 원본 픽셀/텍스트/기관 식별자는 synthetic 산출물에 복사하지 않는다.

## 실제 참조 이미지에서 관찰한 안전한 시각 특성

`A3Work/FDSWork/Real Image`에는 세로형 스캔/사진, 가로 crop, 낮은 해상도 캡처, 청색/흑백 영수증, 도장 흔적, 표가 매우 조밀한 세부내역형 이미지가 섞여 있다. contact sheet 관찰 기준으로 다음 특성이 중요하다.

- 문서 전체가 항상 A4 정중앙에 놓이지 않는다. 일부는 phone photo crop, 일부는 가로로 잘린 screenshot/crop이다.
- 표 line density가 v3보다 다양하다. 실제 이미지는 행/열 간격이 좁고 글자 크기가 매우 작거나, 반대로 일부 영수증은 큰 셀과 두꺼운 파란 선을 쓴다.
- 종이/배경 tone이 균일하지 않다. 나무 책상, 회색 배경, 스캔 앱 밝기 보정, JPEG 압축, 조명 그림자가 보인다.
- 도장/확인 표시는 항상 같은 위치가 아니다. 원형 stamp, 빨간 mark, 흐린 watermark가 일부 이미지에 있다.
- 실제 이미지 중 일부는 low contrast 또는 과도하게 작아 OCR/검출 난도가 높다.

## Hermes Agent가 더 좋은 방식을 찾을 수 있었던 사고 경로

### 경로 A: 원본 복제 욕구를 버리고 분포 학습으로 전환

잘못된 접근은 실제 이미지를 따라 그리거나 OCR로 텍스트를 재사용하는 것이다. 이 방식은 저작권/PII/실제 제출 가능성 위험을 만든다. 더 좋은 접근은 이미지 자체를 복사하지 않고 다음과 같은 통계만 가져오는 것이다.

- page aspect ratio distribution
- foreground coverage ratio
- brightness/contrast/noise distribution
- line thickness and table density histogram
- stamp color/position distribution
- crop/perspective/skew distribution

이 경로가 `reference_profiler.py`와 `template_family.py`로 구현되었다.

### 경로 B: 생성기를 문서 하나가 아니라 claim bundle graph로 보기

FDS 학습 가치는 단일 이미지의 모양보다 문서 간 의미 edge에서 커진다. 그래서 receipt, detail statement, prescription, pharmacy receipt를 하나의 claim graph로 묶고, clean은 모든 edge가 통과하고 tampered는 의도한 edge만 실패해야 한다.

현재 v4는 `RECEIPT_DETAIL_TOTAL_MISMATCH` edge를 구현했다. 다음에는 prescription/pharmacy/date/provider/drug-line edge가 추가되어야 한다.

### 경로 C: 위변조를 pixel artifact가 아니라 field-level counterfactual로 보기

큰 흰 박스 overlay는 모델이 artifact만 배우게 만든다. 더 좋은 방식은 clean image의 동일 bbox를 source of truth로 삼고, 그 bbox 안에서만 post-scan local patch를 생성하고 mask를 낸 뒤 semantic edge를 깨뜨리는 것이다.

현재 v4 quality gate는 tamper mask가 changed field bbox 내부에 양성 픽셀을 갖는지 검사한다. 다음에는 outside-mask diff tolerance까지 추가해야 한다.

### 경로 D: 실제와 유사하지만 제출 불가능한 fictional realism

마스킹/검은 박스는 데이터 품질을 낮추고 OCR/KIE 모델에 shortcut을 준다. 대신 모든 값 자체를 허구로 생성하되, 실제 문서에서 관찰되는 시각/통계 분포를 반영한다.

- 기관명: 실제 상호가 아니라 `가람모의의료센터` 같은 명백한 허구 token 사용
- 번호: 실제 형식처럼 보이는 유효번호가 아니라 `000-00-00000`, `SYN-*`처럼 무효 token 사용
- 계좌/환자/면허: 유효성 검증을 통과할 수 없는 synthetic pattern 사용
- 공개 샘플: visible safe mark 유지
- 내부 학습 샘플: registry/provenance로 synthetic 표시, 픽셀 워터마크 shortcut 최소화

## 실제 이미지와 더 비슷하게 만드는 다음 구현안

1. `reference_profiler.py` 확장
   - table line orientation histogram
   - cell density per page area
   - red/blue stamp-like blob position histogram
   - paper/background crop bbox detection
   - JPEG quality estimate and blur estimate
   - scanner vs mobile vs screenshot classifier heuristic

2. `template_family.py` 확장
   - official dense receipt family
   - small pharmacy receipt family
   - phone photo cropped family
   - scan-app auto-cropped family
   - screenshot/portal capture family

3. renderer 확장
   - `pharmacy_receipt_renderer.py`
   - `prescription_renderer.py`
   - long table pagination for detail statement
   - stamp/watermark synthetic generator with fake stamp text only

4. tamper engine 확장
   - amount/date substitution
   - line insert/delete with bbox/mask
   - post-scan local patch with outside-mask pixel diff gate
   - cross-document mismatch
   - replay duplicate claim bundle

5. split/gate 확장
   - at least N claim pairs per split
   - no leakage across claim_pair/provider/template/device/attack
   - reject if validation/test empty
   - distribution distance report between synthetic output and reference profile

## 현재 v4 판정

현재 v4는 안전성과 검증 자동화의 기반은 갖췄지만, 시각 충실도는 아직 "공식 양식 기반 clean synthetic" 단계다. 실제 데이터에 더 가까워지려면 renderer 다양화와 capture profile 분포 확장이 다음 우선순위다.
