# Evidence Units

## EU-001 ChatGPT 공유 링크
- command/tool: browser_navigate + browser_console
- source_url: https://chatgpt.com/share/6a211cbf-28a8-83a5-9036-5cce56af8972
- evidence: 본문에서 보험 FDS 8개 레이어, 실손 서류/필드/탐지 포인트 확인
- verified_at: 2026-06-04T15:53:10.687907+09:00

## EU-002 Firecrawl 상태
- command: python urllib localhost:3002
- exit_code: 0
- evidence: http://localhost:3002/ returns 200 Firecrawl API, /v1/scrape sample POST failed 500
- verified_at: 2026-06-04T15:53:10.687907+09:00

## EU-003 Hugging Face API 후보
- command: https://huggingface.co/api/datasets search/detail via terminal
- exit_code: 0 for HF API checks
- evidence: receipt/invoice/medical receipt 후보 및 tags/files 확인
- verified_at: 2026-06-04T15:53:10.687907+09:00

## EU-004 공식/준공식 URL reachability
- command: urllib requests to silson24, consumer.knia, kidi, hira, nhis, mohw
- exit_code: 0
- evidence: 주요 사이트 200 응답, FSC는 SSL EOF로 제한
- verified_at: 2026-06-04T15:53:10.687907+09:00

## EU-005 생성 artifact 검증
- command/tool: execute_code JSON parse
- exit_code: success
- artifact_paths:
  - J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/INSURANCE_FDS_DATA_PLAN.md
  - J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/source_catalog.json
  - J:/PortableApps/genai/documentation/llm-wiki/projects/insurance-fds-data/dataset_schema.json
  - J:/PortableApps/genai/data/insurance-fds-seed/manifests/insurance_fds_source_manifest.json
  - J:/PortableApps/genai/data/insurance-fds-seed/synthetic/NO/NO_SYN_MEDICAL_RECEIPT_0001.json
  - J:/PortableApps/genai/data/insurance-fds-seed/synthetic/NO/NO_SYN_MEDICAL_DETAIL_STATEMENT_0002.json
  - J:/PortableApps/genai/data/insurance-fds-seed/synthetic/AF/AF_SYN_MEDICAL_RECEIPT_AMOUNT_MISMATCH_0001.json
  - J:/PortableApps/genai/data/insurance-fds-seed/synthetic/AF/AF_SYN_CROSSDOC_DATE_VIOLATION_0002.json
  - J:/PortableApps/genai/data/insurance-fds-seed/public_case_labels/FK/FK_PUBLIC_PATTERN_FORGED_MEDICAL_RECEIPT_0001.json
