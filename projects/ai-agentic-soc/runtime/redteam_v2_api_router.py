from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, Header, UploadFile

try:
    from runtime import redteam_v2_models
except ModuleNotFoundError:
    import redteam_v2_models  # type: ignore


router = APIRouter(prefix="/api/redteam/v2", tags=["redteam-v2"])


def with_actor_context(
    payload: dict[str, Any],
    actor_id: str | None,
    actor_role: str | None,
    session_token: str | None = None,
) -> dict[str, Any]:
    actor_context = redteam_v2_models.resolve_actor_context(
        payload,
        actor_id=actor_id,
        actor_role=actor_role,
        session_token=session_token,
    )
    return {
        **payload,
        "_actor_context": {
            **actor_context,
            "resolved": True,
        },
    }


@router.get("/health")
def redteam_v2_health() -> dict[str, Any]:
    return {
        "kind": "redteam_ax_v2_health",
        "service": "redteam-ax-v2",
        "status": "ready",
        "safe_by_default": True,
        "execution_policy": "tool_action_card_required",
        "high_risk_mode": "human_approved_manual_run",
        "report_gate": {
            "unsupported_claim_count": 0,
            "unapproved_high_risk_count": 0,
            "finding_without_evidence_count": 0,
            "unapproved_finding_count": 0,
            "unapproved_final_severity_count": 0,
        },
        "actor_context_provider": "local_dev_session_or_request_headers",
    }


@router.post("/auth/actor-context")
def resolve_actor_context(
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    context = redteam_v2_models.resolve_actor_context(
        payload,
        actor_id=x_redteam_actor,
        actor_role=x_redteam_actor_role,
        session_token=x_redteam_session,
    )
    return {
        "kind": "redteam_ax_v2_actor_context",
        "actor_context": context,
        "status": "authenticated" if context.get("authenticated") else "invalid",
        "errors": context.get("errors") or [],
    }


@router.get("/cases/{case_id}/rbac")
def get_case_rbac_policy(case_id: str) -> dict[str, Any]:
    return redteam_v2_models.case_rbac_policy(case_id)


@router.put("/cases/{case_id}/rbac")
def upsert_case_rbac_policy(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.upsert_case_rbac_policy(case_id, payload)


@router.post("/cases/{case_id}/rbac/assignments")
def add_case_rbac_assignment(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.add_case_rbac_assignment(case_id, payload)


@router.delete("/cases/{case_id}/rbac/assignments/{actor_id}")
def delete_case_rbac_assignment(case_id: str, actor_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return redteam_v2_models.delete_case_rbac_assignment(case_id, actor_id, payload)


@router.post("/roe/evaluate")
def evaluate_roe(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.evaluate_roe(payload)


@router.post("/tool-actions/plan")
def plan_tool_action(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.plan_tool_action(payload)


@router.get("/analysis-tools")
def list_analysis_tools() -> dict[str, Any]:
    return redteam_v2_models.list_analysis_tools()


@router.get("/analysis-agents")
def list_analysis_agents() -> dict[str, Any]:
    return redteam_v2_models.list_analysis_agents()


@router.get("/tool-install-readiness")
def list_tool_install_readiness() -> dict[str, Any]:
    return redteam_v2_models.list_tool_install_readiness()


@router.get("/tool-install-readiness/{tool_id}")
def get_tool_install_readiness(tool_id: str) -> dict[str, Any]:
    return redteam_v2_models.tool_install_readiness(tool_id)


@router.get("/tool-install-version-evidence")
def list_tool_install_version_evidence(case_id: str | None = None, tool_id: str | None = None) -> dict[str, Any]:
    return redteam_v2_models.list_tool_install_version_evidence(case_id=case_id, tool_id=tool_id)


@router.post("/tool-install-readiness/{tool_id}/version-evidence")
def record_tool_install_version_evidence(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.record_tool_install_version_evidence(tool_id, payload)


@router.get("/tool-credential-policies")
def list_tool_credential_policies() -> dict[str, Any]:
    return redteam_v2_models.list_tool_credential_policies()


@router.get("/tool-credential-policies/{tool_id}")
def get_tool_credential_policy(tool_id: str) -> dict[str, Any]:
    return redteam_v2_models.tool_credential_policy(tool_id)


@router.get("/tool-credential-authorizations")
def list_tool_credential_authorizations(case_id: str | None = None, tool_id: str | None = None) -> dict[str, Any]:
    return redteam_v2_models.list_tool_credential_authorizations(case_id=case_id, tool_id=tool_id)


@router.post("/tool-credential-authorizations/{tool_id}")
def authorize_tool_credential_reference(
    tool_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.authorize_tool_credential_reference(
        tool_id,
        with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session),
    )


@router.post("/scanner-service-imports/{tool_id}")
def import_scanner_service_report(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_scanner_service_report(tool_id, payload)


@router.get("/tool-wrapper-manifests")
def list_tool_wrapper_manifests() -> dict[str, Any]:
    return redteam_v2_models.list_tool_wrapper_manifests()


@router.get("/tool-wrapper-manifests/{tool_id}")
def get_tool_wrapper_manifest(tool_id: str) -> dict[str, Any]:
    return redteam_v2_models.tool_wrapper_manifest(tool_id)


@router.post("/tool-wrapper-pins/{tool_id}/request")
def request_tool_wrapper_pin(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.request_tool_wrapper_pin(tool_id, payload)


@router.post("/tool-wrapper-pins/{tool_id}/approve")
def approve_tool_wrapper_pin(
    tool_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_tool_wrapper_pin(tool_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/tool-wrapper-pins/{tool_id}/revoke")
def revoke_tool_wrapper_pin(
    tool_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.revoke_tool_wrapper_pin(tool_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.get("/tool-schemas")
def list_tool_schemas() -> dict[str, Any]:
    return redteam_v2_models.list_tool_schemas()


@router.post("/tool-schemas/{schema_id}/validate")
def validate_tool_schema(schema_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.validate_tool_schema_payload(schema_id, payload)


@router.post("/mcp/direct-invoke")
def guard_direct_mcp_invocation(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.guard_direct_mcp_invocation(payload)


@router.get("/tool-actions")
def list_tool_actions(case_id: str | None = None, status: str | None = None) -> dict[str, Any]:
    return redteam_v2_models.list_tool_actions(case_id=case_id, status=status)


@router.get("/tool-actions/{action_id}")
def get_tool_action(action_id: str, case_id: str | None = None) -> dict[str, Any]:
    action = redteam_v2_models.load_tool_action(action_id, case_id=case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_tool_action_card",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }
    return action


@router.post("/tool-actions/{action_id}/request-approval")
def request_tool_action_approval(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.request_tool_action_approval(action_id, payload)


@router.post("/tool-actions/{action_id}/approve")
def approve_tool_action(
    action_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_tool_action(action_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/tool-actions/{action_id}/manual-run-record")
def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.record_manual_run(action_id, payload)


@router.post("/tool-actions/{action_id}/execution-plan")
def create_tool_execution_plan(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.build_tool_execution_plan(action_id, payload)


@router.post("/runner-isolation-readiness")
def runner_isolation_readiness(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.runner_isolation_readiness(payload)


@router.get("/runtime-readiness")
def latest_runtime_readiness() -> dict[str, Any]:
    return redteam_v2_models.latest_runtime_readiness_status()


@router.post("/tool-actions/{action_id}/execute-governed")
def governed_tool_execution(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.governed_tool_execution(action_id, payload)


@router.post("/toolchains/execute-governed")
def governed_toolchain_execution(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.governed_toolchain_execution(payload)


@router.post("/toolchains/import-artifact-manifest")
def import_toolchain_artifact_manifest(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_toolchain_artifact_manifest(payload)


@router.post("/toolchains/build-artifact-manifest")
def build_toolchain_artifact_manifest(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.build_toolchain_artifact_manifest(payload)


@router.post("/toolchains/{toolchain_id}/collect-results")
def collect_toolchain_results(toolchain_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.collect_toolchain_results(toolchain_id, payload)


@router.post("/toolchain-result-collections/{collection_id}/approve-evidence")
def approve_toolchain_collection_evidence(
    collection_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_toolchain_collection_evidence(
        collection_id,
        with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session),
    )


@router.post("/toolchain-result-collections/{collection_id}/promote-findings")
def promote_toolchain_collection_evidence_to_findings(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.promote_toolchain_collection_evidence_to_findings(collection_id, payload)


@router.post("/toolchain-result-collections/{collection_id}/approve-finding-severity")
def approve_toolchain_collection_finding_severity(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.approve_toolchain_collection_finding_severity(collection_id, payload)


@router.post("/toolchain-result-collections/{collection_id}/matrix-draft")
def build_toolchain_collection_claim_evidence_matrix_draft(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.build_toolchain_collection_claim_evidence_matrix_draft(collection_id, payload)


@router.post("/toolchain-result-collections/{collection_id}/matrix-draft/report-draft")
def generate_toolchain_collection_report_draft_from_matrix(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.generate_toolchain_collection_report_draft_from_matrix(collection_id, payload)


@router.post("/toolchain-result-collections/{collection_id}/completion-gate")
def verify_toolchain_collection_completion_gate(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.verify_toolchain_collection_completion_gate(collection_id, payload)


@router.post("/tool-runs/{run_id}/import-output")
def import_tool_run_output(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_tool_run_output(run_id, payload)


@router.post("/tool-runs/{run_id}/import-file")
def import_tool_run_file(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_tool_run_file(run_id, payload)


@router.post("/tool-runs/{run_id}/import-file/upload")
async def upload_tool_run_file(
    run_id: str,
    case_id: str = Form(...),
    sha256: str = Form(...),
    summary: str = Form("Tool output file uploaded from Report Studio."),
    content_type: str | None = Form(default=None),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    content = await file.read()
    return redteam_v2_models.import_tool_run_uploaded_file(
        run_id,
        {
            "case_id": case_id,
            "filename": file.filename or "tool-output.bin",
            "sha256": sha256,
            "summary": summary,
            "content_type": content_type or file.content_type or "application/octet-stream",
            "content": content,
        },
    )


@router.post("/tool-runs/{run_id}/sanitize-preview")
def preview_tool_output_sanitizer(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.preview_tool_output_sanitizer(run_id, payload)


@router.post("/visual-evidence/redaction-preview")
def preview_visual_evidence_redaction(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.preview_visual_evidence_redaction(payload)


@router.post("/tool-runs/{run_id}/agent-analyze")
def agent_analyze_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.agent_analyze_tool_run(run_id, payload)


@router.post("/tool-runs/{run_id}/normalize")
def normalize_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.normalize_tool_run(run_id, payload)


@router.post("/tool-runs/{run_id}/create-evidence")
def create_evidence_from_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_from_tool_run(run_id, payload)


@router.post("/evidence")
def create_evidence(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_card(payload)


@router.post("/evidence/{evidence_id}/approve")
def approve_evidence(
    evidence_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_evidence_card(evidence_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/cases/{case_id}/agentic-rag/query")
def query_case_agentic_rag(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.agentic_rag_sca_query(case_id, payload)


@router.get("/tool-result-finding-claim-review")
def latest_tool_result_finding_claim_review() -> dict[str, Any]:
    return redteam_v2_models.latest_tool_result_finding_claim_review()


@router.post("/tool-result-finding-claim-review/{candidate_id}/promote-finding")
def promote_tool_result_candidate_to_finding(candidate_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.promote_tool_result_candidate_to_finding(candidate_id, payload)


@router.post("/tool-result-finding-claim-review/matrix-draft")
def build_tool_result_claim_evidence_matrix_draft(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.build_tool_result_claim_evidence_matrix_draft(payload)


@router.post("/tool-result-finding-claim-review/matrix-draft/report-draft")
def generate_tool_result_report_draft_from_matrix(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.generate_tool_result_report_draft_from_matrix(payload)


@router.post("/findings")
def create_finding(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_finding(payload)


@router.post("/findings/{finding_id}/approve-severity")
def approve_finding_severity(
    finding_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_finding_severity(finding_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/reports/validate")
def validate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.validate_report(payload)


@router.post("/reports/generate")
def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.generate_report(payload)


@router.post("/reports/{report_id}/approve-export")
def approve_report_export(
    report_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_report_export(report_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/reports/{report_id}/export")
def export_report(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.export_report(report_id, payload)
