# Ontology Edges

edge: Dataset Case Spec Plan -> generates -> Test Case Matrix Addendum
command: python implementation_seed/scripts/doc_addendum_generator.py > implementation_seed/reports/doc_addendum_generator_v0.stdout.json
exit_code: 0
artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/AI_SOC_Agent_Service_14_테스트케이스_보강매트릭스.md
verified_at: 2026-06-02T16:20:48+09:00

edge: Dataset Case Spec Plan -> informs -> Technical Design Addendum
command: python implementation_seed/scripts/doc_addendum_generator.py > implementation_seed/reports/doc_addendum_generator_v0.stdout.json
exit_code: 0
artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/AI_SOC_Agent_Service_20_기술스택_상세설계_보강.md
verified_at: 2026-06-02T16:20:48+09:00

edge: DocAddendumGenerator -> writes -> DOCX Addenda
command: docx zip verification
exit_code: 0
artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/docx/14_테스트케이스_보강매트릭스.docx
verified_at: 2026-06-02T16:21+09:00
