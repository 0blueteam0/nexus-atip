# Evidence Units

- id: EU-001
  command: python -m unittest implementation_seed.tests.test_doc_addendum_generator -v
  exit_code: 1
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/tests/test_doc_addendum_generator.py
  verified_at: 2026-06-02T16:19+09:00
  observation: RED failure due missing doc_addendum_generator.

- id: EU-002
  command: python -m unittest implementation_seed.tests.test_doc_addendum_generator -v
  exit_code: 0
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/scripts/doc_addendum_generator.py
  verified_at: 2026-06-02T16:20:48+09:00
  observation: 4 focused tests OK.

- id: EU-003
  command: python -m unittest discover -s implementation_seed/tests -v
  exit_code: 0
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/tests
  verified_at: 2026-06-02T16:22+09:00
  observation: 21 tests OK.

- id: EU-004
  command: python implementation_seed/scripts/doc_addendum_generator.py > implementation_seed/reports/doc_addendum_generator_v0.stdout.json
  exit_code: 0
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/reports/doc_addendum_generator_v0.stdout.json
  verified_at: 2026-06-02T16:20:48+09:00
  observation: generated 2 markdown addenda, 2 docx addenda, 11 test rows, 4 components.

- id: EU-005
  command: docx zip verification
  exit_code: 0
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/docx/14_테스트케이스_보강매트릭스.docx; J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/docx/20_기술스택_상세설계_보강.docx
  verified_at: 2026-06-02T16:21+09:00
  observation: both docx files have document.xml/styles.xml.
