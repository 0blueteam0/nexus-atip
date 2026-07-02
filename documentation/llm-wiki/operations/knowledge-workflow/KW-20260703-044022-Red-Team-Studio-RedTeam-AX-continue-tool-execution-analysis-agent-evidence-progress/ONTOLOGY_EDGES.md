# Ontology Edges

- close_operating_toolchain_artifact_manifest_e2e -> enforces -> six_required_tool_artifact_coverage
- six_required_tool_artifact_coverage -> includes -> Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP
- missing_required_tool_ids -> blocks -> operating_collection_e2e_complete
- operating_collection_e2e_complete -> requires -> Evidence approval, Finding promotion, severity approval, Matrix ready, Report export, completion gate
