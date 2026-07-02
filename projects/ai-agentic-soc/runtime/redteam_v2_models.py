from __future__ import annotations

import hashlib
import base64
import binascii
import io
import json
import os
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from fnmatch import fnmatch
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from runtime.redteam_mcp_gateway_adapter import deny_direct_mcp_invocation
except ModuleNotFoundError:
    from redteam_mcp_gateway_adapter import deny_direct_mcp_invocation  # type: ignore


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_V2_ROOT = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2"
MAX_TOOL_ARTIFACT_BYTES = 5 * 1024 * 1024
MAX_RUNNER_OUTPUT_BYTES = 256 * 1024
SCHEMA_ARTIFACT_ROOT = PROJECT_ROOT / "Red Team Studio" / "고도화" / "schemas" / "json"
TOOL_RESULT_FINDING_CLAIM_REVIEW_PATH = (
    PROJECT_ROOT
    / "archive"
    / "runs"
    / "redteam-ax-v2-tool-result-analysis"
    / "latest_tool_result_finding_claim_review.json"
)
TOOL_WRAPPER_PIN_CASE_ID = "CASE-V2-TOOL-TRUST-REGISTRY"
TOOL_WRAPPER_PIN_APPROVER_ROLES = {"red_team_lead"}
TOOL_CREDENTIAL_VAULT_APPROVER_ROLES = {"red_team_lead", "control_team"}
SERVICE_IMPORT_TOOLS = {"TOOL-OPENVAS-001", "TOOL-ZAP-001"}
SERVICE_IMPORT_LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
MAX_SERVICE_REPORT_BYTES = 2 * 1024 * 1024
PROMPT_INJECTION_PATTERNS = [
    "ignore all previous instructions",
    "ignore previous instructions",
    "disregard previous instructions",
    "system prompt",
    "developer message",
    "export the final report",
    "send the report",
    "run this command",
    "call this tool",
]
SECRET_REDACTION_PATTERNS = [
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("bearer_token", re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]{16,}")),
    ("api_key_assignment", re.compile(r"(?i)\b(api[_-]?key|secret|token|password|cookie)\s*[:=]\s*['\"]?[^'\"\s,;]+")),
]
VISUAL_OCR_SENSITIVE_PATTERNS = [
    ("email", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("internal_ipv4", re.compile(r"\b(?:10|127)\.(?:\d{1,3}\.){2}\d{1,3}\b|\b172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b")),
    ("internal_url", re.compile(r"(?i)\bhttps?://(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|[A-Za-z0-9.-]+\.internal)(?:/[^\s\"'<>]*)?")),
    ("phone_number", re.compile(r"\b(?:\+?82[-.\s]?)?0?1[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b")),
    ("session_identifier", re.compile(r"(?i)\b(session[_-]?id|sid|jwt|csrf[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9._~+/=-]{12,}")),
]
RISK_CLASSES = {"T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7"}
HIGH_RISK_CLASSES = {"T3", "T4", "T5", "T6", "T7"}
TERMINAL_APPROVED_STATUSES = {"Approved", "ReadyForManualRun", "ManuallyExecuted", "OutputImported", "Normalized", "EvidenceCreated", "LinkedToFinding", "Closed"}
APPROVER_ROLES = {
    "analyst",
    "red_team_lead",
    "control_team",
    "second_approver",
    "legal_privacy",
    "data_owner",
    "business_owner",
    "executive_sponsor",
}
REPORT_EXPORT_APPROVER_ROLES = {"executive_sponsor"}
FINDING_SEVERITIES = {"info", "low", "medium", "high", "critical"}
FINDING_SEVERITY_APPROVER_ROLES = {"red_team_lead", "business_owner"}
ROLE_PERMISSIONS = {
    "analyst": {"tool_action:plan", "tool_action:request_approval"},
    "red_team_lead": {"tool_action:approve_t3", "evidence:approve", "finding:approve_severity"},
    "control_team": {"tool_action:approve_t4", "tool_action:approve_t5", "evidence:approve"},
    "second_approver": {"tool_action:approve_t5"},
    "legal_privacy": {"evidence:approve_restricted", "evidence:approve"},
    "data_owner": {"evidence:approve_restricted", "evidence:approve"},
    "business_owner": {"finding:approve_severity", "risk:accept"},
    "executive_sponsor": {"report:approve_export", "risk:accept"},
}
ACTOR_DIRECTORY = {
    "analyst@example.com": {"display_name": "Sample Analyst", "roles": {"analyst"}},
    "lead@example.com": {"display_name": "Sample Red Team Lead", "roles": {"red_team_lead"}},
    "control@example.com": {"display_name": "Sample Control Team", "roles": {"control_team"}},
    "second@example.com": {"display_name": "Sample Second Approver", "roles": {"second_approver"}},
    "owner@example.com": {"display_name": "Sample Business Owner", "roles": {"business_owner"}},
    "business-owner@example.com": {"display_name": "Sample Business Owner", "roles": {"business_owner"}},
    "sponsor@example.com": {"display_name": "Sample Executive Sponsor", "roles": {"executive_sponsor"}},
    "executive-sponsor@example.com": {"display_name": "Sample Executive Sponsor", "roles": {"executive_sponsor"}},
    "privacy@example.com": {"display_name": "Sample Legal Privacy Reviewer", "roles": {"legal_privacy"}},
    "data-owner@example.com": {"display_name": "Sample Data Owner", "roles": {"data_owner"}},
}
CASE_ROLE_ASSIGNMENTS = {
    "CASE-V2-*": {
        "analyst@example.com": {"analyst"},
        "lead@example.com": {"red_team_lead"},
        "control@example.com": {"control_team"},
        "second@example.com": {"second_approver"},
        "owner@example.com": {"business_owner"},
        "business-owner@example.com": {"business_owner"},
        "sponsor@example.com": {"executive_sponsor"},
        "executive-sponsor@example.com": {"executive_sponsor"},
        "privacy@example.com": {"legal_privacy"},
        "data-owner@example.com": {"data_owner"},
    },
    "CASE-LIVE-*": {
        "analyst@example.com": {"analyst"},
        "lead@example.com": {"red_team_lead"},
        "control@example.com": {"control_team"},
        "second@example.com": {"second_approver"},
        "owner@example.com": {"business_owner"},
        "business-owner@example.com": {"business_owner"},
        "sponsor@example.com": {"executive_sponsor"},
        "executive-sponsor@example.com": {"executive_sponsor"},
        "privacy@example.com": {"legal_privacy"},
        "data-owner@example.com": {"data_owner"},
    },
    "CASE-RTA-*": {
        "lead@example.com": {"red_team_lead"},
        "business-owner@example.com": {"business_owner"},
        "executive-sponsor@example.com": {"executive_sponsor"},
    },
    "RTA-*": {
        "lead@example.com": {"red_team_lead"},
        "business-owner@example.com": {"business_owner"},
        "executive-sponsor@example.com": {"executive_sponsor"},
    },
}

ANALYSIS_TOOL_PROFILES = [
    {
        "tool_id": "TOOL-NUCLEI-001",
        "name": "nuclei",
        "display_name": "Nuclei",
        "category": "web_validation",
        "risk_class": "T3",
        "adapter_type": "cli_wrapper",
        "command_name": "nuclei",
        "default_execution_mode": "manual_operator_run",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "manual_operator_run", "lab_execute"],
        "denied_execution_modes": ["controlled_production_execute", "prohibited"],
        "default_policy": "approved_templates_and_scope_required",
        "requires_human_approval": True,
        "requires_two_person_approval": False,
        "supports_json_output": True,
        "normalizer_id": "NORMALIZER-NUCLEI-001",
        "agent_id": "AGENT-NUCLEI-ANALYST-001",
        "evidence_types": ["scanner_finding_candidate", "web_validation_evidence"],
        "prohibited_options": ["unbounded_target_import", "interactsh_unapproved", "unsafe_templates"],
        "installation_hint": "Install nuclei from the official ProjectDiscovery release and pin template sources.",
    },
    {
        "tool_id": "TOOL-OPENVAS-001",
        "name": "openvas",
        "display_name": "OpenVAS / Greenbone Community Edition",
        "category": "vulnerability_scanner",
        "risk_class": "T3",
        "adapter_type": "api_or_import_only",
        "command_name": "gvm-cli",
        "default_execution_mode": "manual_operator_run",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "manual_operator_run", "lab_execute"],
        "denied_execution_modes": ["controlled_production_execute", "prohibited"],
        "default_policy": "scanner_task_import_or_approved_lab_only",
        "requires_human_approval": True,
        "requires_two_person_approval": False,
        "supports_json_output": False,
        "normalizer_id": "NORMALIZER-OPENVAS-001",
        "agent_id": "AGENT-OPENVAS-ANALYST-001",
        "evidence_types": ["scanner_finding_candidate", "vulnerability_management_evidence"],
        "prohibited_options": ["credentialed_scan_without_owner_approval", "unbounded_target_import"],
        "installation_hint": "Run Greenbone/OpenVAS as a managed service; import reports or use approved API credentials.",
    },
    {
        "tool_id": "TOOL-TRIVY-001",
        "name": "trivy",
        "display_name": "Trivy",
        "category": "container_iac_dependency_scan",
        "risk_class": "T0",
        "adapter_type": "cli_wrapper",
        "command_name": "trivy",
        "default_execution_mode": "offline_parse",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "sandbox_execute"],
        "denied_execution_modes": ["lab_execute", "controlled_production_execute", "prohibited"],
        "default_policy": "offline_artifact_or_workspace_scan_only",
        "requires_human_approval": False,
        "requires_two_person_approval": False,
        "supports_json_output": True,
        "normalizer_id": "NORMALIZER-TRIVY-001",
        "agent_id": "AGENT-TRIVY-ANALYST-001",
        "evidence_types": ["sca_vulnerability_candidate", "container_scan_evidence"],
        "prohibited_options": ["remote_registry_without_approval", "secret_upload"],
        "installation_hint": "Install trivy CLI and use JSON output for offline workspace/container artifact scans.",
    },
    {
        "tool_id": "TOOL-SCA-001",
        "name": "sca",
        "display_name": "SCA Dependency Analyzer",
        "category": "software_composition_analysis",
        "risk_class": "T0",
        "adapter_type": "import_only",
        "command_name": "",
        "default_execution_mode": "offline_parse",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "sandbox_execute"],
        "denied_execution_modes": ["lab_execute", "controlled_production_execute", "prohibited"],
        "default_policy": "dependency_manifest_or_sbom_only",
        "requires_human_approval": False,
        "requires_two_person_approval": False,
        "supports_json_output": True,
        "normalizer_id": "NORMALIZER-SCA-001",
        "agent_id": "AGENT-SCA-ANALYST-001",
        "evidence_types": ["sca_vulnerability_candidate", "sbom_evidence"],
        "prohibited_options": ["package_download_without_approval", "credentialed_registry_access"],
        "installation_hint": "Use SBOM/dependency manifest import first; wire organization SCA backend later.",
    },
    {
        "tool_id": "TOOL-NPM-AUDIT-001",
        "name": "npm audit",
        "display_name": "npm audit",
        "category": "software_composition_analysis",
        "risk_class": "T0",
        "adapter_type": "cli_wrapper",
        "command_name": "npm.cmd",
        "default_execution_mode": "offline_parse",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "sandbox_execute"],
        "denied_execution_modes": ["lab_execute", "controlled_production_execute", "prohibited"],
        "default_policy": "workspace_lockfile_required",
        "requires_human_approval": False,
        "requires_two_person_approval": False,
        "supports_json_output": True,
        "normalizer_id": "NORMALIZER-NPM-AUDIT-001",
        "agent_id": "AGENT-NPM-AUDIT-ANALYST-001",
        "evidence_types": ["sca_vulnerability_candidate", "dependency_advisory_evidence"],
        "prohibited_options": ["npm_fix", "package_publish", "credentialed_registry_access"],
        "installation_hint": "Use npm audit --json against approved workspace lockfiles; never auto-fix without review.",
    },
    {
        "tool_id": "TOOL-ZAP-001",
        "name": "owasp-zap",
        "display_name": "OWASP ZAP",
        "category": "web_validation",
        "risk_class": "T3",
        "adapter_type": "api_or_cli_wrapper",
        "command_name": "zap-cli",
        "default_execution_mode": "manual_operator_run",
        "allowed_execution_modes": ["plan_only", "dry_run", "offline_parse", "manual_operator_run", "lab_execute"],
        "denied_execution_modes": ["controlled_production_execute", "prohibited"],
        "default_policy": "approved_scope_passive_or_lab_active_scan",
        "requires_human_approval": True,
        "requires_two_person_approval": False,
        "supports_json_output": True,
        "normalizer_id": "NORMALIZER-ZAP-001",
        "agent_id": "AGENT-ZAP-ANALYST-001",
        "evidence_types": ["scanner_finding_candidate", "web_validation_evidence"],
        "prohibited_options": ["attack_mode", "active_scan_without_approval", "unbounded_spider"],
        "installation_hint": "Run ZAP in daemon/container mode and import JSON reports; active scan requires approval.",
    },
]

TOOL_INSTALL_READINESS_CATALOG = {
    "TOOL-NUCLEI-001": {
        "official_url": "https://github.com/projectdiscovery/nuclei",
        "install_modes": ["official_release_binary", "go_install", "package_manager"],
        "operator_install_commands": [
            "go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
            "nuclei -version",
        ],
        "verification_commands": ["nuclei -version", "nuclei -update-templates -validate"],
        "post_install_controls": ["pin_binary_sha256", "pin_template_source", "approve_wrapper_pin"],
        "safe_smoke": "version_only",
    },
    "TOOL-OPENVAS-001": {
        "official_url": "https://greenbone.github.io/docs/latest/",
        "install_modes": ["managed_service", "container_or_vm", "api_import"],
        "operator_install_commands": [
            "Deploy Greenbone Community Edition in an approved lab network.",
            "gvm-cli --version",
        ],
        "verification_commands": ["gvm-cli --version", "import_completed_report_only"],
        "post_install_controls": ["api_credentials_approved", "lab_network_only", "approve_wrapper_pin_or_import_only_report"],
        "safe_smoke": "import_report_or_version_only",
    },
    "TOOL-TRIVY-001": {
        "official_url": "https://github.com/aquasecurity/trivy",
        "install_modes": ["official_release_binary", "package_manager", "container_image"],
        "operator_install_commands": ["trivy --version"],
        "verification_commands": ["trivy --version", "trivy fs --format json --offline-scan ."],
        "post_install_controls": ["pin_binary_sha256", "offline_scan_default", "approve_wrapper_pin"],
        "safe_smoke": "version_or_offline_fs_scan",
    },
    "TOOL-SCA-001": {
        "official_url": "internal://redteam-ax/import-only-sca",
        "install_modes": ["import_only", "sbom_parser"],
        "operator_install_commands": ["No runner install required; upload SBOM, lockfile, or SCA export."],
        "verification_commands": ["validate_uploaded_sbom_schema"],
        "post_install_controls": ["schema_validation", "normalizer_only"],
        "safe_smoke": "import_only",
    },
    "TOOL-NPM-AUDIT-001": {
        "official_url": "https://docs.npmjs.com/cli/commands/npm-audit",
        "install_modes": ["nodejs_npm_cli", "workspace_lockfile"],
        "operator_install_commands": ["npm.cmd --version", "npm.cmd audit --json --package-lock-only"],
        "verification_commands": ["npm.cmd --version"],
        "post_install_controls": ["pin_npm_wrapper_sha256", "approved_workspace_only", "no_npm_fix_without_review"],
        "safe_smoke": "version_only",
    },
    "TOOL-ZAP-001": {
        "official_url": "https://www.zaproxy.org/docs/",
        "install_modes": ["zap_daemon_container", "desktop_or_cli", "json_report_import"],
        "operator_install_commands": ["zap-cli --version", "Run ZAP daemon only in approved lab scope."],
        "verification_commands": ["zap-cli --version", "import_zap_json_report"],
        "post_install_controls": ["pin_wrapper_sha256", "passive_scan_default", "active_scan_requires_approval"],
        "safe_smoke": "version_or_report_import",
    },
}

TOOL_CREDENTIAL_POLICY_CATALOG = {
    "TOOL-OPENVAS-001": {
        "tool_id": "TOOL-OPENVAS-001",
        "tool_name": "openvas",
        "display_name": "OpenVAS / Greenbone Community Edition",
        "credential_mode": "external_vault_reference_only",
        "read_only_required": True,
        "allowed_token_scopes": ["read:reports", "read:scan_status", "read:targets"],
        "prohibited_token_scopes": [
            "write:scan_config",
            "start:scan",
            "stop:scan",
            "delete:task",
            "admin",
            "credentialed_scan_without_owner_approval",
        ],
        "endpoint_policy": "approved_lab_or_managed_service_endpoint_only",
        "secret_material_policy": "Never submit API keys, passwords, cookies, or bearer tokens to this API. Store them in an external vault and submit only a vault reference.",
        "runner_policy": "ToolActionCard and execution token may reference the credential authorization id, but runner receives only a short-lived external broker reference.",
    },
    "TOOL-ZAP-001": {
        "tool_id": "TOOL-ZAP-001",
        "tool_name": "owasp-zap",
        "display_name": "OWASP ZAP",
        "credential_mode": "external_vault_reference_only",
        "read_only_required": True,
        "allowed_token_scopes": ["read:alerts", "read:spider_status", "read:context", "read:reports"],
        "prohibited_token_scopes": [
            "active_scan",
            "attack_mode",
            "write:context",
            "delete:alert",
            "admin",
            "unbounded_spider",
        ],
        "endpoint_policy": "approved_lab_daemon_or_report_import_endpoint_only",
        "secret_material_policy": "Never submit ZAP API keys or session tokens to this API. Store them in an external vault and submit only a vault reference.",
        "runner_policy": "Passive/read-only API use may be planned after approval; active scan still requires separate HITL approval.",
    },
}

ANALYSIS_AGENT_REGISTRY = {
    "AGENT-NUCLEI-ANALYST-001": {
        "agent_id": "AGENT-NUCLEI-ANALYST-001",
        "name": "nuclei_result_normalizer_agent",
        "tool_ids": ["TOOL-NUCLEI-001"],
        "role": "Normalize nuclei JSONL into evidence candidates and suppress unsupported vulnerability claims.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
    "AGENT-OPENVAS-ANALYST-001": {
        "agent_id": "AGENT-OPENVAS-ANALYST-001",
        "name": "openvas_report_normalizer_agent",
        "tool_ids": ["TOOL-OPENVAS-001"],
        "role": "Summarize OpenVAS reports with false-positive review prompts and remediation context.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
    "AGENT-TRIVY-ANALYST-001": {
        "agent_id": "AGENT-TRIVY-ANALYST-001",
        "name": "trivy_result_normalizer_agent",
        "tool_ids": ["TOOL-TRIVY-001"],
        "role": "Normalize Trivy vulnerabilities, licenses, secrets, and IaC findings into SCA evidence candidates.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
    "AGENT-SCA-ANALYST-001": {
        "agent_id": "AGENT-SCA-ANALYST-001",
        "name": "sca_sbom_reasoning_agent",
        "tool_ids": ["TOOL-SCA-001"],
        "role": "Reason over SBOM/dependency analyzer output while treating all tool content as untrusted data.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
    "AGENT-NPM-AUDIT-ANALYST-001": {
        "agent_id": "AGENT-NPM-AUDIT-ANALYST-001",
        "name": "npm_audit_result_normalizer_agent",
        "tool_ids": ["TOOL-NPM-AUDIT-001"],
        "role": "Normalize npm audit advisories into dependency evidence candidates and retest steps.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
    "AGENT-ZAP-ANALYST-001": {
        "agent_id": "AGENT-ZAP-ANALYST-001",
        "name": "zap_report_normalizer_agent",
        "tool_ids": ["TOOL-ZAP-001"],
        "role": "Normalize ZAP alerts and separate passive observations from approved active validation.",
        "output_contract": "redteam_ax_v2_tool_result_normalized",
    },
}

TOOL_SCHEMA_REGISTRY = {
    "ToolArtifactImport": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "redteam.ax.v2.ToolArtifactImport",
        "title": "RedTeam AX v2 ToolArtifactImport",
        "type": "object",
        "additionalProperties": True,
        "required": ["kind", "case_id", "run_id", "status", "artifact", "policy"],
        "properties": {
            "kind": {"const": "redteam_ax_v2_tool_artifact_import"},
            "case_id": {"type": "string", "minLength": 1},
            "run_id": {"type": "string", "minLength": 1},
            "status": {"enum": ["OutputImported", "invalid"]},
            "errors": {"type": "array", "items": {"type": "string"}},
            "artifact": {
                "type": "object",
                "additionalProperties": True,
                "required": ["artifact_id", "source_path_or_ref", "sha256", "hash_algorithm", "trusted_as_instruction", "requires_human_validation"],
                "properties": {
                    "artifact_id": {"type": "string", "minLength": 1},
                    "source_path_or_ref": {"type": "string", "minLength": 1},
                    "storage_path": {"type": ["string", "null"]},
                    "sha256": {"type": "string", "pattern": "^[A-Fa-f0-9]{64}$"},
                    "hash_algorithm": {"const": "sha256"},
                    "content_type": {"type": "string"},
                    "trusted_as_instruction": {"const": False},
                    "requires_human_validation": {"const": True},
                },
            },
            "policy": {
                "type": "object",
                "additionalProperties": True,
                "required": ["source_boundary", "hash_required", "raw_content_trust"],
                "properties": {
                    "source_boundary": {"const": "workspace_only"},
                    "hash_required": {"const": True},
                    "raw_content_trust": {"const": "data_only_never_instruction"},
                },
            },
        },
    },
    "ToolResultNormalized": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "redteam.ax.v2.ToolResultNormalized",
        "title": "RedTeam AX v2 ToolResultNormalized",
        "type": "object",
        "additionalProperties": True,
        "required": [
            "kind",
            "result_id",
            "case_id",
            "run_id",
            "result_type",
            "summary",
            "structured_items",
            "prohibited_report_claims",
            "status",
        ],
        "properties": {
            "kind": {"const": "redteam_ax_v2_tool_result_normalized"},
            "result_id": {"type": "string", "minLength": 1},
            "case_id": {"type": "string", "minLength": 1},
            "run_id": {"type": "string", "minLength": 1},
            "result_type": {"type": "string", "minLength": 1},
            "summary": {"type": "string", "minLength": 1},
            "structured_items": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "additionalProperties": True,
                    "required": ["item_type", "trusted_as_instruction", "requires_human_validation"],
                    "properties": {
                        "item_type": {"type": "string", "minLength": 1},
                        "trusted_as_instruction": {"const": False},
                        "requires_human_validation": {"const": True},
                    },
                },
            },
            "prohibited_report_claims": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "parser_report": {"type": "object"},
            "status": {"enum": ["Normalized", "invalid"]},
        },
    },
}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def stable_id(prefix: str, parts: list[Any]) -> str:
    raw = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


def safe_name(value: Any) -> str:
    raw = str(value or "unknown").strip()
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in raw)
    return safe[:120] or "unknown"


def case_dir(case_id: str) -> Path:
    path = DEFAULT_V2_ROOT / safe_name(case_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_json_artifact(case_id: str, category: str, record_id: str, payload: dict[str, Any]) -> str:
    path = case_dir(case_id) / safe_name(category)
    path.mkdir(parents=True, exist_ok=True)
    artifact_path = path / f"{safe_name(record_id)}.json"
    payload["artifact_path"] = artifact_path.as_posix()
    artifact_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return artifact_path.as_posix()


def write_case_event(case_id: str, event: dict[str, Any]) -> str:
    path = case_dir(case_id) / "audit.jsonl"
    record = {"recorded_at": now_utc(), **event}
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
    return path.as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_relative_to_path(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def resolve_workspace_source_path(value: Any) -> tuple[Path | None, list[str]]:
    raw = str(value or "").strip()
    errors: list[str] = []
    if not raw:
        return None, ["source_path_required"]
    if "://" in raw:
        return None, ["source_path_must_be_local_workspace_file"]
    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    resolved = candidate.resolve()
    project_root = PROJECT_ROOT.resolve()
    if not is_relative_to_path(resolved, project_root):
        errors.append("source_path_outside_workspace")
    if not resolved.exists():
        errors.append("source_path_not_found")
    elif not resolved.is_file():
        errors.append("source_path_must_be_file")
    elif resolved.stat().st_size > MAX_TOOL_ARTIFACT_BYTES:
        errors.append("source_file_exceeds_max_bytes")
    return resolved, errors


def text_like_artifact(path: Path, content_type: str) -> bool:
    normalized = str(content_type or "").lower()
    if normalized.startswith("text/") or normalized in {"application/json", "application/xml", "application/x-ndjson"}:
        return True
    return path.suffix.lower() in {".json", ".jsonl", ".ndjson", ".xml", ".txt", ".sarif", ".cyclonedx"}


def append_artifact_metadata(payload: dict[str, Any], category: str, record_id: str) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    payload["artifact_path"] = write_json_artifact(case_id, category, record_id, payload)
    payload["audit_log_path"] = write_case_event(case_id, {
        "event": f"{category}_stored",
        "record_id": record_id,
        "artifact_path": payload["artifact_path"],
    })
    return payload


def read_json_artifact(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def list_json_artifacts(case_id: str | None, category: str) -> list[dict[str, Any]]:
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    records: list[tuple[float, dict[str, Any]]] = []
    for root in roots:
        category_dir = root / safe_name(category)
        if not category_dir.exists():
            continue
        for artifact_path in category_dir.glob("*.json"):
            record = read_json_artifact(artifact_path)
            if record is not None:
                records.append((artifact_path.stat().st_mtime, record))
    return [record for _, record in sorted(records, key=lambda item: item[0], reverse=True)]


def load_json_record(record_id: str, category: str, case_id: str | None = None) -> dict[str, Any] | None:
    safe_record_id = safe_name(record_id)
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    safe_category = safe_name(category)
    for root in roots:
        artifact_path = root / safe_category / f"{safe_record_id}.json"
        if artifact_path.exists():
            return read_json_artifact(artifact_path)
    for record in list_json_artifacts(case_id, category):
        known_id = (
            record.get("run_id")
            or record.get("result_id")
            or record.get("evidence_id")
            or record.get("finding_id")
            or record.get("report_id")
            or record.get("approval_id")
            or record.get("export_id")
            or record.get("id")
            or ""
        )
        if str(known_id) == record_id:
            return record
    return None


def list_tool_actions(case_id: str | None = None, status: str | None = None) -> dict[str, Any]:
    actions = list_json_artifacts(case_id, "tool-actions")
    if status:
        actions = [action for action in actions if str(action.get("status") or "") == status]
    return {
        "kind": "redteam_ax_v2_tool_action_list",
        "case_id": case_id,
        "status": status,
        "count": len(actions),
        "items": actions,
    }


def load_tool_action(action_id: str, case_id: str | None = None) -> dict[str, Any] | None:
    safe_action_id = safe_name(action_id)
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    for root in roots:
        artifact_path = root / "tool-actions" / f"{safe_action_id}.json"
        if artifact_path.exists():
            return read_json_artifact(artifact_path)
    for action in list_json_artifacts(case_id, "tool-actions"):
        if str(action.get("action_id") or "") == action_id:
            return action
    return None


def command_availability(command_name: str) -> dict[str, Any]:
    command = str(command_name or "").strip()
    if not command:
        return {
            "status": "not_applicable",
            "command": "",
            "path": None,
            "checked_at": now_utc(),
        }
    resolved = shutil.which(command)
    return {
        "status": "available" if resolved else "missing",
        "command": command,
        "path": resolved,
        "checked_at": now_utc(),
    }


def valid_sha256(value: Any) -> bool:
    text = str(value or "").strip().lower()
    return len(text) == 64 and all(ch in "0123456789abcdef" for ch in text)


def tool_wrapper_pin_record_id(tool_id: str) -> str:
    return f"wrapper-pin-{safe_name(tool_id).upper()}"


def load_approved_tool_wrapper_pin(profile: dict[str, Any]) -> dict[str, Any] | None:
    tool_id = str(profile.get("tool_id") or "").strip()
    if not tool_id:
        return None
    pin = load_json_record(
        tool_wrapper_pin_record_id(tool_id),
        "tool-wrapper-pins",
        case_id=TOOL_WRAPPER_PIN_CASE_ID,
    )
    if pin and pin.get("status") == "approved" and not pin.get("revoked") and valid_sha256(pin.get("expected_sha256")):
        return pin
    return None


def tool_wrapper_manifest_for_profile(profile: dict[str, Any]) -> dict[str, Any]:
    adapter_type = str(profile.get("adapter_type") or "")
    command_name = str(profile.get("command_name") or "").strip()
    availability = command_availability(command_name)
    resolved_path = availability.get("path")
    approved_pin = load_approved_tool_wrapper_pin(profile)
    expected_sha256 = (
        str(profile.get("expected_sha256") or "").strip()
        or str((approved_pin or {}).get("expected_sha256") or "").strip()
        or None
    )
    actual_sha256 = None
    hash_error = None

    if resolved_path:
        try:
            actual_sha256 = sha256_file(Path(str(resolved_path)))
        except OSError as exc:
            hash_error = str(exc)

    if adapter_type == "import_only" or not command_name:
        pinning_status = "import_only"
        trusted_for_runner = True
        requires_pin_before_runner = False
    elif availability["status"] == "missing":
        pinning_status = "missing"
        trusted_for_runner = False
        requires_pin_before_runner = True
    elif hash_error:
        pinning_status = "hash_unreadable"
        trusted_for_runner = False
        requires_pin_before_runner = True
    elif not expected_sha256:
        pinning_status = "hash_unpinned"
        trusted_for_runner = False
        requires_pin_before_runner = True
    elif actual_sha256 == expected_sha256:
        pinning_status = "hash_match"
        trusted_for_runner = True
        requires_pin_before_runner = False
    else:
        pinning_status = "hash_mismatch"
        trusted_for_runner = False
        requires_pin_before_runner = True

    return {
        "kind": "redteam_ax_v2_tool_wrapper_manifest",
        "tool_id": profile.get("tool_id"),
        "tool_name": profile.get("name"),
        "adapter_type": adapter_type,
        "command_name": command_name,
        "availability": availability,
        "resolved_path": resolved_path,
        "expected_sha256": expected_sha256,
        "expected_sha256_source": "tool_profile" if profile.get("expected_sha256") else ("approved_pin" if approved_pin else "not_configured"),
        "approved_pin": approved_pin,
        "actual_sha256": actual_sha256,
        "hash_error": hash_error,
        "pinning_status": pinning_status,
        "trusted_for_runner": trusted_for_runner,
        "requires_pin_before_runner": requires_pin_before_runner,
        "version_probe": {
            "mode": "not_executed_safe_manifest_only",
            "status": "not_verified" if command_name else "not_applicable",
            "reason": "Version commands are intentionally not executed by the registry endpoint.",
        },
        "runner_preflight": {
            "runner_can_use_wrapper": trusted_for_runner,
            "blocking_controls": [] if trusted_for_runner else ["wrapper_sha256_pin_required"],
            "human_review_required": not trusted_for_runner and availability["status"] == "available",
        },
        "installation_hint": profile.get("installation_hint") or "",
        "checked_at": availability.get("checked_at") or now_utc(),
    }


def list_tool_wrapper_manifests() -> dict[str, Any]:
    manifests = [tool_wrapper_manifest_for_profile(profile) for profile in ANALYSIS_TOOL_PROFILES]
    return {
        "kind": "redteam_ax_v2_tool_wrapper_manifest_registry",
        "manifest_count": len(manifests),
        "manifests": manifests,
        "safe_by_default": True,
        "verification_policy": "CLI/API wrappers require resolved binary hash pinning before runner trust.",
        "version_probe_policy": "Version commands are not executed by registry read APIs; collect operator-attested version evidence separately.",
    }


def tool_wrapper_manifest(tool_id: str) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    if profile is None:
        return {
            "kind": "redteam_ax_v2_tool_wrapper_manifest",
            "tool_id": tool_id,
            "status": "not_found",
            "errors": ["tool_profile_not_registered"],
        }
    return tool_wrapper_manifest_for_profile(profile)


def request_tool_wrapper_pin(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    case_id = str(payload.get("case_id") or TOOL_WRAPPER_PIN_CASE_ID).strip()
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "").strip()
    manifest = tool_wrapper_manifest_for_profile(profile) if profile else None
    submitted_sha256 = str(
        payload.get("expected_sha256")
        or payload.get("observed_sha256")
        or (manifest or {}).get("actual_sha256")
        or ""
    ).strip().lower()
    errors: list[str] = []
    warnings: list[str] = []
    existing_pin = load_approved_tool_wrapper_pin(profile) if profile else None
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not case_id:
        errors.append("case_id_required")
    if not requested_by:
        errors.append("requested_by_required")
    if not submitted_sha256:
        errors.append("expected_sha256_required")
    elif not valid_sha256(submitted_sha256):
        errors.append("expected_sha256_must_be_64_hex")
    if profile and profile.get("adapter_type") == "import_only":
        errors.append("import_only_tool_does_not_require_wrapper_pin")
    if manifest and manifest.get("actual_sha256") and submitted_sha256 and submitted_sha256 != manifest.get("actual_sha256"):
        warnings.append("submitted_hash_differs_from_current_resolved_wrapper")
    if existing_pin:
        warnings.append("existing_approved_pin_will_be_rotated_on_approval")

    request_id = str(payload.get("pin_request_id") or stable_id("TWPINREQ", [case_id, tool_id, submitted_sha256, requested_by, now_utc()]))
    result = {
        "kind": "redteam_ax_v2_tool_wrapper_pin_request",
        "pin_request_id": request_id,
        "case_id": case_id,
        "tool_id": (profile or {}).get("tool_id") or tool_id,
        "tool_name": (profile or {}).get("name"),
        "status": "invalid" if errors else "submitted",
        "errors": errors,
        "warnings": warnings,
        "expected_sha256": submitted_sha256 or None,
        "existing_approved_pin": existing_pin,
        "manifest_snapshot": manifest,
        "version_evidence": {
            "operator_attested_version": str(payload.get("operator_attested_version") or payload.get("version") or "").strip(),
            "version_command": str(payload.get("version_command") or "").strip(),
            "version_output_excerpt": str(payload.get("version_output_excerpt") or "")[:1000],
            "version_command_executed_by_operator": bool(payload.get("version_command_executed_by_operator")),
            "registry_executed_version_command": False,
        },
        "requested_by": requested_by,
        "requested_at": now_utc(),
        "approval_policy": {
            "required_approver_roles": sorted(TOOL_WRAPPER_PIN_APPROVER_ROLES),
            "approval_mode": "single_approval",
            "safe_by_default": True,
        },
    }
    return append_artifact_metadata(result, "tool-wrapper-pin-requests", request_id)


def approve_tool_wrapper_pin(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    case_id = str(payload.get("case_id") or TOOL_WRAPPER_PIN_CASE_ID).strip()
    request_id = str(payload.get("pin_request_id") or payload.get("request_id") or "").strip()
    pin_request = load_json_record(request_id, "tool-wrapper-pin-requests", case_id=case_id) if request_id else None
    approver = str(payload.get("approver") or payload.get("approved_by") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role") or payload.get("role"))
    actor_payload = {**payload, "case_id": case_id, "approver": approver, "approver_role": approver_role}
    actor_context, binding_errors = approval_actor_binding_errors(actor_payload, approver, approver_role)
    decision = str(payload.get("decision") or "approve").strip().lower()
    errors: list[str] = []
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not case_id:
        errors.append("case_id_required")
    if not request_id:
        errors.append("pin_request_id_required")
    if pin_request is None:
        errors.append("pin_request_not_found")
    elif pin_request.get("status") != "submitted":
        errors.append("pin_request_not_submitted")
    if not approver:
        errors.append("approver_required")
    errors.extend(binding_errors)
    if decision not in {"approve", "reject"}:
        errors.append("decision_must_be_approve_or_reject")
    if decision == "approve" and approver_role not in TOOL_WRAPPER_PIN_APPROVER_ROLES:
        errors.append("approver_role_not_authorized")
    expected_sha256 = str((pin_request or {}).get("expected_sha256") or "").strip().lower()
    if decision == "approve" and not valid_sha256(expected_sha256):
        errors.append("expected_sha256_must_be_64_hex")

    manifest_before = tool_wrapper_manifest_for_profile(profile) if profile else None
    approval_id = stable_id("TWPINAP", [case_id, tool_id, request_id, approver, approver_role, decision, now_utc()])
    approval = {
        "kind": "redteam_ax_v2_tool_wrapper_pin_approval",
        "approval_id": approval_id,
        "case_id": case_id,
        "tool_id": (profile or {}).get("tool_id") or tool_id,
        "pin_request_id": request_id,
        "status": "invalid" if errors else ("rejected" if decision == "reject" else "approved"),
        "decision": decision,
        "errors": errors,
        "approver": approver,
        "approver_role": approver_role,
        "actor_context": actor_context,
        "identity_binding": "bound" if not binding_errors else "invalid",
        "expected_sha256": expected_sha256 or None,
        "manifest_before": manifest_before,
        "decided_at": now_utc(),
    }
    append_artifact_metadata(approval, "tool-wrapper-pin-approvals", approval_id)

    approved_pin = None
    if not errors and decision == "approve":
        pin_record = {
            "kind": "redteam_ax_v2_tool_wrapper_pin",
            "pin_id": tool_wrapper_pin_record_id(str((profile or {}).get("tool_id") or tool_id)),
            "case_id": TOOL_WRAPPER_PIN_CASE_ID,
            "source_case_id": case_id,
            "tool_id": (profile or {}).get("tool_id") or tool_id,
            "tool_name": (profile or {}).get("name"),
            "status": "approved",
            "expected_sha256": expected_sha256,
            "pin_request_id": request_id,
            "approval_id": approval_id,
            "approved_by": approver,
            "approver_role": approver_role,
            "version_evidence": (pin_request or {}).get("version_evidence") or {},
            "approved_at": now_utc(),
            "safe_by_default": True,
        }
        approved_pin = append_artifact_metadata(pin_record, "tool-wrapper-pins", pin_record["pin_id"])
    manifest_after = tool_wrapper_manifest_for_profile(profile) if profile else None
    return {
        **approval,
        "approved_pin": approved_pin,
        "manifest_after": manifest_after,
    }


def revoke_tool_wrapper_pin(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    case_id = str(payload.get("case_id") or TOOL_WRAPPER_PIN_CASE_ID).strip()
    pin_id = tool_wrapper_pin_record_id(str((profile or {}).get("tool_id") or tool_id))
    existing_pin = load_json_record(pin_id, "tool-wrapper-pins", case_id=TOOL_WRAPPER_PIN_CASE_ID)
    revoker = str(payload.get("revoker") or payload.get("revoked_by") or payload.get("approver") or "").strip()
    revoker_role = normalize_approver_role(payload.get("revoker_role") or payload.get("approver_role") or payload.get("role"))
    actor_payload = {**payload, "case_id": case_id, "approver": revoker, "approver_role": revoker_role}
    actor_context, binding_errors = approval_actor_binding_errors(actor_payload, revoker, revoker_role)
    reason = str(payload.get("reason") or "").strip()
    errors: list[str] = []
    if profile is None:
        errors.append("tool_profile_not_registered")
    if existing_pin is None:
        errors.append("approved_pin_not_found")
    elif existing_pin.get("status") != "approved" or existing_pin.get("revoked"):
        errors.append("approved_pin_not_active")
    if not revoker:
        errors.append("revoker_required")
    errors.extend(binding_errors)
    if revoker_role not in TOOL_WRAPPER_PIN_APPROVER_ROLES:
        errors.append("revoker_role_not_authorized")
    if not reason:
        errors.append("revoke_reason_required")

    revoke_id = stable_id("TWPINREV", [case_id, tool_id, revoker, revoker_role, reason, now_utc()])
    manifest_before = tool_wrapper_manifest_for_profile(profile) if profile else None
    result = {
        "kind": "redteam_ax_v2_tool_wrapper_pin_revoke",
        "revoke_id": revoke_id,
        "case_id": case_id,
        "tool_id": (profile or {}).get("tool_id") or tool_id,
        "pin_id": pin_id,
        "status": "invalid" if errors else "revoked",
        "errors": errors,
        "revoker": revoker,
        "revoker_role": revoker_role,
        "actor_context": actor_context,
        "identity_binding": "bound" if not binding_errors else "invalid",
        "reason": reason,
        "pin_before": existing_pin,
        "manifest_before": manifest_before,
        "revoked_at": now_utc(),
    }
    append_artifact_metadata(result, "tool-wrapper-pin-revocations", revoke_id)
    revoked_pin = None
    if not errors and existing_pin is not None:
        revoked_pin = {
            **existing_pin,
            "status": "revoked",
            "revoked": True,
            "revoked_by": revoker,
            "revoker_role": revoker_role,
            "revoke_id": revoke_id,
            "revoke_reason": reason,
            "revoked_at": now_utc(),
        }
        append_artifact_metadata(revoked_pin, "tool-wrapper-pins", pin_id)
    manifest_after = tool_wrapper_manifest_for_profile(profile) if profile else None
    return {
        **result,
        "revoked_pin": revoked_pin,
        "manifest_after": manifest_after,
    }


def schema_artifact_path(schema_id: str) -> str:
    return (SCHEMA_ARTIFACT_ROOT / f"{safe_name(schema_id)}.schema.json").as_posix()


def list_tool_schemas() -> dict[str, Any]:
    schemas = []
    for schema_id, schema in TOOL_SCHEMA_REGISTRY.items():
        schemas.append({
            "schema_id": schema_id,
            "title": schema.get("title"),
            "artifact_path": schema_artifact_path(schema_id),
            "required": schema.get("required") or [],
        })
    return {
        "kind": "redteam_ax_v2_tool_schema_registry",
        "schema_count": len(schemas),
        "schemas": schemas,
        "validation_policy": "runtime_subset_json_schema_plus_redteam_trust_invariants",
    }


def _json_type_matches(value: Any, expected_type: Any) -> bool:
    expected = expected_type if isinstance(expected_type, list) else [expected_type]
    for item in expected:
        if item == "null" and value is None:
            return True
        if item == "object" and isinstance(value, dict):
            return True
        if item == "array" and isinstance(value, list):
            return True
        if item == "string" and isinstance(value, str):
            return True
        if item == "boolean" and isinstance(value, bool):
            return True
        if item == "number" and isinstance(value, (int, float)) and not isinstance(value, bool):
            return True
        if item == "integer" and isinstance(value, int) and not isinstance(value, bool):
            return True
    return False


def _validate_schema_subset(value: Any, schema: dict[str, Any], path: str = "$") -> list[str]:
    errors: list[str] = []
    if "type" in schema and not _json_type_matches(value, schema.get("type")):
        errors.append(f"{path}:type_mismatch:{schema.get('type')}")
        return errors
    if "const" in schema and value != schema.get("const"):
        errors.append(f"{path}:const_mismatch")
    if "enum" in schema and value not in (schema.get("enum") or []):
        errors.append(f"{path}:enum_mismatch")
    if isinstance(value, str):
        if int(schema.get("minLength") or 0) and len(value) < int(schema.get("minLength") or 0):
            errors.append(f"{path}:min_length")
        pattern = schema.get("pattern")
        if pattern == "^[A-Fa-f0-9]{64}$":
            valid_hex = len(value) == 64 and all(ch in "0123456789abcdefABCDEF" for ch in value)
            if not valid_hex:
                errors.append(f"{path}:pattern_mismatch")
    if isinstance(value, list):
        if int(schema.get("minItems") or 0) and len(value) < int(schema.get("minItems") or 0):
            errors.append(f"{path}:min_items")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                errors.extend(_validate_schema_subset(item, item_schema, f"{path}[{index}]"))
    if isinstance(value, dict):
        for required in schema.get("required") or []:
            if required not in value:
                errors.append(f"{path}.{required}:required")
        properties = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
        for key, property_schema in properties.items():
            if key in value and isinstance(property_schema, dict):
                errors.extend(_validate_schema_subset(value[key], property_schema, f"{path}.{key}"))
    return errors


def validate_against_tool_schema(schema_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    schema = TOOL_SCHEMA_REGISTRY.get(str(schema_id or ""))
    if schema is None:
        return {
            "kind": "redteam_ax_v2_schema_validation",
            "schema_id": schema_id,
            "valid": False,
            "errors": ["schema_not_registered"],
        }
    errors = _validate_schema_subset(payload, schema)
    return {
        "kind": "redteam_ax_v2_schema_validation",
        "schema_id": schema_id,
        "schema_artifact_path": schema_artifact_path(schema_id),
        "valid": not errors,
        "errors": errors,
        "validated_at": now_utc(),
    }


def validate_tool_schema_payload(schema_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    document = payload.get("document") if isinstance(payload.get("document"), dict) else payload
    return validate_against_tool_schema(schema_id, document)


def guard_direct_mcp_invocation(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "RTA-MCP-DIRECT-DENY")
    denial = deny_direct_mcp_invocation(payload)
    denial["guard_id"] = stable_id(
        "MCP-DENY",
        [
            case_id,
            denial.get("server_id"),
            denial.get("tool_name"),
            denial.get("tool_class"),
            denial.get("audit", {}).get("arguments_hash"),
        ],
    )
    denial["artifact_path"] = write_json_artifact(case_id, "mcp-direct-denials", denial["guard_id"], denial)
    write_case_event(
        case_id,
        {
            "event": "mcp_direct_invocation_denied",
            "guard_id": denial["guard_id"],
            "server_id": denial.get("server_id"),
            "tool_name": denial.get("tool_name"),
            "tool_class": denial.get("tool_class"),
            "commands_executed_by_api": False,
            "mcp_server_invoked": False,
        },
    )
    return denial


def analysis_tool_profile(tool_id: str) -> dict[str, Any] | None:
    target = str(tool_id or "").strip().upper()
    for profile in ANALYSIS_TOOL_PROFILES:
        if profile["tool_id"].upper() == target or profile["name"].upper() == target:
            return dict(profile)
    return None


def profile_with_runtime_status(profile: dict[str, Any]) -> dict[str, Any]:
    wrapper_manifest = tool_wrapper_manifest_for_profile(profile)
    availability = wrapper_manifest["availability"]
    status = "registered"
    if profile.get("adapter_type") != "import_only" and availability["status"] == "missing":
        status = "registered_install_required"
    elif profile.get("adapter_type") != "import_only" and wrapper_manifest["pinning_status"] == "hash_unpinned":
        status = "registered_hash_pin_required"
    elif profile.get("adapter_type") != "import_only" and wrapper_manifest["pinning_status"] in {"hash_mismatch", "hash_unreadable"}:
        status = "registered_hash_verification_failed"
    elif wrapper_manifest["pinning_status"] == "hash_match":
        status = "registered_verified"
    return {
        **profile,
        "runtime_status": status,
        "availability": availability,
        "pinning_status": wrapper_manifest["pinning_status"],
        "wrapper_manifest": wrapper_manifest,
        "install_readiness": tool_install_readiness_for_profile(profile, wrapper_manifest),
        "llm_agent": ANALYSIS_AGENT_REGISTRY.get(str(profile.get("agent_id") or "")),
    }


def tool_install_readiness_for_profile(profile: dict[str, Any], wrapper_manifest: dict[str, Any] | None = None) -> dict[str, Any]:
    manifest = wrapper_manifest or tool_wrapper_manifest_for_profile(profile)
    catalog = TOOL_INSTALL_READINESS_CATALOG.get(str(profile.get("tool_id") or ""), {})
    adapter_type = str(profile.get("adapter_type") or "")
    pinning_status = str(manifest.get("pinning_status") or "")
    availability_status = str((manifest.get("availability") or {}).get("status") or "")
    blocking_controls: list[str] = []
    operator_actions: list[str] = []

    if adapter_type == "import_only":
        status = "import_only_ready"
        operator_actions.extend(["upload_tool_output_or_sbom", "validate_schema", "normalize_to_evidence_candidate"])
    elif availability_status == "missing":
        status = "install_required"
        blocking_controls.extend(["wrapper_binary_missing", "wrapper_sha256_pin_required"])
        operator_actions.extend(["install_from_official_source", "record_operator_version_evidence", "request_wrapper_pin"])
    elif pinning_status == "hash_match":
        status = "runner_ready"
        operator_actions.extend(["create_tool_action_card", "create_execution_plan", "run_safe_dry_run_or_manual_record"])
    elif pinning_status == "hash_unpinned":
        status = "hash_pin_required"
        blocking_controls.append("wrapper_sha256_pin_required")
        operator_actions.extend(["record_operator_version_evidence", "request_wrapper_pin", "red_team_lead_approve_pin"])
    elif pinning_status in {"hash_mismatch", "hash_unreadable"}:
        status = "verification_failed"
        blocking_controls.extend(["wrapper_hash_verification_failed", "human_review_required"])
        operator_actions.extend(["reinstall_or_review_binary", "revoke_or_rotate_wrapper_pin"])
    else:
        status = "review_required"
        blocking_controls.append("tool_install_state_unknown")
        operator_actions.append("human_review_required")

    return {
        "kind": "redteam_ax_v2_tool_install_readiness",
        "tool_id": profile.get("tool_id"),
        "tool_name": profile.get("name"),
        "status": status,
        "adapter_type": adapter_type,
        "risk_class": profile.get("risk_class"),
        "official_url": catalog.get("official_url") or "",
        "install_modes": catalog.get("install_modes") or [],
        "operator_install_commands": catalog.get("operator_install_commands") or [profile.get("installation_hint") or ""],
        "verification_commands": catalog.get("verification_commands") or [],
        "post_install_controls": catalog.get("post_install_controls") or ["pin_binary_sha256", "human_review"],
        "safe_smoke": catalog.get("safe_smoke") or "manual_review",
        "commands_executed_by_api": False,
        "wrapper_manifest": manifest,
        "blocking_controls": blocking_controls,
        "operator_actions": operator_actions,
        "runner_allowed_after": ["ToolActionCard", "ROE", "ExecutionPlan", "issued_execution_token", "wrapper_hash_pin"] if adapter_type != "import_only" else ["ToolActionCard", "schema_validation", "normalizer"],
        "evidence_pipeline": {
            "normalizer_id": profile.get("normalizer_id"),
            "analysis_agent_id": profile.get("agent_id"),
            "evidence_types": profile.get("evidence_types") or [],
            "trusted_as_instruction": False,
        },
        "checked_at": now_utc(),
    }


def list_analysis_tools() -> dict[str, Any]:
    tools = [profile_with_runtime_status(profile) for profile in ANALYSIS_TOOL_PROFILES]
    return {
        "kind": "redteam_ax_v2_analysis_tool_registry",
        "tool_count": len(tools),
        "tools": tools,
        "required_tools": ["nuclei", "openvas", "trivy", "sca", "npm audit", "owasp-zap"],
        "safe_by_default": True,
        "execution_policy": "ToolActionCard + ROE + HITL before active execution",
    }


def list_tool_install_readiness() -> dict[str, Any]:
    items = [
        tool_install_readiness_for_profile(profile, tool_wrapper_manifest_for_profile(profile))
        for profile in ANALYSIS_TOOL_PROFILES
    ]
    ready_count = sum(1 for item in items if item["status"] in {"runner_ready", "import_only_ready"})
    blocked_count = sum(1 for item in items if item["blocking_controls"])
    return {
        "kind": "redteam_ax_v2_tool_install_readiness_registry",
        "tool_count": len(items),
        "ready_count": ready_count,
        "blocked_count": blocked_count,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "policy": "Install and verification commands are operator-run plans; API never installs tools automatically.",
        "items": items,
    }


def tool_credential_policy(tool_id: str) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    resolved_tool_id = str((profile or {}).get("tool_id") or tool_id or "").strip()
    policy = dict(TOOL_CREDENTIAL_POLICY_CATALOG.get(resolved_tool_id) or {})
    if not profile or not policy:
        return {
            "kind": "redteam_ax_v2_tool_credential_policy",
            "tool_id": resolved_tool_id,
            "status": "not_supported",
            "supported": False,
            "errors": ["credential_policy_not_supported_for_tool"],
            "commands_executed_by_api": False,
            "secret_material_stored": False,
            "trusted_as_instruction": False,
            "checked_at": now_utc(),
        }
    return {
        "kind": "redteam_ax_v2_tool_credential_policy",
        **policy,
        "status": "supported",
        "supported": True,
        "risk_class": profile.get("risk_class"),
        "commands_executed_by_api": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "requires_human_approval": True,
        "approval_roles": sorted(TOOL_CREDENTIAL_VAULT_APPROVER_ROLES),
        "evidence_pipeline": {
            "tracked_as": "Evidence Card metadata and Claim-Evidence Matrix input",
            "trusted_as_instruction": False,
            "requires_human_validation": True,
        },
        "checked_at": now_utc(),
    }


def list_tool_credential_policies() -> dict[str, Any]:
    policies = [tool_credential_policy(tool_id) for tool_id in TOOL_CREDENTIAL_POLICY_CATALOG]
    return {
        "kind": "redteam_ax_v2_tool_credential_policy_registry",
        "policy_count": len(policies),
        "tool_ids": sorted(TOOL_CREDENTIAL_POLICY_CATALOG),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "secret_material_stored": False,
        "policy": "OpenVAS and ZAP credentials are stored outside RedTeam AX; this registry only authorizes read-only external vault references.",
        "items": policies,
    }


def _payload_contains_secret_material(payload: dict[str, Any]) -> bool:
    secret_keys = {
        "api_key",
        "apikey",
        "token",
        "bearer_token",
        "password",
        "secret",
        "cookie",
        "client_secret",
        "private_key",
        "secret_value",
    }
    for key, value in payload.items():
        normalized = str(key or "").strip().lower().replace("-", "_")
        if normalized in secret_keys and str(value or "").strip():
            return True
    return bool(payload.get("secret_material_present"))


def authorize_tool_credential_reference(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    resolved_tool_id = str((profile or {}).get("tool_id") or tool_id or "").strip()
    policy = tool_credential_policy(resolved_tool_id)
    case_id = str(payload.get("case_id") or "CASE-V2-TOOL-CREDENTIAL-VAULT").strip()
    credential_ref = str(payload.get("credential_ref") or payload.get("vault_ref") or "").strip()
    endpoint_ref = str(payload.get("endpoint_ref") or payload.get("endpoint_url") or "").strip()
    requested_scopes = sorted({str(scope or "").strip() for scope in (payload.get("token_scopes") or payload.get("scopes") or []) if str(scope or "").strip()})
    purpose = str(payload.get("purpose") or "").strip()
    target_scope_refs = [str(item or "").strip() for item in (payload.get("target_scope_refs") or []) if str(item or "").strip()]
    read_only = bool(payload.get("read_only"))
    actor_context = actor_context_from_payload(payload)
    approver = str(payload.get("approved_by") or actor_context.get("actor_id") or "").strip().lower()
    approver_role = requested_actor_role(payload, actor_context.get("actor_role"))
    errors: list[str] = []

    if not profile:
        errors.append("tool_profile_not_registered")
    if not policy.get("supported"):
        errors.append("credential_policy_not_supported_for_tool")
    if not case_id:
        errors.append("case_id_required")
    if not credential_ref:
        errors.append("credential_ref_required")
    elif not credential_ref.startswith(("vault://", "secret://", "external-vault://")):
        errors.append("credential_ref_must_be_external_vault_reference")
    if _payload_contains_secret_material(payload):
        errors.append("secret_material_must_not_be_submitted")
    if not endpoint_ref:
        errors.append("endpoint_ref_required")
    if not requested_scopes:
        errors.append("token_scopes_required")
    allowed_scopes = set(policy.get("allowed_token_scopes") or [])
    prohibited_scopes = set(policy.get("prohibited_token_scopes") or [])
    if requested_scopes and not set(requested_scopes).issubset(allowed_scopes):
        errors.append("token_scopes_must_be_read_only_allowlist")
    if prohibited_scopes.intersection(requested_scopes):
        errors.append("prohibited_token_scope_requested")
    if not read_only:
        errors.append("read_only_true_required")
    if not purpose:
        errors.append("purpose_required")
    if not target_scope_refs:
        errors.append("target_scope_refs_required")
    if approver_role not in TOOL_CREDENTIAL_VAULT_APPROVER_ROLES:
        errors.append("approver_role_not_authorized_for_credential_vault")
    if actor_context.get("errors"):
        errors.extend(f"actor_context:{error}" for error in actor_context.get("errors") or [])
    if not actor_context.get("authenticated"):
        errors.append("authenticated_actor_required")
    if approver and actor_context.get("actor_id") and approver != actor_context.get("actor_id"):
        errors.append("approver_must_match_authenticated_actor")

    authorization_id = str(payload.get("authorization_id") or stable_id(
        "TCRED",
        [case_id, resolved_tool_id, credential_ref, endpoint_ref, requested_scopes, approver, now_utc()],
    ))
    result = {
        "kind": "redteam_ax_v2_tool_credential_authorization",
        "authorization_id": authorization_id,
        "case_id": case_id,
        "tool_id": resolved_tool_id,
        "tool_name": (profile or {}).get("name") or policy.get("tool_name") or "",
        "status": "invalid" if errors else "authorized",
        "credential_ref": credential_ref if not _payload_contains_secret_material(payload) else "",
        "endpoint_ref": endpoint_ref,
        "token_scopes": requested_scopes,
        "read_only": read_only,
        "purpose": purpose,
        "target_scope_refs": target_scope_refs,
        "approved_by": approver,
        "approver_role": approver_role,
        "approved_at": now_utc() if not errors else None,
        "expires_at": str(payload.get("expires_at") or "").strip() or None,
        "commands_executed_by_api": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "runner_unlocks": [],
        "policy": {
            "credential_mode": policy.get("credential_mode"),
            "read_only_required": policy.get("read_only_required"),
            "allowed_token_scopes": policy.get("allowed_token_scopes") or [],
            "secret_material_policy": policy.get("secret_material_policy"),
            "runner_policy": policy.get("runner_policy"),
        },
        "actor_context": {
            "actor_id": actor_context.get("actor_id"),
            "actor_role": actor_context.get("actor_role"),
            "auth_provider": actor_context.get("auth_provider"),
            "identity_binding": "bound" if actor_context.get("authenticated") and not errors else "invalid",
        },
        "errors": errors,
    }
    if errors:
        return result
    stored = append_artifact_metadata(result, "tool-credential-authorizations", authorization_id)
    write_case_event(case_id, {
        "event": "tool_credential_reference_authorized",
        "authorization_id": authorization_id,
        "tool_id": resolved_tool_id,
        "credential_ref": credential_ref,
        "read_only": True,
        "secret_material_stored": False,
        "commands_executed_by_api": False,
    })
    return stored


def list_tool_credential_authorizations(case_id: str | None = None, tool_id: str | None = None) -> dict[str, Any]:
    records = list_json_artifacts(case_id, "tool-credential-authorizations")
    normalized_tool_id = str(tool_id or "").strip().upper()
    if normalized_tool_id:
        records = [record for record in records if str(record.get("tool_id") or "").upper() == normalized_tool_id]
    return {
        "kind": "redteam_ax_v2_tool_credential_authorization_registry",
        "case_id": case_id,
        "tool_id": tool_id,
        "authorization_count": len(records),
        "tool_ids_with_authorization": sorted({str(record.get("tool_id") or "") for record in records if record.get("tool_id")}),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "items": records,
    }


def _service_import_content_type(tool_id: str) -> str:
    if tool_id == "TOOL-OPENVAS-001":
        return "application/xml"
    if tool_id == "TOOL-ZAP-001":
        return "application/json"
    return "text/plain"


def _service_import_filename(tool_id: str) -> str:
    if tool_id == "TOOL-OPENVAS-001":
        return "openvas-report.xml"
    if tool_id == "TOOL-ZAP-001":
        return "zap-alerts.json"
    return "service-report.txt"


def _service_import_endpoint_allowed(endpoint_url: str, endpoint_ref: str, target_scope_refs: list[str]) -> tuple[bool, list[str], dict[str, Any]]:
    errors: list[str] = []
    parsed = urlparse(endpoint_url)
    ref = str(endpoint_ref or "").strip().rstrip("/")
    endpoint = endpoint_url.strip().rstrip("/")
    if parsed.scheme not in {"http", "https"}:
        errors.append("endpoint_url_scheme_must_be_http_or_https")
    if parsed.username or parsed.password:
        errors.append("endpoint_url_must_not_embed_credentials")
    if not parsed.hostname:
        errors.append("endpoint_url_host_required")
    query_lower = (parsed.query or "").lower()
    if any(token in query_lower for token in ["api_key", "apikey", "token", "password", "secret", "cookie"]):
        errors.append("endpoint_url_query_must_not_contain_secret_material")
    if ref and endpoint != ref and not endpoint.startswith(f"{ref}/"):
        errors.append("endpoint_url_must_match_authorized_endpoint_ref")
    if parsed.hostname not in SERVICE_IMPORT_LOOPBACK_HOSTS and not target_scope_refs:
        errors.append("target_scope_refs_required_for_non_loopback_service_endpoint")
    return not errors, errors, {
        "scheme": parsed.scheme,
        "host": parsed.hostname,
        "path": parsed.path,
        "loopback": parsed.hostname in SERVICE_IMPORT_LOOPBACK_HOSTS if parsed.hostname else False,
    }


def _fetch_service_report(endpoint_url: str, accept: str, timeout: int) -> tuple[str, dict[str, Any], list[str]]:
    errors: list[str] = []
    try:
        request = Request(endpoint_url, method="GET", headers={"Accept": accept, "User-Agent": "RedTeam-AX-service-import/1.0"})
        with urlopen(request, timeout=timeout) as response:
            content = response.read(MAX_SERVICE_REPORT_BYTES + 1)
            if len(content) > MAX_SERVICE_REPORT_BYTES:
                errors.append("service_report_exceeds_max_bytes")
                content = content[:MAX_SERVICE_REPORT_BYTES]
            text = content.decode("utf-8", errors="replace")
            metadata = {
                "status_code": getattr(response, "status", None),
                "content_type": response.headers.get("Content-Type", ""),
                "bytes_read": len(content),
            }
            return text, metadata, errors
    except HTTPError as exc:
        return "", {"status_code": exc.code, "reason": str(exc.reason)}, [f"service_endpoint_http_error:{exc.code}"]
    except URLError as exc:
        return "", {"reason": str(exc.reason)}, ["service_endpoint_unreachable"]
    except TimeoutError:
        return "", {"timeout": True}, ["service_endpoint_timeout"]


def import_scanner_service_report(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    resolved_tool_id = str(tool_id or "").strip().upper()
    profile = analysis_tool_profile(resolved_tool_id)
    case_id = str(payload.get("case_id") or "CASE-V2-SERVICE-IMPORT-001").strip()
    action_id = str(payload.get("action_id") or stable_id("TAC", [case_id, resolved_tool_id, "service-report-import"])).strip()
    authorization_id = str(payload.get("authorization_id") or payload.get("credential_authorization_id") or "").strip()
    endpoint_url = str(payload.get("endpoint_url") or "").strip()
    target_scope_refs = [str(item or "").strip() for item in (payload.get("target_scope_refs") or []) if str(item or "").strip()]
    requested_by = str(payload.get("requested_by") or "analyst@example.com").strip()
    timeout = int(payload.get("timeout") or 10)
    errors: list[str] = []

    if resolved_tool_id not in SERVICE_IMPORT_TOOLS:
        errors.append("service_report_import_supported_only_for_openvas_or_zap")
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not case_id:
        errors.append("case_id_required")
    if not authorization_id:
        errors.append("credential_authorization_id_required")
    if not endpoint_url and "raw_report" not in payload:
        errors.append("endpoint_url_or_raw_report_required")
    if _payload_contains_secret_material(payload):
        errors.append("secret_material_must_not_be_submitted")
    prohibited = {"active_scan", "attack_mode", "spider", "start_scan", "delete_task", "write_context"}
    if any(bool(payload.get(key)) for key in prohibited):
        errors.append("active_or_mutating_service_operation_prohibited")

    authorization = load_json_record(authorization_id, "tool-credential-authorizations", case_id) if authorization_id else None
    if authorization is None and authorization_id:
        records = list_tool_credential_authorizations(case_id=case_id, tool_id=resolved_tool_id).get("items") or []
        authorization = next((item for item in records if item.get("authorization_id") == authorization_id), None)
    if authorization is None:
        errors.append("authorized_read_only_credential_reference_required")
    elif authorization.get("status") != "authorized":
        errors.append("credential_authorization_must_be_authorized")
    elif str(authorization.get("tool_id") or "").upper() != resolved_tool_id:
        errors.append("credential_authorization_tool_mismatch")
    elif not authorization.get("read_only"):
        errors.append("credential_authorization_must_be_read_only")

    endpoint_policy: dict[str, Any] = {}
    if endpoint_url and authorization is not None:
        allowed, endpoint_errors, endpoint_policy = _service_import_endpoint_allowed(
            endpoint_url,
            str(authorization.get("endpoint_ref") or ""),
            target_scope_refs or list(authorization.get("target_scope_refs") or []),
        )
        if not allowed:
            errors.extend(endpoint_errors)

    content_type = _service_import_content_type(resolved_tool_id)
    raw_report = payload.get("raw_report")
    service_fetch: dict[str, Any] = {
        "method": "provided_report",
        "executed": False,
        "commands_executed_by_api": False,
    }
    if raw_report is None and not errors:
        fetched, fetch_metadata, fetch_errors = _fetch_service_report(endpoint_url, content_type, timeout)
        raw_report = fetched
        service_fetch = {
            "method": "http_get",
            "executed": True,
            "commands_executed_by_api": False,
            "scanner_commands_executed_by_api": False,
            "endpoint": endpoint_policy,
            "metadata": fetch_metadata,
        }
        errors.extend(fetch_errors)
    raw_text = raw_value_to_text(raw_report) if raw_report is not None else ""
    if not raw_text:
        errors.append("service_report_empty")

    if errors:
        return {
            "kind": "redteam_ax_v2_scanner_service_report_import",
            "case_id": case_id,
            "tool_id": resolved_tool_id,
            "status": "invalid",
            "errors": errors,
            "authorization_id": authorization_id,
            "endpoint_url": endpoint_url,
            "service_fetch": service_fetch,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "secret_material_stored": False,
        }

    action = load_tool_action(action_id, case_id)
    if action is None:
        action = plan_tool_action({
            "case_id": case_id,
            "action_id": action_id,
            "title": payload.get("title") or f"{(profile or {}).get('display_name') or resolved_tool_id} 읽기 전용 서비스 결과 가져오기",
            "objective": payload.get("objective") or "승인된 읽기 전용 scanner service endpoint에서 report/alert 결과를 가져와 증거 후보로 정규화한다.",
            "tool_id": resolved_tool_id,
            "risk_class": "T1",
            "requested_by": requested_by,
            "target_scope_refs": target_scope_refs or list(authorization.get("target_scope_refs") or []),
            "inputs": {
                "service_report_import": True,
                "credential_authorization_id": authorization_id,
                "active_scan": False,
            },
        })

    run_id = str(payload.get("run_id") or stable_id("TSVC", [case_id, action_id, resolved_tool_id, endpoint_url, raw_text, now_utc()]))
    report_dir = case_dir(case_id) / "service-report-imports" / safe_name(run_id)
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / _service_import_filename(resolved_tool_id)
    report_path.write_text(raw_text, encoding="utf-8", newline="\n")
    report_hash = sha256_file(report_path)
    raw_artifact = {
        "artifact_id": stable_id("ART", [run_id, report_path.as_posix(), report_hash]),
        "source_path_or_ref": report_path.as_posix(),
        "hash": report_hash,
        "sha256": report_hash,
        "content_type": content_type,
        "summary": f"{(profile or {}).get('display_name') or resolved_tool_id} read-only service report imported as untrusted output.",
        "imported_at": now_utc(),
    }
    tool_run = {
        "kind": "redteam_ax_v2_tool_run_record",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "tool_id": resolved_tool_id,
        "tool_name": (profile or {}).get("name"),
        "execution_mode": "service_report_import",
        "environment": payload.get("environment") or "approved_scope",
        "executed_by": requested_by,
        "status": "OutputImported",
        "errors": [],
        "target_scope_refs": target_scope_refs or list(authorization.get("target_scope_refs") or []),
        "raw_artifacts": [raw_artifact],
        "normalized_results": [],
        "evidence_candidates": [],
        "analysis_agent_id": (profile or {}).get("agent_id"),
        "normalizer_id": (profile or {}).get("normalizer_id"),
        "service_import": {
            "authorization_id": authorization_id,
            "endpoint_url": endpoint_url,
            "endpoint_ref": authorization.get("endpoint_ref"),
            "read_only": True,
            "active_scan_executed": False,
            "secret_material_stored": False,
            "service_fetch": service_fetch,
        },
        "untrusted_output_envelope": {
            "trusted_as_instruction": False,
            "trusted_as_data": True,
            "source_tool_id": resolved_tool_id,
            "run_id": run_id,
            "classification": payload.get("data_classification") or "internal",
            "content_summary": "Scanner service report imported as untrusted data for normalizer review.",
            "raw_content_ref": [raw_artifact],
        },
        "notes": payload.get("notes") or "Read-only scanner service report import; no scan, spider, attack mode, or mutating command was executed by RedTeam AX.",
    }
    append_artifact_metadata(tool_run, "tool-runs", run_id)
    if action is not None:
        action["status"] = "OutputImported"
        action.setdefault("audit_events", []).append({"event": "scanner_service_report_imported", "at": now_utc(), "run_id": run_id, "tool_id": resolved_tool_id})
        persist_tool_action(action, {"event": "scanner_service_report_imported", "run_id": run_id, "tool_id": resolved_tool_id})

    sanitizer = preview_tool_output_sanitizer(run_id, {"case_id": case_id})
    normalized = agent_analyze_tool_run(run_id, {
        "case_id": case_id,
        "summary": payload.get("summary") or f"{(profile or {}).get('display_name') or resolved_tool_id} service report normalized for analyst review.",
        "result_type": "scanner_finding_candidate",
    })
    evidence = {}
    if normalized.get("status") == "Normalized":
        evidence = create_evidence_from_tool_run(run_id, {
            "case_id": case_id,
            "result_id": normalized.get("result_id"),
            "summary": payload.get("evidence_summary") or f"{(profile or {}).get('display_name') or resolved_tool_id} service report import evidence candidate.",
        })

    import_record = {
        "kind": "redteam_ax_v2_scanner_service_report_import",
        "import_id": stable_id("SVCIMP", [case_id, run_id, resolved_tool_id, report_hash]),
        "case_id": case_id,
        "tool_id": resolved_tool_id,
        "tool_name": (profile or {}).get("name"),
        "status": "passed" if normalized.get("status") == "Normalized" and evidence.get("status") != "invalid" else "failed",
        "errors": [] if normalized.get("status") == "Normalized" else normalized.get("errors", []),
        "authorization_id": authorization_id,
        "endpoint_url": endpoint_url,
        "service_fetch": service_fetch,
        "tool_run": {
            "run_id": run_id,
            "status": tool_run.get("status"),
            "artifact_path": tool_run.get("artifact_path"),
        },
        "sanitize_preview": {
            "status": sanitizer.get("status"),
            "trusted_as_instruction": sanitizer.get("trusted_as_instruction"),
        },
        "agent_analyze": {
            "status": normalized.get("status"),
            "result_id": normalized.get("result_id"),
            "parser_report": normalized.get("parser_report"),
            "structured_item_count": len(normalized.get("structured_items") or []),
        },
        "evidence": {
            "status": evidence.get("status"),
            "evidence_id": evidence.get("evidence_id"),
            "artifact_path": evidence.get("artifact_path"),
        },
        "policy": {
            "read_only": True,
            "active_scan_executed": False,
            "scanner_commands_executed_by_api": False,
            "secret_material_stored": False,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
        },
        "created_at": now_utc(),
    }
    return append_artifact_metadata(import_record, "service-report-imports", import_record["import_id"])


def record_tool_install_version_evidence(tool_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    case_id = str(payload.get("case_id") or TOOL_WRAPPER_PIN_CASE_ID)
    operator = str(payload.get("operator") or payload.get("recorded_by") or "").strip()
    operator_role = str(payload.get("operator_role") or "").strip()
    install_mode = str(payload.get("install_mode") or "").strip()
    version_command = str(payload.get("version_command") or "").strip()
    version_output_excerpt = str(payload.get("version_output_excerpt") or payload.get("version_output") or "").strip()
    executed_by_operator = bool(payload.get("version_command_executed_by_operator"))
    evidence_id = str(payload.get("evidence_id") or stable_id(
        "TIE",
        [case_id, tool_id, operator, install_mode, version_command, version_output_excerpt],
    ))
    errors: list[str] = []
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not operator:
        errors.append("operator_required")
    if not install_mode:
        errors.append("install_mode_required")
    if not version_command:
        errors.append("version_command_required")
    if not version_output_excerpt:
        errors.append("version_output_excerpt_required")
    if not executed_by_operator:
        errors.append("version_command_must_be_executed_by_operator")

    output_sha256 = hashlib.sha256(version_output_excerpt.encode("utf-8")).hexdigest() if version_output_excerpt else ""
    catalog = TOOL_INSTALL_READINESS_CATALOG.get(str((profile or {}).get("tool_id") or tool_id), {})
    record = {
        "kind": "redteam_ax_v2_tool_install_version_evidence",
        "status": "invalid" if errors else "recorded",
        "case_id": case_id,
        "evidence_id": evidence_id,
        "tool_id": (profile or {}).get("tool_id") or tool_id,
        "tool_name": (profile or {}).get("name") or str(tool_id),
        "adapter_type": (profile or {}).get("adapter_type") or "",
        "install_mode": install_mode,
        "official_url": catalog.get("official_url") or "",
        "version_command": version_command,
        "verification_commands": catalog.get("verification_commands") or [],
        "version_output_excerpt": version_output_excerpt[:4000],
        "version_output_sha256": output_sha256,
        "version_command_executed_by_operator": executed_by_operator,
        "operator": operator,
        "operator_role": operator_role,
        "recorded_at": now_utc(),
        "commands_executed_by_api": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "evidence_pipeline": {
            "normalizer_id": (profile or {}).get("normalizer_id"),
            "analysis_agent_id": (profile or {}).get("agent_id"),
            "trusted_as_instruction": False,
            "claim_use": "tool_install_or_version_evidence_only",
        },
        "runner_unlocks": [],
        "policy": "Version evidence is operator-attested data; it does not execute, install, or approve tool runs.",
        "errors": errors,
    }
    if errors:
        return record
    record["artifact_path"] = write_json_artifact(case_id, "tool-install-evidence", evidence_id, record)
    record["audit_log_path"] = write_case_event(case_id, {
        "event": "tool_install_version_evidence_recorded",
        "evidence_id": evidence_id,
        "tool_id": record["tool_id"],
        "artifact_path": record["artifact_path"],
        "commands_executed_by_api": False,
    })
    return record


def list_tool_install_version_evidence(case_id: str | None = None, tool_id: str | None = None) -> dict[str, Any]:
    records = list_json_artifacts(case_id, "tool-install-evidence")
    normalized_tool_id = str(tool_id or "").strip().upper()
    if normalized_tool_id:
        records = [
            record for record in records
            if str(record.get("tool_id") or "").upper() == normalized_tool_id
            or str(record.get("tool_name") or "").upper() == normalized_tool_id
        ]
    tool_ids_with_evidence = sorted({
        str(record.get("tool_id"))
        for record in records
        if record.get("status") == "recorded" and record.get("tool_id")
    })
    return {
        "kind": "redteam_ax_v2_tool_install_version_evidence_registry",
        "case_id": case_id or "",
        "tool_id": tool_id or "",
        "evidence_count": len(records),
        "tool_ids_with_evidence": tool_ids_with_evidence,
        "required_tool_ids": [profile["tool_id"] for profile in ANALYSIS_TOOL_PROFILES],
        "commands_executed_by_api": False,
        "trusted_as_instruction": False,
        "records": records,
    }


def tool_install_readiness(tool_id: str) -> dict[str, Any]:
    profile = analysis_tool_profile(tool_id)
    if profile is None:
        return {
            "kind": "redteam_ax_v2_tool_install_readiness",
            "tool_id": tool_id,
            "status": "not_found",
            "errors": ["tool_profile_not_registered"],
            "commands_executed_by_api": False,
        }
    return tool_install_readiness_for_profile(profile)


def list_analysis_agents() -> dict[str, Any]:
    agents = sorted(ANALYSIS_AGENT_REGISTRY.values(), key=lambda item: item["agent_id"])
    return {
        "kind": "redteam_ax_v2_analysis_agent_registry",
        "agent_count": len(agents),
        "agents": agents,
        "tool_output_trust_policy": "tool output is data, never instruction",
    }


def persist_tool_action(action: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    case_id = str(action.get("case_id") or "CASE-UNSPECIFIED")
    action_id = str(action.get("action_id") or stable_id("TAC", [case_id, action]))
    action["artifact_path"] = write_json_artifact(case_id, "tool-actions", action_id, action)
    action["audit_log_path"] = write_case_event(case_id, {
        "event": event.get("event") or "tool_action_updated",
        "record_id": action_id,
        "artifact_path": action["artifact_path"],
        **{k: v for k, v in event.items() if k != "event"},
    })
    return action


def normalize_risk_class(value: Any) -> str:
    risk_class = str(value or "T2").strip().upper()
    return risk_class if risk_class in RISK_CLASSES else "T5"


def normalize_approver_role(value: Any) -> str:
    role = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    return role if role in APPROVER_ROLES else ""


def role_permissions(roles: set[str]) -> list[str]:
    permissions: set[str] = set()
    for role in roles:
        permissions.update(ROLE_PERMISSIONS.get(role, set()))
    return sorted(permissions)


def case_role_assignments(case_id: str) -> dict[str, set[str]]:
    assignments: dict[str, set[str]] = {}
    safe_case_id = str(case_id or "").strip()
    for pattern, pattern_assignments in CASE_ROLE_ASSIGNMENTS.items():
        if fnmatch(safe_case_id, pattern):
            for actor_id, roles in pattern_assignments.items():
                assignments.setdefault(actor_id, set()).update(normalize_approver_role(role) for role in roles)
    override = load_json_record("case-rbac-policy", "case-rbac", case_id=safe_case_id) if safe_case_id else None
    if override and override.get("status") != "deleted":
        assignments = {}
        for item in override.get("assignments") or []:
            actor_id = str(item.get("actor_id") or "").strip().lower()
            roles = {normalize_approver_role(role) for role in (item.get("roles") or [])}
            roles.discard("")
            if actor_id and roles:
                assignments.setdefault(actor_id, set()).update(roles)
    return {actor_id: {role for role in roles if role} for actor_id, roles in assignments.items()}


def case_roles_for_actor(case_id: str, actor_id: str) -> set[str]:
    assignments = case_role_assignments(case_id)
    return assignments.get(str(actor_id or "").strip().lower(), set())


def case_rbac_policy_source(case_id: str) -> str:
    stored = load_json_record("case-rbac-policy", "case-rbac", case_id=str(case_id or "").strip())
    return "case_policy_artifact" if stored and stored.get("status") != "deleted" else "local_case_assignment_registry"


def case_rbac_policy(case_id: str) -> dict[str, Any]:
    assignments = case_role_assignments(case_id)
    stored = load_json_record("case-rbac-policy", "case-rbac", case_id=str(case_id or "").strip())
    return {
        "kind": "redteam_ax_v2_case_rbac_policy",
        "case_id": str(case_id or "").strip(),
        "assignment_count": len(assignments),
        "assignments": [
            {
                "actor_id": actor_id,
                "roles": sorted(roles),
                "permissions": role_permissions(roles),
            }
            for actor_id, roles in sorted(assignments.items())
        ],
        "policy_source": case_rbac_policy_source(case_id),
        "policy_id": (stored or {}).get("policy_id"),
        "updated_at": (stored or {}).get("updated_at"),
    }


def normalize_case_rbac_assignments(raw_assignments: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    assignments: list[dict[str, Any]] = []
    errors: list[str] = []
    seen: set[str] = set()
    for index, item in enumerate(raw_assignments):
        actor_id = str(item.get("actor_id") or "").strip().lower()
        roles = sorted({normalize_approver_role(role) for role in (item.get("roles") or []) if normalize_approver_role(role)})
        if not actor_id:
            errors.append(f"assignments[{index}].actor_id_required")
            continue
        if actor_id not in ACTOR_DIRECTORY:
            errors.append(f"assignments[{index}].actor_not_registered")
        if not roles:
            errors.append(f"assignments[{index}].roles_required")
        actor_roles = {normalize_approver_role(role) for role in ACTOR_DIRECTORY.get(actor_id, {}).get("roles", set())}
        unauthorized = [role for role in roles if role not in actor_roles]
        if unauthorized:
            errors.append(f"assignments[{index}].roles_not_authorized_for_actor:{','.join(unauthorized)}")
        if actor_id in seen:
            errors.append(f"assignments[{index}].duplicate_actor")
        seen.add(actor_id)
        if actor_id and roles:
            assignments.append({
                "actor_id": actor_id,
                "roles": roles,
                "permissions": role_permissions(set(roles)),
            })
    return assignments, errors


def upsert_case_rbac_policy(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    resolved_case_id = str(case_id or payload.get("case_id") or "").strip()
    assignments, errors = normalize_case_rbac_assignments(payload.get("assignments") or [])
    if not resolved_case_id:
        errors.append("case_id_required")
    if not assignments:
        errors.append("assignments_required")
    required_roles = set(payload.get("required_roles") or [])
    assignment_roles = {role for item in assignments for role in item["roles"]}
    missing_required_roles = sorted(normalize_approver_role(role) for role in required_roles if normalize_approver_role(role) and normalize_approver_role(role) not in assignment_roles)
    if missing_required_roles:
        errors.append(f"required_roles_missing:{','.join(missing_required_roles)}")

    policy_id = "case-rbac-policy"
    result = {
        "kind": "redteam_ax_v2_case_rbac_policy",
        "policy_id": policy_id,
        "case_id": resolved_case_id,
        "status": "invalid" if errors else "active",
        "assignments": assignments,
        "assignment_count": len(assignments),
        "required_roles": sorted(required_roles),
        "policy_source": "case_policy_artifact",
        "updated_by": str(payload.get("updated_by") or "").strip(),
        "updated_at": now_utc() if not errors else None,
        "errors": errors,
    }
    return append_artifact_metadata(result, "case-rbac", policy_id)


def add_case_rbac_assignment(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    policy = case_rbac_policy(case_id)
    assignments = [
        {"actor_id": item["actor_id"], "roles": item["roles"]}
        for item in policy.get("assignments") or []
        if item.get("actor_id") != str(payload.get("actor_id") or "").strip().lower()
    ]
    assignments.append({"actor_id": payload.get("actor_id"), "roles": payload.get("roles") or []})
    return upsert_case_rbac_policy(case_id, {**payload, "assignments": assignments})


def delete_case_rbac_assignment(case_id: str, actor_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    target_actor = str(actor_id or "").strip().lower()
    policy = case_rbac_policy(case_id)
    assignments = [
        {"actor_id": item["actor_id"], "roles": item["roles"]}
        for item in policy.get("assignments") or []
        if item.get("actor_id") != target_actor
    ]
    if len(assignments) == len(policy.get("assignments") or []):
        result = {
            "kind": "redteam_ax_v2_case_rbac_assignment_delete",
            "case_id": case_id,
            "actor_id": target_actor,
            "status": "invalid",
            "errors": ["assignment_not_found"],
        }
        return append_artifact_metadata(result, "case-rbac-events", stable_id("CRBE", [case_id, target_actor, now_utc()]))
    return upsert_case_rbac_policy(case_id, {**payload, "assignments": assignments})


def requested_actor_role(payload: dict[str, Any], fallback: Any = "") -> str:
    return normalize_approver_role(
        fallback
        or payload.get("approver_role")
        or payload.get("reviewer_role")
        or payload.get("role")
        or ""
    )


def resolve_actor_context(
    payload: dict[str, Any] | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
    session_token: str | None = None,
) -> dict[str, Any]:
    payload = payload or {}
    raw_actor_id = str(actor_id or "").strip().lower()
    raw_session = str(session_token or "").strip()
    case_id = str(payload.get("case_id") or "").strip()
    provider = "request_headers"
    auth_strength = "header_bound"
    errors: list[str] = []

    if raw_session.startswith("dev:"):
        raw_actor_id = raw_session[4:].strip().lower()
        provider = "local_dev_session"
        auth_strength = "session_bound"

    requested_role = requested_actor_role(payload, actor_role)
    profile = ACTOR_DIRECTORY.get(raw_actor_id)
    assigned_roles = {normalize_approver_role(role) for role in (profile or {}).get("roles", set())}
    assigned_roles.discard("")
    case_roles = case_roles_for_actor(case_id, raw_actor_id) if case_id else set()
    effective_roles = assigned_roles & case_roles if case_id else assigned_roles
    authenticated = bool(profile)

    if raw_actor_id and not authenticated:
        errors.append("actor_not_registered")
    if case_id and authenticated and not case_roles:
        errors.append("actor_not_assigned_to_case")
    if requested_role and authenticated and requested_role not in assigned_roles:
        errors.append("actor_role_not_authorized_for_actor")
    if requested_role and authenticated and case_id and requested_role in assigned_roles and requested_role not in case_roles:
        errors.append("actor_role_not_assigned_to_case")

    return {
        "case_id": case_id,
        "actor_id": raw_actor_id,
        "actor_role": requested_role if requested_role in effective_roles else "",
        "requested_role": requested_role,
        "roles": sorted(assigned_roles),
        "case_roles": sorted(case_roles),
        "effective_roles": sorted(effective_roles),
        "permissions": role_permissions(effective_roles),
        "authenticated": authenticated and not errors,
        "auth_provider": provider,
        "auth_strength": auth_strength,
        "source": provider,
        "display_name": str((profile or {}).get("display_name") or "").strip(),
        "case_policy_source": case_rbac_policy_source(case_id) if case_id else None,
        "errors": errors,
    }


def actor_context_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    context = payload.get("_actor_context") or {}
    if context.get("resolved"):
        return dict(context)
    return resolve_actor_context(
        payload,
        actor_id=str(context.get("actor_id") or "").strip(),
        actor_role=str(context.get("actor_role") or "").strip(),
        session_token=str(context.get("session_token") or "").strip(),
    ) | {"resolved": True}


def approval_actor_binding_errors(payload: dict[str, Any], approver: str, approver_role: str) -> tuple[dict[str, Any], list[str]]:
    actor_context = actor_context_from_payload(payload)
    errors: list[str] = []
    if not actor_context["actor_id"]:
        errors.append("actor_context_required")
    if not actor_context["actor_role"]:
        errors.append("actor_role_required")
    if actor_context.get("errors"):
        errors.extend(actor_context["errors"])
    if actor_context["actor_id"] and not actor_context.get("authenticated"):
        errors.append("actor_context_not_authenticated")
    if approver and actor_context["actor_id"] and approver.strip().lower() != actor_context["actor_id"]:
        errors.append("approver_must_match_authenticated_actor")
    if approver_role and actor_context["actor_role"] and approver_role != actor_context["actor_role"]:
        errors.append("approver_role_must_match_authenticated_actor_role")
    return actor_context, errors


def approval_policy_for(action: dict[str, Any]) -> dict[str, Any]:
    risk_class = normalize_risk_class(action.get("risk_class"))
    environment = str(action.get("environment") or "").strip().lower()
    action_type = str(action.get("action_type") or "").strip().lower()
    required_roles: list[str] = []
    approval_mode = "none"

    if risk_class == "T3":
        required_roles = ["red_team_lead"]
        approval_mode = "single_lead"
    elif risk_class == "T4":
        required_roles = ["control_team"]
        approval_mode = "control_team"
    elif risk_class == "T5" or environment == "controlled_production_execute" or action_type == "controlled_production_execute":
        required_roles = ["control_team", "second_approver"]
        approval_mode = "two_person"

    return {
        "approval_mode": approval_mode,
        "required_approver_roles": required_roles,
        "requires_distinct_approvers": approval_mode == "two_person",
    }


def approved_roles_for(action: dict[str, Any]) -> set[str]:
    decisions = action.get("approval_decisions") or []
    return {
        normalize_approver_role(decision.get("approver_role"))
        for decision in decisions
        if str(decision.get("decision") or "").lower() == "approve"
    } - {""}


def approved_actors_for(action: dict[str, Any]) -> set[str]:
    decisions = action.get("approval_decisions") or []
    return {
        str(decision.get("approver") or "").strip().lower()
        for decision in decisions
        if str(decision.get("decision") or "").lower() == "approve"
    } - {""}


def approval_status_for(action: dict[str, Any]) -> str:
    policy = approval_policy_for(action)
    required_roles = set(policy["required_approver_roles"])
    if not required_roles:
        return "Approved"
    if required_roles.issubset(approved_roles_for(action)):
        if policy["requires_distinct_approvers"] and len(approved_actors_for(action)) < 2:
            return "PartiallyApproved"
        return "Approved"
    return "PartiallyApproved" if approved_roles_for(action) else "ApprovalRequested"


def evaluate_roe(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip()
    target_scope_refs = payload.get("target_scope_refs") or []
    prohibited_actions = payload.get("prohibited_actions") or []
    risk_class = normalize_risk_class(payload.get("risk_class"))
    failures: list[str] = []

    if not case_id:
        failures.append("case_id_required")
    if not isinstance(target_scope_refs, list) or not target_scope_refs:
        failures.append("target_scope_refs_required")
    if any(str(item).strip().lower() in {"credential_collection", "destructive_actions"} for item in prohibited_actions):
        failures.append("prohibited_action_requested")
    if risk_class == "T5" and payload.get("control_team_override") is not True:
        failures.append("t5_requires_control_team_override")

    decision = "allow" if not failures else "deny"
    result = {
        "kind": "redteam_ax_v2_roe_evaluation",
        "case_id": case_id,
        "decision": decision,
        "risk_class": risk_class,
        "hitl_required": risk_class in HIGH_RISK_CLASSES,
        "failures": failures,
        "evaluated_at": now_utc(),
    }
    if case_id:
        append_artifact_metadata(result, "roe", stable_id("ROE", [case_id, risk_class, failures]))
    return result


def plan_tool_action(payload: dict[str, Any]) -> dict[str, Any]:
    requested_tool_id = str(payload.get("tool_id") or "").strip()
    profile = analysis_tool_profile(requested_tool_id) if requested_tool_id else None
    risk_class = normalize_risk_class(payload.get("risk_class") or (profile or {}).get("risk_class"))
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED").strip()
    objective = str(payload.get("objective") or "RedTeam AX v2 approved-scope action").strip()
    title = str(payload.get("title") or objective).strip()
    target_scope_refs = payload.get("target_scope_refs") or []
    prohibited_actions = payload.get("prohibited_actions") or ["credential_collection", "destructive_actions"]
    roe = evaluate_roe({
        "case_id": case_id,
        "target_scope_refs": target_scope_refs,
        "risk_class": risk_class,
        "prohibited_actions": [],
        "control_team_override": payload.get("control_team_override"),
    })
    approval_required = risk_class in HIGH_RISK_CLASSES
    status = "ScopeValidated" if roe["decision"] == "allow" else "NeedsRevision"
    approval_policy = approval_policy_for({
        "risk_class": risk_class,
        "environment": payload.get("environment") or "approved_scope",
        "action_type": payload.get("action_type") or "analysis_support",
    })
    allowed_buttons = ["Plan", "Select Tool", "Validate Scope", "Record Manual Run", "Import Output", "Create Evidence", "Generate Finding Draft"]
    if not approval_required:
        allowed_buttons.insert(4, "Dry Run")
    else:
        allowed_buttons.insert(4, "Request Approval")

    action_id = str(payload.get("action_id") or stable_id("TAC", [case_id, title, objective, risk_class]))
    result = {
        "kind": "redteam_ax_v2_tool_action_card",
        "action_id": action_id,
        "case_id": case_id,
        "campaign_id": payload.get("campaign_id") or "CAMP-V2-DEFAULT",
        "title": title,
        "objective": objective,
        "action_type": payload.get("action_type") or "analysis_support",
        "tool_id": requested_tool_id or "TOOL-MANUAL-RECORDER",
        "tool_profile": {
            "tool_id": profile.get("tool_id"),
            "name": profile.get("name"),
            "category": profile.get("category"),
            "normalizer_id": profile.get("normalizer_id"),
            "agent_id": profile.get("agent_id"),
            "default_policy": profile.get("default_policy"),
        } if profile else None,
        "risk_class": risk_class,
        "environment": payload.get("environment") or "approved_scope",
        "target_scope_refs": target_scope_refs,
        "inputs": payload.get("inputs") or {},
        "expected_outputs": payload.get("expected_outputs") or (profile.get("evidence_types") if profile else ["manual_run_record", "normalized_result", "evidence_candidate"]),
        "policy_requirements": ["scope_validation", "artifact_hashing", "audit_logging", "claim_evidence_linking"],
        "approval_policy": approval_policy,
        "required_approver_roles": approval_policy["required_approver_roles"],
        "approval_required": approval_required,
        "hitl_required": approval_required,
        "allowed_buttons": allowed_buttons,
        "prohibited_actions": prohibited_actions,
        "status": status,
        "roe_evaluation": roe,
        "audit_events": [{"event": "planned", "at": now_utc(), "actor": payload.get("requested_by") or "analyst"}],
    }
    return append_artifact_metadata(result, "tool-actions", action_id)


def runner_for_execution_mode(execution_mode: str, profile: dict[str, Any] | None) -> str:
    if execution_mode in {"offline_parse", "plan_only"}:
        return "manual_import"
    if execution_mode in {"dry_run", "sandbox_execute"}:
        return "sandbox"
    if execution_mode in {"manual_operator_run"}:
        return "manual"
    if execution_mode in {"lab_execute", "staging_execute", "production_read_only"}:
        adapter_type = str((profile or {}).get("adapter_type") or "")
        return "api" if adapter_type == "api_or_import_only" else "local_cli"
    return "manual"


def default_network_policy(execution_mode: str, payload: dict[str, Any]) -> dict[str, Any]:
    allowlist = [str(item).strip() for item in (payload.get("network_allowlist") or payload.get("allowed_domains") or []) if str(item).strip()]
    if execution_mode in {"plan_only", "offline_parse", "dry_run", "sandbox_execute"}:
        return {
            "mode": "deny" if not allowlist else "allowlist",
            "default": "deny",
            "allowlist": allowlist,
            "egress_allowed": bool(allowlist),
        }
    if execution_mode in {"lab_execute", "staging_execute", "production_read_only"}:
        return {
            "mode": "allowlist",
            "default": "deny",
            "allowlist": allowlist,
            "egress_allowed": bool(allowlist),
        }
    return {
        "mode": "manual_operator_controlled",
        "default": "manual",
        "allowlist": allowlist,
        "egress_allowed": False,
    }


EPHEMERAL_CONTAINER_REQUIRED_CONTROLS = [
    "container_runtime_attested",
    "image_digest_pinned",
    "network_deny_or_allowlist_enforced",
    "workspace_read_only_mount",
    "case_write_mount_only",
    "no_host_secret_mounts",
    "process_timeout_enforced",
    "stdout_stderr_artifact_capture",
    "ephemeral_cleanup_attested",
]


def truthy_env(name: str) -> bool:
    return os.environ.get(name, "").lower() in {"1", "true", "yes"}


def read_readiness_artifact(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "exists": False,
            "path": path.as_posix(),
            "status": "missing",
            "data": {},
        }
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return {
            "exists": True,
            "path": path.as_posix(),
            "status": "invalid_json",
            "error": str(exc),
            "data": {},
        }
    return {
        "exists": True,
        "path": path.as_posix(),
        "status": data.get("status") or "unknown",
        "data": data,
    }


def latest_runtime_readiness_status() -> dict[str, Any]:
    container_artifact = read_readiness_artifact(
        PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-runtime-smoke" / "latest_container_runtime_smoke.json"
    )
    external_artifact = read_readiness_artifact(
        PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-external-scanner-readiness" / "latest_external_scanner_service_readiness.json"
    )
    service_import_artifact = read_readiness_artifact(
        PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-external-scanner-service-import-live" / "latest_external_scanner_service_import_live_smoke.json"
    )
    wsl_artifact = read_readiness_artifact(
        PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-wsl-runtime-readiness" / "latest_wsl_runtime_readiness.json"
    )
    promotion_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-strict-live-readiness-promotion"
        / "latest_strict_live_readiness_promotion.json"
    )
    remediation_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-live-readiness-remediation"
        / "latest_live_readiness_remediation_runbook.json"
    )
    operator_evidence_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-operator-evidence-collection"
        / "latest_operator_evidence_collection_package.json"
    )
    operator_submission_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-operator-evidence-collection"
        / "latest_operator_evidence_submission_validation.json"
    )
    operator_import_plan_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-operator-evidence-collection"
        / "latest_operator_evidence_card_import_plan.json"
    )
    tool_result_analysis_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-tool-result-analysis"
        / "latest_tool_result_analysis_brief.json"
    )
    finding_claim_review_artifact = read_readiness_artifact(
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-tool-result-analysis"
        / "latest_tool_result_finding_claim_review.json"
    )
    container_data = container_artifact.get("data") or {}
    external_data = external_artifact.get("data") or {}
    service_import_data = service_import_artifact.get("data") or {}
    wsl_data = wsl_artifact.get("data") or {}
    promotion_data = promotion_artifact.get("data") or {}
    remediation_data = remediation_artifact.get("data") or {}
    operator_evidence_data = operator_evidence_artifact.get("data") or {}
    operator_submission_data = operator_submission_artifact.get("data") or {}
    operator_import_plan_data = operator_import_plan_artifact.get("data") or {}
    tool_result_analysis_data = tool_result_analysis_artifact.get("data") or {}
    finding_claim_review_data = finding_claim_review_artifact.get("data") or {}
    container_status = str(container_data.get("status") or container_artifact.get("status") or "unknown")
    external_status = str(external_data.get("status") or external_artifact.get("status") or "unknown")
    service_import_status = str(service_import_data.get("status") or service_import_artifact.get("status") or "unknown")
    wsl_status = str(wsl_data.get("status") or wsl_artifact.get("status") or "unknown")
    promotion_status = str(promotion_data.get("status") or promotion_artifact.get("status") or "unknown")
    remediation_status = str(remediation_data.get("status") or remediation_artifact.get("status") or "unknown")
    operator_evidence_status = str(operator_evidence_data.get("status") or operator_evidence_artifact.get("status") or "unknown")
    operator_submission_status = str(
        operator_submission_data.get("status") or operator_submission_artifact.get("status") or "unknown"
    )
    operator_import_plan_status = str(
        operator_import_plan_data.get("status") or operator_import_plan_artifact.get("status") or "unknown"
    )
    tool_result_analysis_status = str(
        tool_result_analysis_data.get("status") or tool_result_analysis_artifact.get("status") or "unknown"
    )
    finding_claim_review_status = str(
        finding_claim_review_data.get("status") or finding_claim_review_artifact.get("status") or "unknown"
    )
    container_ready = container_status in {"passed", "ready", "container_runtime_ready"}
    external_ready = external_status in {"passed", "ready", "external_scanner_services_ready"}
    service_import_ready = service_import_status in {"passed", "ready", "external_scanner_service_import_live_ready"}
    wsl_ready = wsl_status in {"passed", "ready", "wsl_runtime_ready"}
    promotion_ready = promotion_status in {"passed", "ready", "promotion_ready"}
    remediation_ready = remediation_status in {"passed", "ready", "promotion_inputs_ready"}
    operator_evidence_ready = operator_evidence_status in {"passed", "ready", "operator_evidence_inputs_ready"}
    operator_submission_ready = operator_submission_status in {"passed", "ready", "operator_evidence_submitted_ready"}
    operator_import_plan_ready = operator_import_plan_status in {"passed", "ready", "evidence_card_import_ready"}
    tool_result_analysis_ready = tool_result_analysis_status in {"passed", "ready", "tool_result_analysis_ready"}
    finding_claim_review_ready = finding_claim_review_status in {"passed", "ready", "finding_claim_review_ready"}
    blockers: list[str] = []
    if not container_ready:
        blocker = (
            container_data.get("runtime_preflight", {}).get("blocker")
            or container_data.get("blocker")
            or container_status
        )
        blockers.append(f"container_runtime:{blocker}")
    if not external_ready:
        external_blockers = external_data.get("blockers") or []
        if isinstance(external_blockers, list) and external_blockers:
            blockers.extend(f"external_scanner:{item}" for item in external_blockers)
        else:
            blockers.append(f"external_scanner:{external_status}")
    if not service_import_ready:
        import_blockers = service_import_data.get("blockers") or []
        if isinstance(import_blockers, dict) and import_blockers:
            for name, values in import_blockers.items():
                for value in values or []:
                    blockers.append(f"external_service_import:{name}:{value}")
        elif isinstance(import_blockers, list) and import_blockers:
            blockers.extend(f"external_service_import:{item}" for item in import_blockers)
        else:
            blockers.append(f"external_service_import:{service_import_status}")
    if not wsl_ready:
        wsl_blockers = wsl_data.get("blockers") or []
        if isinstance(wsl_blockers, list) and wsl_blockers:
            blockers.extend(f"wsl_runtime:{item}" for item in wsl_blockers)
        else:
            blockers.append(f"wsl_runtime:{wsl_status}")
    if not promotion_ready:
        promotion_blockers = promotion_data.get("blockers") or []
        if isinstance(promotion_blockers, list) and promotion_blockers:
            blockers.extend(f"strict_live_promotion:{item}" for item in promotion_blockers)
        else:
            blockers.append(f"strict_live_promotion:{promotion_status}")
    if not remediation_ready:
        blocked_step_count = remediation_data.get("blocked_step_count")
        if blocked_step_count is not None:
            blockers.append(f"live_readiness_remediation:{blocked_step_count}_blocked_steps")
        else:
            blockers.append(f"live_readiness_remediation:{remediation_status}")
    if not operator_evidence_ready:
        blocked_collection_count = operator_evidence_data.get("blocked_collection_item_count")
        if blocked_collection_count is not None:
            blockers.append(f"operator_evidence_collection:{blocked_collection_count}_blocked_items")
        else:
            blockers.append(f"operator_evidence_collection:{operator_evidence_status}")
    if not operator_submission_ready:
        blocked_submission_count = operator_submission_data.get("blocked_item_count")
        if blocked_submission_count is not None:
            blockers.append(f"operator_evidence_submission:{blocked_submission_count}_blocked_items")
        else:
            blockers.append(f"operator_evidence_submission:{operator_submission_status}")
    if not operator_import_plan_ready:
        blocked_import_count = operator_import_plan_data.get("blocked_item_count")
        if blocked_import_count is not None:
            blockers.append(f"operator_evidence_card_import:{blocked_import_count}_blocked_items")
        else:
            blockers.append(f"operator_evidence_card_import:{operator_import_plan_status}")
    if not tool_result_analysis_ready:
        missing_evidence_count = (tool_result_analysis_data.get("summary") or {}).get("missing_evidence_link_count")
        if missing_evidence_count is not None:
            blockers.append(f"tool_result_analysis:{missing_evidence_count}_missing_evidence_links")
        else:
            blockers.append(f"tool_result_analysis:{tool_result_analysis_status}")
    if not finding_claim_review_ready:
        held_candidate_count = finding_claim_review_data.get("held_candidate_count")
        if held_candidate_count is not None:
            blockers.append(f"finding_claim_review:{held_candidate_count}_held_candidates")
        else:
            blockers.append(f"finding_claim_review:{finding_claim_review_status}")
    return {
        "kind": "redteam_ax_v2_runtime_readiness_status",
        "status": (
            "ready"
            if (
                container_ready
                and external_ready
                and service_import_ready
                and wsl_ready
                and promotion_ready
                and remediation_ready
                and operator_evidence_ready
                and operator_submission_ready
                and operator_import_plan_ready
                and tool_result_analysis_ready
                and finding_claim_review_ready
            )
            else "blocked_runtime_or_external_readiness"
        ),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "container_runtime": container_artifact,
        "external_scanner_services": external_artifact,
        "external_scanner_service_import_live": service_import_artifact,
        "wsl_runtime": wsl_artifact,
        "strict_live_readiness_promotion": promotion_artifact,
        "live_readiness_remediation": remediation_artifact,
        "operator_evidence_collection": operator_evidence_artifact,
        "operator_evidence_submission": operator_submission_artifact,
        "operator_evidence_card_import_plan": operator_import_plan_artifact,
        "tool_result_analysis_brief": tool_result_analysis_artifact,
        "tool_result_finding_claim_review": finding_claim_review_artifact,
        "blockers": blockers,
        "operator_next_steps": [
            "Start Docker Desktop and verify the Docker daemon before container smoke execution.",
            "Repair or recreate the WSL distribution if the WSL readiness artifact reports a distro start or mount failure.",
            "Configure REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT and REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT for approved read-only imports.",
            "Store scanner credentials outside the app and reference them through an approved external vault reference.",
            "Follow the live readiness remediation runbook before rerunning the strict promotion gate.",
            "Run the strict live readiness promotion gate with --require-promotion only in controlled validation after Docker, WSL, and organization endpoints are ready.",
            "Rerun container runtime and external scanner readiness sanity gates after the environment is prepared.",
        ],
    }


def prepare_operating_toolchain_closure_submission_package(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "current-analyst").strip()
    toolchain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("source_dir"), "operating-closure-submission"]))
    source_dir = str(payload.get("source_dir") or payload.get("directory") or "").strip()
    reviewer = str(payload.get("reviewed_by") or payload.get("evidence_reviewer") or "").strip()
    lead_approver = str(payload.get("lead_approver") or payload.get("red_team_lead") or "").strip()
    business_owner = str(payload.get("business_owner_approver") or payload.get("business_owner") or "").strip()
    export_approver = str(payload.get("export_approver") or payload.get("executive_sponsor") or "").strip()
    package_id = stable_id("OCSP", [case_id, toolchain_id, source_dir, reviewer, lead_approver, business_owner, export_approver, now_utc()])
    runtime = latest_runtime_readiness_status()
    errors: list[str] = []
    warnings: list[str] = []
    approver_checks: list[dict[str, Any]] = []
    manifest_builder: dict[str, Any] | None = None

    if not requested_by:
        errors.append("requested_by_required")
    if not source_dir:
        errors.append("source_dir_required")

    for field, value, role in [
        ("reviewed_by", reviewer, "Evidence 검토자"),
        ("lead_approver", lead_approver, "레드팀 리드"),
        ("business_owner_approver", business_owner, "업무 소유자"),
        ("export_approver", export_approver, "최종 후원자"),
    ]:
        approver_checks.append({
            "field": field,
            "role_ko": role,
            "value": value or None,
            "status": "ready" if value else "missing",
            "required": True,
        })
        if not value:
            errors.append(f"{field}_required")
    if lead_approver and business_owner and lead_approver.lower() == business_owner.lower():
        errors.append("distinct_finding_severity_approvers_required")
        for item in approver_checks:
            if item["field"] in {"lead_approver", "business_owner_approver"}:
                item["status"] = "conflict"

    if source_dir:
        manifest_builder = build_toolchain_artifact_manifest({
            "case_id": case_id,
            "toolchain_id": toolchain_id,
            "requested_by": requested_by,
            "source_dir": source_dir,
            "objective": payload.get("objective") or "운영 closure 제출 전 scanner 산출물 manifest와 승인자 준비 상태를 확인한다.",
        })
        if manifest_builder.get("errors"):
            errors.extend(f"manifest_builder:{error}" for error in manifest_builder.get("errors") or [])
        if (manifest_builder.get("artifact_count") or 0) < 2:
            errors.append("at_least_two_scanner_artifacts_required")
        if manifest_builder.get("unmatched_file_count"):
            warnings.append("source_dir_contains_unmatched_files")

    runtime_blockers = runtime.get("blockers") or []
    close_payload = {
        "case_id": case_id,
        "toolchain_id": toolchain_id,
        "requested_by": requested_by,
        "source_dir": source_dir,
        "reviewed_by": reviewer,
        "lead_approver": lead_approver,
        "business_owner_approver": business_owner,
        "export_approver": export_approver,
        "report_title": payload.get("report_title") or "운영 scanner 산출물 기반 Korean Red Team Report v2",
    }
    submission_items = [
        {
            "item_id": "source_dir",
            "title_ko": "운영 scanner 산출물 폴더",
            "status": "ready" if source_dir and manifest_builder and not manifest_builder.get("errors") and (manifest_builder.get("artifact_count") or 0) >= 2 else "blocked",
            "evidence": source_dir or "source_dir_required",
        },
        {
            "item_id": "approvers",
            "title_ko": "명시 승인자 4명",
            "status": "ready" if all(item.get("status") == "ready" for item in approver_checks) else "blocked",
            "evidence": ", ".join(item["field"] for item in approver_checks if item.get("status") != "ready") or "all_approvers_present",
        },
        {
            "item_id": "runtime_blockers",
            "title_ko": "실행 환경 blocker 기록",
            "status": "ready" if not runtime_blockers else "blocked",
            "evidence": ", ".join(runtime_blockers[:5]) if runtime_blockers else "runtime_readiness_ready",
        },
    ]
    ready_for_close = not errors
    result = {
        "kind": "redteam_ax_v2_operating_closure_submission_package",
        "package_id": package_id,
        "case_id": case_id,
        "toolchain_id": toolchain_id,
        "requested_by": requested_by,
        "status": "ready_for_operating_close" if ready_for_close else "blocked",
        "ready_for_operating_close": ready_for_close,
        "source_dir": source_dir or None,
        "manifest_builder": manifest_builder,
        "artifact_count": (manifest_builder or {}).get("artifact_count") or 0,
        "unmatched_file_count": (manifest_builder or {}).get("unmatched_file_count") or 0,
        "approver_checks": approver_checks,
        "submission_items": submission_items,
        "runtime_readiness_status": runtime.get("status"),
        "runtime_blockers": runtime_blockers,
        "close_api": "/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e",
        "close_api_payload": close_payload,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_existing_operator_artifacts": True,
        "requires_explicit_human_approver_fields": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "blocked 항목을 먼저 해결한 뒤 close_api_payload를 검토합니다.",
            "실제 goal 완료 증거로 쓰려면 controlled fixture가 아니라 실제 조직 scanner 산출물 폴더와 실제 승인자 identity를 사용합니다.",
            "이 패키지는 scanner, Docker, WSL, 네트워크 스캔 명령을 실행하지 않습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operating-closure-submission-packages", package_id)
    return result


def assess_real_operating_evidence_readiness(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "current-analyst").strip()
    toolchain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("source_dir"), "real-operating-evidence-readiness"]))
    source_dir = str(payload.get("source_dir") or payload.get("directory") or "").strip()
    reviewer = str(payload.get("reviewed_by") or payload.get("evidence_reviewer") or "").strip()
    lead_approver = str(payload.get("lead_approver") or payload.get("red_team_lead") or "").strip()
    business_owner = str(payload.get("business_owner_approver") or payload.get("business_owner") or "").strip()
    export_approver = str(payload.get("export_approver") or payload.get("executive_sponsor") or "").strip()
    errors: list[str] = []
    warnings: list[str] = []
    readiness_id = stable_id("OREADY", [case_id, toolchain_id, source_dir, reviewer, lead_approver, business_owner, export_approver, now_utc()])

    if not requested_by:
        errors.append("requested_by_required")
    if not source_dir:
        errors.append("source_dir_required")

    source_lower = source_dir.lower()
    case_lower = case_id.lower()
    controlled_source = (
        "case-v2-" in case_lower
        or "fixture" in source_lower
        or "operator-scanner-outputs" in source_lower
        or "test" in Path(source_dir).name.lower()
    )
    if controlled_source:
        errors.append("real_operating_source_required")
        warnings.append("controlled_or_test_like_source_detected")

    approver_rows = []
    seen_approvers: dict[str, str] = {}
    for field, value, role in [
        ("reviewed_by", reviewer, "Evidence 검토자"),
        ("lead_approver", lead_approver, "레드팀 리드"),
        ("business_owner_approver", business_owner, "업무 소유자"),
        ("export_approver", export_approver, "최종 후원자"),
    ]:
        normalized = value.lower()
        status = "ready" if value else "missing"
        if normalized and normalized in seen_approvers:
            status = "conflict"
            errors.append(f"{field}_must_be_distinct")
        elif normalized:
            seen_approvers[normalized] = field
        if not value:
            errors.append(f"{field}_required")
        approver_rows.append({
            "field": field,
            "role_ko": role,
            "value": value or None,
            "status": status,
            "required": True,
        })

    manifest_builder: dict[str, Any] | None = None
    required_tool_ids = [
        str(item).strip()
        for item in (payload.get("required_tool_ids") or [
            "TOOL-NUCLEI-001",
            "TOOL-OPENVAS-001",
            "TOOL-TRIVY-001",
            "TOOL-SCA-001",
            "TOOL-NPM-AUDIT-001",
            "TOOL-ZAP-001",
        ])
        if str(item).strip()
    ]
    require_all_named_tools = bool(payload.get("require_all_named_tools", True))
    missing_required_tool_ids: list[str] = []
    if source_dir:
        manifest_builder = build_toolchain_artifact_manifest({
            "case_id": case_id,
            "toolchain_id": toolchain_id,
            "requested_by": requested_by,
            "source_dir": source_dir,
            "tool_ids": required_tool_ids,
            "objective": payload.get("objective") or "실제 운영 scanner 산출물 폴더인지 closure 전에 점검한다.",
        })
        if manifest_builder.get("errors"):
            errors.extend(f"manifest_builder:{error}" for error in manifest_builder.get("errors") or [])
        if (manifest_builder.get("artifact_count") or 0) < 2:
            errors.append("at_least_two_real_scanner_artifacts_required")
        if require_all_named_tools:
            present_tool_ids = set(manifest_builder.get("present_tool_ids") or [])
            missing_required_tool_ids = [tool_id for tool_id in required_tool_ids if tool_id not in present_tool_ids]
            if missing_required_tool_ids:
                errors.append("all_required_tool_artifacts_required")
        if manifest_builder.get("unmatched_file_count"):
            warnings.append("source_dir_contains_unmatched_files")

    checklist = [
        {
            "field": "source_dir_exists_and_manifest_builds",
            "title_ko": "실제 운영 산출물 폴더와 manifest",
            "status": "passed" if manifest_builder and not manifest_builder.get("errors") and (manifest_builder.get("artifact_count") or 0) >= 2 else "blocked",
            "evidence": source_dir or "source_dir_required",
        },
        {
            "field": "all_required_tool_artifacts_present",
            "title_ko": "필수 6개 분석도구 산출물",
            "status": "passed" if manifest_builder and not missing_required_tool_ids else "blocked",
            "evidence": (
                "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 모두 탐지됨"
                if manifest_builder and not missing_required_tool_ids
                else ", ".join(missing_required_tool_ids) or "manifest_required"
            ),
            "required_tool_ids": required_tool_ids,
            "missing_tool_ids": missing_required_tool_ids,
        },
        {
            "field": "no_controlled_or_test_source",
            "title_ko": "테스트/fixture 경로 아님",
            "status": "blocked" if controlled_source else "passed",
            "evidence": source_dir or case_id,
        },
        {
            "field": "distinct_real_approvers",
            "title_ko": "서로 다른 실제 승인자",
            "status": "passed" if all(item["status"] == "ready" for item in approver_rows) else "blocked",
            "evidence": ", ".join(item["field"] for item in approver_rows if item["status"] != "ready") or "all_approvers_distinct",
        },
        {
            "field": "safe_no_execution",
            "title_ko": "점검 API 명령 실행 없음",
            "status": "passed",
            "evidence": "commands=false active_scan=false shell=false",
        },
    ]
    for item in checklist:
        if item["status"] != "passed":
            errors.append(f"{item['field']}_required")

    blockers = sorted(set(errors))
    ready = not blockers
    result = {
        "kind": "redteam_ax_v2_real_operating_evidence_readiness",
        "readiness_id": readiness_id,
        "case_id": case_id,
        "toolchain_id": toolchain_id,
        "requested_by": requested_by,
        "status": "real_operating_evidence_ready" if ready else "real_operating_evidence_blocked",
        "ready_for_operating_closure_submission": ready,
        "source_dir": source_dir or None,
        "manifest_builder": manifest_builder,
        "artifact_count": (manifest_builder or {}).get("artifact_count") or 0,
        "required_tool_ids": required_tool_ids,
        "present_tool_ids": (manifest_builder or {}).get("present_tool_ids") or [],
        "missing_required_tool_ids": missing_required_tool_ids,
        "tool_coverage_complete": bool(manifest_builder) and not missing_required_tool_ids,
        "tool_coverage": (manifest_builder or {}).get("tool_coverage") or [],
        "unmatched_file_count": (manifest_builder or {}).get("unmatched_file_count") or 0,
        "approver_checks": approver_rows,
        "checklist": checklist,
        "blockers": blockers,
        "warnings": sorted(set(warnings)),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "next_api": "/api/redteam/v2/toolchains/operating-closure-submission-package",
        "next_human_actions_ko": [
            "blocked이면 source_dir이 실제 조직 scanner 산출물 폴더인지 먼저 확인합니다.",
            "Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 6개 결과 파일이 모두 있어야 운영 closure 제출로 이동합니다.",
            "CASE-V2, fixture, operator-scanner-outputs 같은 테스트 경로는 최종 완료 증거로 사용할 수 없습니다.",
            "ready 상태가 된 뒤 같은 source_dir과 승인자 4명으로 운영 closure 제출 패키지를 생성합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-real-operating-evidence-readiness", readiness_id)
    return result


def build_operator_evidence_submission_manifest_draft(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-V2-LIVE-READINESS-PROMOTION").strip()
    operator_identity = str(payload.get("operator_identity") or payload.get("operator") or "").strip()
    roe_reference = str(payload.get("roe_reference") or payload.get("roe_id") or "").strip()
    package = payload.get("collection_package") if isinstance(payload.get("collection_package"), dict) else None
    package_path_value = payload.get("package_path")
    errors: list[str] = []
    warnings: list[str] = []

    if package is None:
        package_path = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-operator-evidence-collection" / "latest_operator_evidence_collection_package.json"
        if package_path_value:
            resolved_package_path, package_path_errors = resolve_workspace_source_path(package_path_value)
            errors.extend(f"package_path:{error}" for error in package_path_errors)
            if resolved_package_path:
                package_path = resolved_package_path
        if not errors:
            package = read_json_artifact(package_path)
            if package is None:
                errors.append("collection_package_not_readable")

    if not operator_identity:
        errors.append("operator_identity_required")
    if not roe_reference:
        errors.append("roe_reference_required")

    collection_items = package.get("collection_items") if isinstance(package, dict) else []
    if not isinstance(collection_items, list) or not collection_items:
        errors.append("collection_items_required")
        collection_items = []

    attachment_inputs = payload.get("attachments")
    if isinstance(attachment_inputs, dict):
        attachment_inputs = [
            {"item_id": item_id, **(value if isinstance(value, dict) else {"artifact_path": value})}
            for item_id, value in attachment_inputs.items()
        ]
    if not isinstance(attachment_inputs, list):
        attachment_inputs = []

    attachments_by_item: dict[str, dict[str, Any]] = {}
    unknown_items: list[str] = []
    expected_item_ids = {str(item.get("item_id") or "").strip() for item in collection_items if isinstance(item, dict)}
    for attachment in attachment_inputs:
        if not isinstance(attachment, dict):
            warnings.append("attachment_entry_ignored")
            continue
        item_id = str(attachment.get("item_id") or "").strip()
        if not item_id:
            warnings.append("attachment_item_id_missing")
            continue
        if item_id not in expected_item_ids:
            unknown_items.append(item_id)
        attachments_by_item[item_id] = attachment

    rows: list[dict[str, Any]] = []
    manifest_artifacts: list[dict[str, Any]] = []
    missing_items: list[str] = []
    for item in collection_items:
        if not isinstance(item, dict):
            continue
        item_id = str(item.get("item_id") or "").strip()
        expected_attachment = item.get("expected_attachment") if isinstance(item.get("expected_attachment"), dict) else {}
        status_field = str(expected_attachment.get("status_field") or "status")
        expected_status = str(expected_attachment.get("required_status") or "").strip()
        attachment = attachments_by_item.get(item_id) or {}
        artifact_path_value = str(attachment.get("artifact_path") or "").strip()
        review_status = str(attachment.get("review_status") or "pending_human_review").strip() or "pending_human_review"
        item_errors: list[str] = []
        artifact_hash = ""
        artifact_status: Any = None

        if not artifact_path_value:
            item_errors.append("artifact_path_missing")
            missing_items.append(item_id)
        else:
            resolved_path, path_errors = resolve_workspace_source_path(artifact_path_value)
            item_errors.extend(path_errors)
            if resolved_path and not path_errors:
                artifact_hash = sha256_file(resolved_path)
                artifact_json = read_json_artifact(resolved_path)
                if artifact_json is None:
                    item_errors.append("artifact_json_not_readable")
                else:
                    artifact_status = artifact_json.get(status_field)
                    if expected_status and str(artifact_status) != expected_status:
                        item_errors.append("artifact_status_mismatch")

        row_status = "ready" if not item_errors else "blocked"
        rows.append({
            "item_id": item_id,
            "title": item.get("title") or item_id,
            "status": row_status,
            "artifact_path": artifact_path_value or None,
            "sha256": artifact_hash or None,
            "review_status": review_status,
            "expected_status": expected_status or None,
            "artifact_status": artifact_status,
            "errors": item_errors,
        })
        manifest_artifacts.append({
            "item_id": item_id,
            "artifact_path": artifact_path_value,
            "sha256": artifact_hash,
            "review_status": review_status,
        })

    for item_id in sorted(set(unknown_items)):
        errors.append(f"unknown_item:{item_id}")
    errors.extend(f"{row['item_id']}:{error}" for row in rows for error in row.get("errors") or [])
    blockers = sorted(set(errors))
    manifest_id = str(payload.get("manifest_id") or stable_id("OESM", [case_id, operator_identity, roe_reference, manifest_artifacts, now_utc()]))
    submission_manifest = {
        "case_id": case_id,
        "operator_identity": operator_identity,
        "roe_reference": roe_reference,
        "attached_artifacts": manifest_artifacts,
    }
    manifest_artifact_path = write_json_artifact(case_id, "toolchain-operator-evidence-submission-manifests", manifest_id, submission_manifest)
    ready = not blockers
    result = {
        "kind": "redteam_ax_v2_operator_evidence_submission_manifest_draft",
        "manifest_id": manifest_id,
        "case_id": case_id,
        "operator_identity": operator_identity or None,
        "roe_reference": roe_reference or None,
        "status": "submission_manifest_ready_for_human_review" if ready else "submission_manifest_draft_blocked",
        "ready_for_submission_validation": ready,
        "expected_item_count": len(collection_items),
        "attached_item_count": len([row for row in rows if row.get("artifact_path")]),
        "ready_item_count": len([row for row in rows if row.get("status") == "ready"]),
        "blocked_item_count": len([row for row in rows if row.get("status") != "ready"]),
        "missing_items": sorted(set(missing_items)),
        "unknown_items": sorted(set(unknown_items)),
        "attachment_rows": rows,
        "submission_manifest": submission_manifest,
        "submission_manifest_artifact_path": manifest_artifact_path,
        "validator_command_hint": f'python "Red Team Studio/고도화/sanity/redteam_ax_operator_evidence_submission_validator.py" --submission-manifest "{manifest_artifact_path}" --require-approved',
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_review_before_goal_completion": True,
        "does_not_mark_goal_complete": True,
        "warnings": sorted(set(warnings)),
        "errors": blockers,
        "next_human_actions_ko": [
            "각 artifact_path가 실제 운영 Docker/WSL/OpenVAS/ZAP/promotion 산출물인지 사람이 확인합니다.",
            "검토 후 review_status를 approved로 바꾼 제출 manifest를 validator에 --require-approved로 통과시킵니다.",
            "이 API는 제출 초안과 sha256만 만들며 scanner, Docker, WSL, 네트워크 명령은 실행하지 않습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operator-evidence-submission-manifest-drafts", manifest_id)
    return result


def import_operator_evidence_card_candidates(payload: dict[str, Any]) -> dict[str, Any]:
    import_plan = payload.get("import_plan") if isinstance(payload.get("import_plan"), dict) else None
    plan_path_value = payload.get("import_plan_path")
    errors: list[str] = []
    warnings: list[str] = []
    if import_plan is None:
        plan_path = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-operator-evidence-collection" / "latest_operator_evidence_card_import_plan.json"
        if plan_path_value:
            resolved_path, path_errors = resolve_workspace_source_path(plan_path_value)
            errors.extend(f"import_plan_path:{error}" for error in path_errors)
            if resolved_path:
                plan_path = resolved_path
        if not errors:
            import_plan = read_json_artifact(plan_path)
            if import_plan is None:
                errors.append("import_plan_not_readable")

    import_plan = import_plan or {}
    case_id = str(payload.get("case_id") or import_plan.get("case_id") or "CASE-V2-LIVE-READINESS-PROMOTION").strip()
    reviewer = str(payload.get("reviewed_by") or payload.get("approver") or "").strip()
    reviewer_role = normalize_approver_role(payload.get("reviewer_role") or payload.get("approver_role") or "red_team_lead")
    review_created_evidence = bool(payload.get("review_created_evidence") is True or payload.get("approve_created_evidence") is True)
    human_review_confirmed = bool(payload.get("human_review_confirmed") is True)
    review_decision = str(payload.get("review_decision") or payload.get("decision") or "approve").strip().lower()

    if import_plan.get("kind") and import_plan.get("kind") != "redteam_ax_operator_evidence_card_import_plan":
        errors.append("invalid_import_plan_kind")
    candidates = import_plan.get("evidence_card_candidates") if isinstance(import_plan.get("evidence_card_candidates"), list) else []
    selected_ids = [str(item).strip() for item in (payload.get("candidate_ids") or []) if str(item).strip()]
    if selected_ids:
        selected = [item for item in candidates if str(item.get("evidence_id") or "").strip() in set(selected_ids)]
        missing_selected = sorted(set(selected_ids) - {str(item.get("evidence_id") or "").strip() for item in selected})
        errors.extend(f"candidate_not_found:{item}" for item in missing_selected)
    else:
        selected = list(candidates)
    if not selected:
        errors.append("evidence_card_candidates_required")
    if review_created_evidence and not human_review_confirmed:
        errors.append("human_review_confirmed_required")
    if review_created_evidence and not reviewer:
        errors.append("reviewed_by_required")

    rows: list[dict[str, Any]] = []
    created_evidence: list[dict[str, Any]] = []
    approvals: list[dict[str, Any]] = []
    creation_allowed = not errors
    for candidate in selected:
        if not isinstance(candidate, dict):
            warnings.append("candidate_entry_ignored")
            continue
        if not creation_allowed:
            rows.append({
                "candidate_id": candidate.get("evidence_id"),
                "evidence_id": None,
                "evidence_artifact_path": None,
                "source_item_id": candidate.get("source_item_id"),
                "source_path_or_url": candidate.get("source_path_or_url"),
                "evidence_status": "not_created",
                "validation_status": candidate.get("validation_status") or "verified",
                "approval_status": "blocked",
                "approval_id": None,
                "errors": sorted(set(errors)),
            })
            continue
        evidence_payload = {
            "evidence_id": candidate.get("evidence_id"),
            "case_id": candidate.get("case_id") or case_id,
            "source_type": candidate.get("evidence_type") or "operator_live_readiness_artifact",
            "source_path_or_url": candidate.get("source_path_or_url"),
            "summary": candidate.get("summary"),
            "hash": candidate.get("source_sha256"),
            "validation_status": candidate.get("validation_status") or "verified",
            "approval_status": "pending_review",
            "review_required": True,
            "normalized_fields": {
                "source_item_id": candidate.get("source_item_id"),
                "source_artifact_status": candidate.get("source_artifact_status"),
                "source_sha256": candidate.get("source_sha256"),
                "claim_evidence_matrix_hint": candidate.get("claim_evidence_matrix_hint") or {},
                "operator_import_plan": import_plan.get("source_validation_artifact"),
            },
            "classification": candidate.get("classification") or "internal",
        }
        evidence = create_evidence_card(evidence_payload)
        created_evidence.append(evidence)
        approval: dict[str, Any] | None = None
        if review_created_evidence and human_review_confirmed and not evidence.get("errors"):
            approval = approve_evidence_card(str(evidence.get("evidence_id")), {
                "case_id": evidence.get("case_id"),
                "reviewed_by": reviewer,
                "reviewer_role": reviewer_role,
                "decision": review_decision,
                "_actor_context": payload.get("_actor_context") or {},
            })
            approvals.append(approval)
        row_errors = [*(evidence.get("errors") or [])]
        if approval and approval.get("errors"):
            row_errors.extend(f"approval:{error}" for error in approval.get("errors") or [])
        rows.append({
            "candidate_id": candidate.get("evidence_id"),
            "evidence_id": evidence.get("evidence_id"),
            "evidence_artifact_path": evidence.get("artifact_path"),
            "source_item_id": candidate.get("source_item_id"),
            "source_path_or_url": candidate.get("source_path_or_url"),
            "evidence_status": evidence.get("approval_status"),
            "validation_status": evidence.get("validation_status"),
            "approval_status": (approval or {}).get("status") if approval else "pending_human_review",
            "approval_id": (approval or {}).get("approval_id") if approval else None,
            "errors": row_errors,
        })

    created_count = len([item for item in created_evidence if not item.get("errors")])
    approved_count = len([item for item in approvals if item.get("status") == "approved"])
    invalid_count = len([row for row in rows if row.get("errors")])
    if any(approval.get("errors") for approval in approvals):
        errors.append("evidence_approval_failed")
    import_id = str(payload.get("import_id") or stable_id("OECIMP", [case_id, [row.get("evidence_id") for row in rows], reviewer, review_created_evidence, now_utc()]))
    status = "operator_evidence_cards_approved" if review_created_evidence and approved_count == created_count and created_count and not errors else (
        "operator_evidence_cards_created_pending_review" if created_count and not errors else "operator_evidence_card_import_blocked"
    )
    result = {
        "kind": "redteam_ax_v2_operator_evidence_card_import",
        "import_id": import_id,
        "case_id": case_id,
        "status": status,
        "source_import_plan_status": import_plan.get("status"),
        "selected_candidate_count": len(selected),
        "created_evidence_count": created_count,
        "approved_evidence_count": approved_count,
        "invalid_count": invalid_count,
        "review_created_evidence": review_created_evidence,
        "human_review_confirmed": human_review_confirmed,
        "reviewed_by": reviewer or None,
        "reviewer_role": reviewer_role or None,
        "import_rows": rows,
        "created_evidence_ids": [item.get("evidence_id") for item in created_evidence if not item.get("errors")],
        "approval_ids": [item.get("approval_id") for item in approvals if item.get("status") == "approved"],
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_review": True,
        "does_not_mark_goal_complete": True,
        "warnings": sorted(set(warnings)),
        "errors": sorted(set(errors)),
        "next_human_actions_ko": [
            "pending_review Evidence Card는 검토자가 원본 artifact와 ROE를 확인한 뒤 승인합니다.",
            "approved Evidence Card가 준비된 뒤 Finding 생성, 2인 severity 승인, Matrix/report/export gate로 이동합니다.",
            "이 API는 Evidence Card 등록과 선택적 승인 기록만 수행하며 scanner나 네트워크 명령을 실행하지 않습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operator-evidence-card-imports", import_id)
    return result


def record_operating_toolchain_closure_human_review(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    package = payload.get("submission_package") if isinstance(payload.get("submission_package"), dict) else None
    package_id = str(payload.get("package_id") or (package or {}).get("package_id") or "").strip()
    if package is None and package_id:
        package = load_json_record(package_id, "toolchain-operating-closure-submission-packages", case_id=case_id)
    package = package or {}

    reviewer = str(payload.get("reviewed_by") or payload.get("human_reviewer") or package.get("requested_by") or "").strip()
    runtime_disposition = str(payload.get("runtime_blocker_disposition") or "").strip().lower()
    if not runtime_disposition and not package.get("runtime_blockers"):
        runtime_disposition = "none"
    final_close_authorized = bool(payload.get("final_close_authorized") is True)
    checklist_inputs = payload.get("checklist") if isinstance(payload.get("checklist"), dict) else {}
    signoffs = payload.get("approver_signoffs") if isinstance(payload.get("approver_signoffs"), dict) else {}
    errors: list[str] = []
    warnings: list[str] = []

    if not package:
        errors.append("submission_package_required")
    if package and package.get("kind") != "redteam_ax_v2_operating_closure_submission_package":
        errors.append("invalid_submission_package_kind")
    if package and not package.get("ready_for_operating_close"):
        errors.append("submission_package_not_ready")
    if not reviewer:
        errors.append("human_reviewer_required")

    runtime_blockers = package.get("runtime_blockers") or []
    if runtime_blockers and runtime_disposition not in {"accepted", "mitigated", "deferred_with_owner"}:
        errors.append("runtime_blocker_disposition_required")
    if runtime_disposition == "deferred_with_owner" and not str(payload.get("runtime_blocker_owner") or "").strip():
        errors.append("runtime_blocker_owner_required")

    required_checklist = [
        ("source_dir_verified", "운영 scanner 산출물 폴더가 승인 범위와 일치함"),
        ("manifest_reviewed", "manifest builder의 도구별 산출물 수와 unmatched file을 확인함"),
        ("approvers_verified", "승인자 4명 identity와 역할을 확인함"),
        ("runtime_blockers_reviewed", "runtime blocker와 처리 방침을 검토함"),
        ("close_payload_reviewed", "close-operating API payload를 검토함"),
        ("no_scanner_execution_confirmed", "이 단계에서 scanner 명령이 실행되지 않음을 확인함"),
    ]
    checklist_rows: list[dict[str, Any]] = []
    for field, title_ko in required_checklist:
        checked = checklist_inputs.get(field)
        if checked is None:
            checked = payload.get(field)
        checked = bool(checked is True)
        checklist_rows.append({
            "field": field,
            "title_ko": title_ko,
            "status": "checked" if checked else "missing",
            "required": True,
        })
        if not checked:
            errors.append(f"{field}_required")

    package_approvers = {
        item.get("field"): item.get("value")
        for item in package.get("approver_checks", [])
        if item.get("field")
    }
    approver_review_rows: list[dict[str, Any]] = []
    for field, title_ko in [
        ("reviewed_by", "Evidence 검토자"),
        ("lead_approver", "레드팀 리드"),
        ("business_owner_approver", "업무 소유자"),
        ("export_approver", "최종 후원자"),
    ]:
        expected = str(package_approvers.get(field) or (package.get("close_api_payload") or {}).get(field) or "").strip()
        signed = str(signoffs.get(field) or payload.get(field) or "").strip()
        status = "signed" if expected and signed and expected.lower() == signed.lower() else "missing"
        if expected and signed and expected.lower() != signed.lower():
            status = "mismatch"
            errors.append(f"{field}_signoff_mismatch")
        elif not signed:
            errors.append(f"{field}_signoff_required")
        approver_review_rows.append({
            "field": field,
            "role_ko": title_ko,
            "expected": expected or None,
            "signed_by": signed or None,
            "status": status,
            "required": True,
        })

    if not final_close_authorized:
        errors.append("final_close_authorized_required")

    ready_for_execution = not errors
    review_id = stable_id("OCREV", [
        case_id,
        package_id or package.get("package_id"),
        reviewer,
        runtime_disposition,
        final_close_authorized,
        now_utc(),
    ])
    result = {
        "kind": "redteam_ax_v2_operating_closure_human_review",
        "review_id": review_id,
        "package_id": package_id or package.get("package_id"),
        "case_id": case_id,
        "toolchain_id": package.get("toolchain_id") or payload.get("toolchain_id"),
        "status": "ready_for_human_close_execution" if ready_for_execution else "review_required",
        "ready_for_human_close_execution": ready_for_execution,
        "reviewed_by": reviewer or None,
        "runtime_blocker_disposition": runtime_disposition or None,
        "runtime_blocker_owner": str(payload.get("runtime_blocker_owner") or "").strip() or None,
        "final_close_authorized": final_close_authorized,
        "checklist": checklist_rows,
        "approver_review": approver_review_rows,
        "runtime_blockers": runtime_blockers,
        "close_api": package.get("close_api") or "/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e",
        "approved_close_api_payload": package.get("close_api_payload") if ready_for_execution else None,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_existing_operator_artifacts": True,
        "requires_explicit_human_review": True,
        "requires_separate_close_execution": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "review_required이면 missing 또는 mismatch 항목을 먼저 보완합니다.",
            "ready_for_human_close_execution 상태가 된 뒤에도 close API 실행은 별도 HITL 단계로 수행합니다.",
            "approved_close_api_payload는 scanner 명령이 아니라 기존 운영 산출물 close 요청 payload입니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operating-closure-human-reviews", review_id)
    return result


def execute_reviewed_operating_toolchain_close(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    review = payload.get("human_review") if isinstance(payload.get("human_review"), dict) else None
    review_id = str(payload.get("review_id") or (review or {}).get("review_id") or "").strip()
    if review is None and review_id:
        review = load_json_record(review_id, "toolchain-operating-closure-human-reviews", case_id=case_id)
    review = review or {}
    requested_by = str(payload.get("requested_by") or payload.get("operator") or review.get("reviewed_by") or "current-analyst").strip()
    errors: list[str] = []
    warnings: list[str] = []

    if not review:
        errors.append("human_review_required")
    if review and review.get("kind") != "redteam_ax_v2_operating_closure_human_review":
        errors.append("invalid_human_review_kind")
    if review and not review.get("ready_for_human_close_execution"):
        errors.append("human_review_not_ready")
    approved_payload = review.get("approved_close_api_payload") if isinstance(review.get("approved_close_api_payload"), dict) else None
    if not approved_payload:
        errors.append("approved_close_api_payload_required")
    if payload.get("override_close_api_payload"):
        warnings.append("override_close_api_payload_ignored")
    if not requested_by:
        errors.append("requested_by_required")

    execution_id = stable_id("OCEXEC", [case_id, review_id, requested_by, now_utc()])
    close_result: dict[str, Any] | None = None
    if not errors and approved_payload is not None:
        close_payload = {
            **approved_payload,
            "case_id": case_id,
            "requested_by": requested_by,
            "human_review_id": review.get("review_id") or review_id,
            "package_id": review.get("package_id"),
        }
        close_result = close_operating_toolchain_artifact_manifest_e2e(close_payload)
        if close_result.get("errors") or not close_result.get("complete"):
            errors.extend(f"close:{error}" for error in (close_result.get("errors") or [close_result.get("status")]))

    complete = not errors and bool((close_result or {}).get("complete"))
    result = {
        "kind": "redteam_ax_v2_reviewed_operating_close_execution",
        "execution_id": execution_id,
        "review_id": review.get("review_id") or review_id or None,
        "package_id": review.get("package_id") or None,
        "case_id": case_id,
        "toolchain_id": (approved_payload or {}).get("toolchain_id") or review.get("toolchain_id") or payload.get("toolchain_id"),
        "status": "reviewed_operating_close_complete" if complete else "blocked",
        "complete": complete,
        "requested_by": requested_by,
        "close_result": close_result,
        "approved_close_api_payload_used": approved_payload if not errors else None,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_existing_operator_artifacts": True,
        "requires_ready_human_review": True,
        "refuses_payload_override": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "blocked이면 human review ready 상태와 approved_close_api_payload를 먼저 확인합니다.",
            "이 API는 사람이 검토한 payload만 사용하며 override payload는 무시합니다.",
            "scanner, Docker, WSL, 네트워크 스캔 명령은 실행하지 않고 기존 운영 산출물 close lane만 호출합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-reviewed-operating-close-executions", execution_id)
    return result


def certify_reviewed_operating_close_evidence(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    execution = payload.get("reviewed_close_execution") if isinstance(payload.get("reviewed_close_execution"), dict) else None
    execution_id = str(payload.get("execution_id") or (execution or {}).get("execution_id") or "").strip()
    if execution is None and execution_id:
        execution = load_json_record(execution_id, "toolchain-reviewed-operating-close-executions", case_id=case_id)
    execution = execution or {}
    attestation = payload.get("operator_attestation") if isinstance(payload.get("operator_attestation"), dict) else {}
    certifier = str(payload.get("certified_by") or payload.get("reviewed_by") or "").strip()
    errors: list[str] = []
    warnings: list[str] = []

    if not execution:
        errors.append("reviewed_close_execution_required")
    if execution and execution.get("kind") != "redteam_ax_v2_reviewed_operating_close_execution":
        errors.append("invalid_reviewed_close_execution_kind")
    if execution and not execution.get("complete"):
        errors.append("reviewed_close_execution_not_complete")
    if not certifier:
        errors.append("certified_by_required")

    close_result = execution.get("close_result") if isinstance(execution.get("close_result"), dict) else {}
    close_completion_gate = ((close_result.get("closure") or {}).get("completion_gate") or {}) if isinstance(close_result.get("closure"), dict) else {}
    report_gate = (((close_result.get("closure") or {}).get("report_draft") or {}).get("report") or {}) if isinstance(close_result.get("closure"), dict) else {}
    evidence_checks = [
        {
            "field": "reviewed_close_complete",
            "title_ko": "검토 완료 closure 실행 완료",
            "status": "passed" if execution.get("complete") else "blocked",
            "evidence": execution.get("execution_id") or execution_id or "missing_execution",
        },
        {
            "field": "completion_gate_complete",
            "title_ko": "completion gate 완료",
            "status": "passed" if close_completion_gate.get("complete") else "blocked",
            "evidence": close_completion_gate.get("gate_id") or "completion_gate_missing",
        },
        {
            "field": "report_gate_zero_blockers",
            "title_ko": "보고서 gate blocker 0건",
            "status": "passed" if (report_gate.get("gate_status") == "pass" and not report_gate.get("blocking_items")) else "blocked",
            "evidence": f"gate={report_gate.get('gate_status') or 'missing'} blockers={len(report_gate.get('blocking_items') or [])}",
        },
        {
            "field": "safe_flags",
            "title_ko": "명령 실행/active scan 없음",
            "status": "passed" if not execution.get("commands_executed_by_api") and not execution.get("active_scan_executed") and not execution.get("trusted_as_instruction") else "blocked",
            "evidence": "commands=false active_scan=false trusted_as_instruction=false",
        },
    ]
    for item in evidence_checks:
        if item["status"] != "passed":
            errors.append(f"{item['field']}_required")

    required_attestations = [
        ("real_operator_source_dir", "실제 운영 scanner 산출물 폴더 사용"),
        ("real_approver_identities", "실제 승인자 identity 사용"),
        ("no_controlled_fixture_data", "controlled fixture/test data가 아님"),
        ("evidence_retention_confirmed", "Evidence/Report/export 산출물 보존 확인"),
        ("roe_hitl_review_confirmed", "ROE/HITL 검토 완료"),
    ]
    attestation_rows: list[dict[str, Any]] = []
    for field, title_ko in required_attestations:
        checked = bool(attestation.get(field) is True or payload.get(field) is True)
        attestation_rows.append({
            "field": field,
            "title_ko": title_ko,
            "status": "attested" if checked else "missing",
            "required": True,
        })
        if not checked:
            errors.append(f"{field}_attestation_required")

    source_dir = ((execution.get("approved_close_api_payload_used") or {}).get("source_dir") or (close_result or {}).get("source_dir") or "")
    source_dir_lower = str(source_dir).lower()
    case_id_lower = str(case_id).lower()
    if "case-v2-" in case_id_lower or "fixture" in source_dir_lower or "operator-scanner-outputs" in source_dir_lower:
        warnings.append("controlled_or_test_like_source_detected")

    ready_for_completion_audit = not errors
    certification_id = stable_id("OCCERT", [case_id, execution_id or execution.get("execution_id"), certifier, now_utc()])
    result = {
        "kind": "redteam_ax_v2_reviewed_operating_close_evidence_certification",
        "certification_id": certification_id,
        "execution_id": execution_id or execution.get("execution_id"),
        "review_id": execution.get("review_id"),
        "package_id": execution.get("package_id"),
        "case_id": case_id,
        "toolchain_id": execution.get("toolchain_id"),
        "status": "ready_for_completion_audit_review" if ready_for_completion_audit else "certification_required",
        "ready_for_completion_audit_review": ready_for_completion_audit,
        "certified_by": certifier or None,
        "source_dir": source_dir or None,
        "evidence_checks": evidence_checks,
        "operator_attestation": attestation_rows,
        "report_gate_snapshot": report_gate,
        "completion_gate_snapshot": close_completion_gate,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "does_not_mark_goal_complete": True,
        "requires_final_completion_audit": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "certification_required이면 누락된 실측 attestation과 completion/report gate 증거를 보완합니다.",
            "ready_for_completion_audit_review 상태여도 전체 goal 완료는 별도 completion audit에서만 판단합니다.",
            "controlled_or_test_like_source_detected 경고가 있으면 실제 조직 산출물 증거로 사용할 수 없습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-reviewed-operating-close-evidence-certifications", certification_id)
    return result


def review_operating_completion_audit_candidate(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    certification = payload.get("certification") if isinstance(payload.get("certification"), dict) else None
    certification_id = str(payload.get("certification_id") or (certification or {}).get("certification_id") or "").strip()
    if certification is None and certification_id:
        certification = load_json_record(certification_id, "toolchain-reviewed-operating-close-evidence-certifications", case_id=case_id)
    certification = certification or {}
    auditor = str(payload.get("audited_by") or payload.get("reviewed_by") or "").strip()
    errors: list[str] = []
    warnings: list[str] = []

    if not certification:
        errors.append("certification_required")
    if certification and certification.get("kind") != "redteam_ax_v2_reviewed_operating_close_evidence_certification":
        errors.append("invalid_certification_kind")
    if certification and not certification.get("ready_for_completion_audit_review"):
        errors.append("certification_not_ready_for_completion_audit_review")
    if not auditor:
        errors.append("audited_by_required")

    certification_errors = list(certification.get("errors") or [])
    certification_warnings = list(certification.get("warnings") or [])
    if certification_errors:
        errors.append("certification_has_errors")
    if certification_warnings:
        warnings.extend(str(item) for item in certification_warnings)

    source_dir = str(certification.get("source_dir") or "")
    source_dir_lower = source_dir.lower()
    case_id_lower = str(case_id).lower()
    controlled_source = (
        "controlled_or_test_like_source_detected" in certification_warnings
        or "case-v2-" in case_id_lower
        or "fixture" in source_dir_lower
        or "operator-scanner-outputs" in source_dir_lower
    )

    checklist = [
        {
            "field": "certification_ready",
            "title_ko": "인증 후보 준비",
            "status": "passed" if certification.get("ready_for_completion_audit_review") else "blocked",
            "evidence": certification.get("certification_id") or certification_id or "missing_certification",
        },
        {
            "field": "no_certification_errors",
            "title_ko": "인증 오류 0건",
            "status": "passed" if not certification_errors else "blocked",
            "evidence": f"errors={len(certification_errors)}",
        },
        {
            "field": "no_controlled_or_test_source",
            "title_ko": "controlled/test 산출물 아님",
            "status": "blocked" if controlled_source else "passed",
            "evidence": source_dir or "source_dir_missing",
        },
        {
            "field": "report_gate_pass",
            "title_ko": "보고서 gate pass",
            "status": "passed" if (certification.get("report_gate_snapshot") or {}).get("gate_status") == "pass" else "blocked",
            "evidence": (certification.get("report_gate_snapshot") or {}).get("gate_status") or "missing",
        },
        {
            "field": "completion_gate_complete",
            "title_ko": "completion gate complete",
            "status": "passed" if (certification.get("completion_gate_snapshot") or {}).get("complete") else "blocked",
            "evidence": (certification.get("completion_gate_snapshot") or {}).get("gate_id") or "completion_gate_missing",
        },
        {
            "field": "safe_no_api_execution",
            "title_ko": "감사 API 명령 실행 없음",
            "status": "passed",
            "evidence": "commands=false active_scan=false shell=false",
        },
    ]
    for item in checklist:
        if item["status"] != "passed":
            errors.append(f"{item['field']}_required")

    blockers = sorted(set(errors))
    audit_ready = not blockers
    audit_id = stable_id("OCAUDIT", [case_id, certification_id or certification.get("certification_id"), auditor, now_utc()])
    result = {
        "kind": "redteam_ax_v2_operating_completion_audit_review",
        "audit_id": audit_id,
        "certification_id": certification_id or certification.get("certification_id"),
        "execution_id": certification.get("execution_id"),
        "review_id": certification.get("review_id"),
        "package_id": certification.get("package_id"),
        "case_id": case_id,
        "toolchain_id": certification.get("toolchain_id"),
        "status": "goal_complete_candidate" if audit_ready else "completion_audit_blocked",
        "goal_complete_candidate": audit_ready,
        "audited_by": auditor or None,
        "checklist": checklist,
        "blockers": blockers,
        "warnings": warnings,
        "source_dir": source_dir or None,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "does_not_mark_goal_complete": True,
        "requires_external_completion_decision": True,
        "next_human_actions_ko": [
            "completion_audit_blocked이면 blockers를 해소한 뒤 실제 운영 산출물로 다시 인증합니다.",
            "controlled/test 산출물 경고가 있으면 goal_complete_candidate가 될 수 없습니다.",
            "goal_complete_candidate 상태여도 전체 스레드 목표 완료는 전체 회귀/보안/보고서 게이트 재검증 뒤 별도로 판단합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operating-completion-audit-reviews", audit_id)
    return result


def runner_isolation_readiness(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    execution_mode = str(payload.get("execution_mode") or "sandbox_execute").strip()
    requested_backend = str(payload.get("runner_backend") or payload.get("runner_isolation") or "").strip()
    if not requested_backend:
        requested_backend = "local_subprocess_shim" if execution_mode in {"dry_run", "sandbox_execute"} else "manual_or_api_controlled"
    requested_backend = requested_backend.lower()
    attestation = payload.get("isolation_attestation") or {}
    env_enabled = truthy_env("REDTEAM_AX_CONTAINER_RUNNER_ENABLED")
    image_digest = str(
        payload.get("image_digest")
        or attestation.get("image_digest")
        or os.environ.get("REDTEAM_AX_CONTAINER_IMAGE_DIGEST")
        or ""
    ).strip()
    runtime_attested = bool(attestation.get("container_runtime_attested")) or truthy_env("REDTEAM_AX_CONTAINER_RUNTIME_ATTESTED")
    network_attested = bool(attestation.get("network_deny_or_allowlist_enforced")) or truthy_env("REDTEAM_AX_CONTAINER_NETWORK_ATTESTED")
    cleanup_attested = bool(attestation.get("ephemeral_cleanup_attested")) or truthy_env("REDTEAM_AX_CONTAINER_CLEANUP_ATTESTED")
    mount_attested = (
        bool(attestation.get("workspace_read_only_mount")) and bool(attestation.get("case_write_mount_only"))
    ) or truthy_env("REDTEAM_AX_CONTAINER_MOUNT_ATTESTED")

    blocking_controls: list[str] = []
    if requested_backend == "ephemeral_container":
        if not env_enabled:
            blocking_controls.append("container_runner_not_enabled")
        if not runtime_attested:
            blocking_controls.append("container_runtime_attestation_required")
        if not image_digest:
            blocking_controls.append("container_image_digest_pin_required")
        if not network_attested:
            blocking_controls.append("container_network_policy_attestation_required")
        if not mount_attested:
            blocking_controls.append("container_mount_policy_attestation_required")
        if not cleanup_attested:
            blocking_controls.append("ephemeral_cleanup_attestation_required")
    elif requested_backend == "local_subprocess_shim" and execution_mode in {"dry_run", "sandbox_execute"}:
        blocking_controls = []
    elif requested_backend == "manual_or_api_controlled":
        blocking_controls = []
    else:
        blocking_controls.append("runner_backend_not_supported")

    status = "not_required"
    if requested_backend == "ephemeral_container":
        status = "container_ready" if not blocking_controls else "container_not_ready"
    elif requested_backend == "local_subprocess_shim":
        status = "shim_ready"

    return {
        "kind": "redteam_ax_v2_runner_isolation_readiness",
        "requested_backend": requested_backend,
        "status": status,
        "commands_executed_by_api": False,
        "runner_token_blocked": requested_backend == "ephemeral_container" and bool(blocking_controls),
        "blocking_controls": blocking_controls,
        "required_controls": EPHEMERAL_CONTAINER_REQUIRED_CONTROLS,
        "container_policy": {
            "ephemeral": True,
            "runtime": os.environ.get("REDTEAM_AX_CONTAINER_RUNTIME") or "docker",
            "image_digest": image_digest or None,
            "network_default": "deny",
            "network_allowlist_required_for_egress": True,
            "workspace_mount": "read_only",
            "case_artifact_mount": "write_only",
            "host_secret_mounts_allowed": False,
            "shell_expansion_allowed": False,
            "privileged_container_allowed": False,
            "resource_limits": {
                "cpus": os.environ.get("REDTEAM_AX_CONTAINER_CPUS") or "1",
                "memory": os.environ.get("REDTEAM_AX_CONTAINER_MEMORY") or "512m",
                "pids_limit": int(os.environ.get("REDTEAM_AX_CONTAINER_PIDS_LIMIT") or 128),
            },
        },
        "local_shim_policy": {
            "allowed_for": ["dry_run", "sandbox_execute"],
            "safe_by_default": True,
            "note": "Local subprocess shim is a transitional dry-run backend; ephemeral container remains required before live scanner execution is considered complete.",
        },
        "operator_actions": [
            "enable_dedicated_container_runner",
            "pin_runner_image_digest",
            "attest_network_deny_or_allowlist",
            "attest_read_only_workspace_and_case_write_mounts",
            "attest_ephemeral_cleanup",
            "rerun_execution_plan_with_runner_backend_ephemeral_container",
        ],
        "evidence_pipeline": {
            "raw_stdout_stderr": "Evidence Card raw_artifact only",
            "trusted_as_instruction": False,
            "normalization_required": True,
            "claim_evidence_matrix_required": True,
        },
    }


def build_tool_execution_plan(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    action = load_tool_action(action_id, case_id)
    tool_id = str(payload.get("tool_id") or (action or {}).get("tool_id") or "").strip()
    profile = analysis_tool_profile(tool_id)
    execution_mode = str(payload.get("execution_mode") or (action or {}).get("inputs", {}).get("requested_execution_mode") or (profile or {}).get("default_execution_mode") or "manual_operator_run").strip()
    requested_by = str(payload.get("requested_by") or "").strip()
    target_scope_refs = payload.get("target_scope_refs") or (action or {}).get("target_scope_refs") or []
    risk_class = normalize_risk_class((action or {}).get("risk_class") or (profile or {}).get("risk_class"))
    errors: list[str] = []
    warnings: list[str] = []

    if action is None:
        errors.append("tool_action_card_required_before_execution_plan")
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not requested_by:
        errors.append("requested_by_required")
    if profile is not None and execution_mode not in profile.get("allowed_execution_modes", []):
        errors.append("execution_mode_not_allowed_for_tool")
    if profile is not None and execution_mode in profile.get("denied_execution_modes", []):
        errors.append("execution_mode_denied_for_tool")
    if payload.get("network_allowlist") and execution_mode in {"plan_only", "offline_parse"}:
        warnings.append("network_allowlist_ignored_for_non_network_mode")

    active_modes = {"lab_execute", "staging_execute", "production_read_only", "controlled_production_execute"}
    approval_required = risk_class in HIGH_RISK_CLASSES and execution_mode in active_modes
    if execution_mode == "controlled_production_execute":
        approval_required = True
    if execution_mode in active_modes and not target_scope_refs:
        errors.append("target_scope_refs_required_for_active_execution_plan")
    if approval_required and action is not None and str(action.get("status") or "") != "Approved":
        warnings.append("approval_required_before_runner_token")
    if risk_class == "T7" or execution_mode == "prohibited":
        errors.append("restricted_or_prohibited_execution_mode")

    network_policy = default_network_policy(execution_mode, payload)
    filesystem_policy = {
        "mode": "workspace_only",
        "workspace_root": PROJECT_ROOT.as_posix(),
        "allowed_paths": [PROJECT_ROOT.as_posix(), case_dir(case_id).as_posix()],
        "write_paths": [case_dir(case_id).as_posix()],
    }
    max_runtime_seconds = int(payload.get("max_runtime_seconds") or (120 if execution_mode in {"dry_run", "sandbox_execute"} else 300))
    max_output_bytes = int(payload.get("max_output_bytes") or MAX_TOOL_ARTIFACT_BYTES)
    plan_id = str(payload.get("execution_plan_id") or stable_id("TEP", [case_id, action_id, tool_id, execution_mode, requested_by, now_utc()]))
    runner = runner_for_execution_mode(execution_mode, profile)
    wrapper_manifest = tool_wrapper_manifest_for_profile(profile) if profile else None
    isolation_readiness = runner_isolation_readiness({**payload, "execution_mode": execution_mode})
    runner_backend = str(isolation_readiness.get("requested_backend") or "")
    runner_uses_wrapper = runner in {"sandbox", "local_cli", "api"} and runner_backend != "ephemeral_container"
    wrapper_preflight_blocked = bool(wrapper_manifest and wrapper_manifest["requires_pin_before_runner"] and runner_uses_wrapper)
    isolation_blocked = bool(isolation_readiness.get("runner_token_blocked")) and runner == "sandbox"
    if wrapper_preflight_blocked:
        warnings.append("wrapper_sha256_pin_required_before_runner_execution")
    if isolation_blocked:
        warnings.extend(isolation_readiness.get("blocking_controls") or [])
    token_issued = not errors and not approval_required and not wrapper_preflight_blocked and not isolation_blocked
    execution_token = {
        "token_id": stable_id("EXT", [plan_id, action_id, tool_id, execution_mode]) if token_issued else None,
        "status": "issued" if token_issued else ("blocked" if errors or ((wrapper_preflight_blocked or isolation_blocked) and not approval_required) else "approval_required"),
        "action_id": action_id,
        "allowed_tool_id": tool_id,
        "allowed_environment": payload.get("environment") or (action or {}).get("environment") or "approved_scope",
        "allowed_scope_refs": target_scope_refs,
        "expires_at": "",
        "max_runtime_seconds": max_runtime_seconds,
        "max_targets": int(payload.get("max_targets") or 1),
        "network_policy": network_policy["mode"],
        "revoked": False,
    }
    plan = {
        "kind": "redteam_ax_v2_tool_execution_plan",
        "execution_plan_id": plan_id,
        "case_id": case_id,
        "action_id": action_id,
        "tool_id": tool_id,
        "tool_name": (profile or {}).get("name"),
        "execution_mode": execution_mode,
        "runner": runner,
        "wrapper_manifest": wrapper_manifest,
        "wrapper_preflight": (wrapper_manifest or {}).get("runner_preflight") or {
            "runner_can_use_wrapper": False,
            "blocking_controls": ["tool_profile_not_registered"],
            "human_review_required": True,
        },
        "status": "invalid" if errors else ("approval_required" if approval_required else ("preflight_blocked" if wrapper_preflight_blocked or isolation_blocked else "PlanReady")),
        "errors": errors,
        "warnings": warnings,
        "requires_approval": approval_required,
        "approvals_required": (action or {}).get("required_approver_roles") or (["red_team_lead"] if approval_required else []),
        "policy_decision": {
            "decision": "deny" if errors else ("needs_approval" if approval_required else ("deny_runner" if wrapper_preflight_blocked or isolation_blocked else "allow_plan")),
            "risk_class": risk_class,
            "safe_by_default": True,
            "high_risk_direct_execution": False,
            "runner_preflight_blocked": wrapper_preflight_blocked,
            "runner_isolation_blocked": isolation_blocked,
        },
        "environment_constraints": {
            "network_policy": network_policy,
            "filesystem_policy": filesystem_policy,
            "isolation_readiness": isolation_readiness,
            "max_runtime_seconds": max_runtime_seconds,
            "max_output_bytes": max_output_bytes,
            "process_policy": {
                "child_process_allowlist": [str((profile or {}).get("command_name") or "")] if (profile or {}).get("command_name") else [],
                "shell_expansion_allowed": False,
            },
            "secret_policy": {
                "mask_environment": True,
                "mask_logs": True,
            },
        },
        "execution_token": execution_token,
        "runtime_probe": (wrapper_manifest or {}).get("availability") or command_availability(str((profile or {}).get("command_name") or "")),
        "audit": {
            "requested_by": requested_by,
            "created_at": now_utc(),
            "command_abstraction_only": True,
            "runner_will_execute": False,
        },
    }
    append_artifact_metadata(plan, "tool-execution-plans", plan_id)
    if action is not None and not errors:
        action.setdefault("execution_plans", [])
        if plan_id not in action["execution_plans"]:
            action["execution_plans"].append(plan_id)
        action.setdefault("audit_events", []).append({"event": "tool_execution_plan_created", "at": now_utc(), "execution_plan_id": plan_id, "execution_mode": execution_mode})
        persist_tool_action(action, {"event": "tool_execution_plan_created", "execution_plan_id": plan_id, "execution_mode": execution_mode})
    return plan


def normalize_runner_argv(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, dict):
        command = str(value.get("command") or "").strip()
        args = [str(item).strip() for item in (value.get("args") or []) if str(item).strip()]
        return [command, *args] if command else []
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def runner_command_allowed(profile: dict[str, Any] | None, argv: list[str], plan: dict[str, Any] | None) -> tuple[bool, str]:
    if not argv:
        return False, "runner_command_required"
    if len(argv) == 1 and any(char.isspace() for char in argv[0].strip()):
        return False, "runner_command_must_be_argv_list"
    command_name = str((profile or {}).get("command_name") or "").strip()
    if not command_name:
        return False, "tool_has_no_runner_command"
    command = argv[0]
    command_path = Path(command)
    command_basename = command_path.name if command_path.name else command
    allowed_names = {command_name, Path(command_name).name}
    manifest = (plan or {}).get("wrapper_manifest") or (tool_wrapper_manifest_for_profile(profile) if profile else {})
    availability = (manifest or {}).get("availability", {}) or {}
    resolved_path = str(availability.get("resolved_path") or availability.get("path") or "").strip()
    if resolved_path:
        allowed_names.add(Path(resolved_path).name)
    allowed_names_lower = {name.lower() for name in allowed_names if name}
    allowed_commands_lower = {name.lower() for name in {command_name, resolved_path} if name}
    if command.lower() not in allowed_commands_lower and command_basename.lower() not in allowed_names_lower:
        return False, "runner_command_not_in_child_process_allowlist"
    prohibited_options = set((profile or {}).get("prohibited_options") or [])
    requested_options = {item for item in argv[1:] if item in prohibited_options}
    if requested_options:
        return False, f"prohibited_options_present:{','.join(sorted(requested_options))}"
    return True, ""


def write_runner_output_artifact(case_id: str, run_id: str, stream_name: str, content: str) -> dict[str, Any]:
    output_dir = case_dir(case_id) / "runner-output" / safe_name(run_id)
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = output_dir / f"{safe_name(stream_name)}.txt"
    artifact_path.write_text(content, encoding="utf-8", newline="\n")
    return {
        "artifact_id": stable_id("ART", [run_id, stream_name, sha256_file(artifact_path)]),
        "source_path_or_ref": artifact_path.as_posix(),
        "hash": sha256_file(artifact_path),
        "content_type": "text/plain",
        "summary": f"Governed runner {stream_name} captured as untrusted tool output.",
        "imported_at": now_utc(),
    }


def write_runner_json_artifact(case_id: str, run_id: str, stream_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    output_dir = case_dir(case_id) / "runner-output" / safe_name(run_id)
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = output_dir / f"{safe_name(stream_name)}.json"
    artifact_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    return {
        "artifact_id": stable_id("ART", [run_id, stream_name, sha256_file(artifact_path)]),
        "source_path_or_ref": artifact_path.as_posix(),
        "hash": sha256_file(artifact_path),
        "content_type": "application/json",
        "summary": f"Governed runner {stream_name} captured as untrusted tool execution metadata.",
        "imported_at": now_utc(),
    }


def write_imported_tool_output_artifact(case_id: str, run_id: str, stream_name: str, content: Any) -> dict[str, Any]:
    if isinstance(content, (dict, list)):
        return write_runner_output_artifact(case_id, run_id, stream_name, json.dumps(content, ensure_ascii=False))
    return write_runner_output_artifact(case_id, run_id, stream_name, str(content))


def imported_toolchain_step_artifacts(case_id: str, run_id: str, step: dict[str, Any]) -> list[dict[str, Any] | str]:
    artifacts: list[dict[str, Any] | str] = []
    raw_artifacts = step.get("raw_artifacts") or step.get("operator_artifacts") or []
    if isinstance(raw_artifacts, list):
        artifacts.extend(raw_artifacts)
    elif raw_artifacts:
        artifacts.append(raw_artifacts)

    inline_fields = [
        ("operator-output", step.get("operator_output")),
        ("imported-output", step.get("imported_output")),
        ("imported-stdout", step.get("imported_stdout")),
        ("imported-json", step.get("imported_json")),
    ]
    for stream_name, value in inline_fields:
        if value is not None:
            artifacts.append(write_imported_tool_output_artifact(case_id, run_id, stream_name, value))
    return artifacts


def container_runtime_executable() -> str:
    configured = os.environ.get("REDTEAM_AX_CONTAINER_RUNTIME") or "docker"
    return shutil.which(configured) or ""


def build_ephemeral_container_command(
    case_id: str,
    run_id: str,
    plan: dict[str, Any],
    argv: list[str],
) -> dict[str, Any]:
    isolation = plan.get("environment_constraints", {}).get("isolation_readiness") or {}
    container_policy = isolation.get("container_policy") or {}
    image_digest = str(container_policy.get("image_digest") or "").strip()
    runtime_name = str(container_policy.get("runtime") or os.environ.get("REDTEAM_AX_CONTAINER_RUNTIME") or "docker").strip()
    runtime_path = container_runtime_executable()
    case_path = case_dir(case_id)
    resources = container_policy.get("resource_limits") or {}
    network_policy = plan.get("environment_constraints", {}).get("network_policy") or {}
    network_args = ["--network", "none"]
    if network_policy.get("egress_allowed"):
        network_args = ["--network", "none"]
    docker_args = [
        runtime_path or runtime_name,
        "run",
        "--rm",
        "--name",
        safe_name(f"rtax-{run_id}")[:60],
        *network_args,
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--cpus",
        str(resources.get("cpus") or "1"),
        "--memory",
        str(resources.get("memory") or "512m"),
        "--pids-limit",
        str(resources.get("pids_limit") or 128),
        "--mount",
        f"type=bind,src={PROJECT_ROOT.as_posix()},dst=/workspace,readonly",
        "--mount",
        f"type=bind,src={case_path.as_posix()},dst=/case",
        "--workdir",
        "/case",
        image_digest,
        *argv,
    ]
    return {
        "runtime_name": runtime_name,
        "runtime_path": runtime_path or None,
        "image_digest": image_digest or None,
        "container_argv": docker_args,
        "network_args": network_args,
        "mounts": [
            {"source": PROJECT_ROOT.as_posix(), "target": "/workspace", "mode": "readonly"},
            {"source": case_path.as_posix(), "target": "/case", "mode": "write"},
        ],
        "resource_limits": resources,
        "trusted_as_instruction": False,
    }


def governed_container_runner_attempt(
    case_id: str,
    action_id: str,
    run_id: str,
    plan: dict[str, Any],
    argv: list[str],
    attempt: dict[str, Any],
    payload: dict[str, Any],
) -> tuple[dict[str, Any], list[str], list[dict[str, Any]]]:
    errors: list[str] = []
    raw_artifacts: list[dict[str, Any]] = []
    isolation = plan.get("environment_constraints", {}).get("isolation_readiness") or {}
    if isolation.get("requested_backend") != "ephemeral_container":
        errors.append("ephemeral_container_backend_not_requested")
    if isolation.get("status") != "container_ready":
        errors.append("ephemeral_container_not_ready")
    if isolation.get("commands_executed_by_api") is not False:
        errors.append("container_readiness_must_be_side_effect_free")
    launch_plan = build_ephemeral_container_command(case_id, run_id, plan, argv)
    if not launch_plan.get("image_digest"):
        errors.append("container_image_digest_required")
    dry_run = bool(payload.get("container_dry_run")) or truthy_env("REDTEAM_AX_CONTAINER_RUNNER_DRY_RUN")
    runtime_path = str(launch_plan.get("runtime_path") or "")
    if not dry_run and not runtime_path:
        errors.append("container_runtime_executable_not_found")

    attempt.update({
        "runner_backend": "ephemeral_container",
        "container_launch": launch_plan,
        "container_dry_run": dry_run,
        "cwd": case_dir(case_id).as_posix(),
    })
    raw_artifacts.append(write_runner_json_artifact(case_id, run_id, "container-launch-plan", {
        "kind": "redteam_ax_v2_container_launch_plan",
        "case_id": case_id,
        "action_id": action_id,
        "run_id": run_id,
        "tool_id": attempt.get("tool_id"),
        "execution_plan_id": attempt.get("execution_plan_id"),
        "container_launch": launch_plan,
        "dry_run": dry_run,
        "trusted_as_instruction": False,
        "created_at": now_utc(),
    }))
    if errors:
        attempt.update({"status": "blocked", "errors": [*attempt.get("errors", []), *errors], "completed_at": now_utc()})
        return attempt, errors, raw_artifacts
    if dry_run:
        if payload.get("container_mock_stdout"):
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stdout", str(payload.get("container_mock_stdout"))))
        if payload.get("container_mock_stderr"):
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stderr", str(payload.get("container_mock_stderr"))))
        attempt.update({
            "status": "container_launch_prepared",
            "completed_at": now_utc(),
            "exit_code": None,
            "stdout_bytes": len(str(payload.get("container_mock_stdout") or "").encode("utf-8")),
            "stderr_bytes": len(str(payload.get("container_mock_stderr") or "").encode("utf-8")),
            "output_truncated": False,
        })
        return attempt, errors, raw_artifacts
    try:
        completed = subprocess.run(
            launch_plan["container_argv"],
            cwd=case_dir(case_id).as_posix(),
            capture_output=True,
            text=True,
            timeout=attempt["timeout_seconds"],
            shell=False,
        )
        stdout = (completed.stdout or "")[: attempt["max_output_bytes"]]
        stderr = (completed.stderr or "")[: attempt["max_output_bytes"]]
        attempt.update({
            "status": "executed" if completed.returncode == 0 else "failed",
            "completed_at": now_utc(),
            "exit_code": completed.returncode,
            "stdout_bytes": len(stdout.encode("utf-8")),
            "stderr_bytes": len(stderr.encode("utf-8")),
            "output_truncated": len((completed.stdout or "").encode("utf-8")) > attempt["max_output_bytes"] or len((completed.stderr or "").encode("utf-8")) > attempt["max_output_bytes"],
        })
        if stdout:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stdout", stdout))
        if stderr:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stderr", stderr))
    except subprocess.TimeoutExpired as exc:
        attempt.update({"status": "timeout", "completed_at": now_utc(), "exit_code": None})
        errors.append("container_runner_timeout")
        if exc.stdout:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stdout", str(exc.stdout)[: attempt["max_output_bytes"]]))
        if exc.stderr:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stderr", str(exc.stderr)[: attempt["max_output_bytes"]]))
    except OSError as exc:
        attempt.update({"status": "failed_to_start", "completed_at": now_utc(), "exit_code": None})
        errors.append(f"container_runner_start_failed:{exc.__class__.__name__}")
    return attempt, errors, raw_artifacts


def governed_runner_attempt(
    case_id: str,
    action_id: str,
    run_id: str,
    profile: dict[str, Any] | None,
    execution_mode: str,
    payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, list[str], list[dict[str, Any]]]:
    if "runner_command" not in payload and "runner_argv" not in payload:
        return None, [], []
    plan_id = str(payload.get("execution_plan_id") or "").strip()
    plan = load_json_record(plan_id, "tool-execution-plans", case_id=case_id) if plan_id else None
    argv = normalize_runner_argv(payload.get("runner_argv") if "runner_argv" in payload else payload.get("runner_command"))
    token_id = str(payload.get("execution_token_id") or (payload.get("execution_token") or {}).get("token_id") or "").strip()
    errors: list[str] = []
    raw_artifacts: list[dict[str, Any]] = []
    if not plan_id:
        errors.append("execution_plan_id_required_for_runner_execution")
    if plan is None:
        errors.append("execution_plan_not_found")
    if execution_mode not in {"dry_run", "sandbox_execute"}:
        errors.append("runner_command_not_allowed_for_execution_mode")
    if plan is not None:
        plan_token = plan.get("execution_token") or {}
        if plan.get("status") != "PlanReady":
            errors.append("execution_plan_not_ready")
        if plan.get("policy_decision", {}).get("decision") != "allow_plan":
            errors.append("execution_plan_policy_not_allow")
        if plan_token.get("status") != "issued" or not plan_token.get("token_id"):
            errors.append("execution_token_not_issued")
        if token_id != plan_token.get("token_id"):
            errors.append("execution_token_mismatch")
        if plan.get("tool_id") != str((profile or {}).get("tool_id") or ""):
            errors.append("execution_plan_tool_mismatch")
        if plan.get("action_id") != action_id:
            errors.append("execution_plan_action_mismatch")
        if plan.get("execution_mode") != execution_mode:
            errors.append("execution_plan_mode_mismatch")
        plan_backend = plan.get("environment_constraints", {}).get("isolation_readiness", {}).get("requested_backend")
        if plan_backend != "ephemeral_container" and plan.get("wrapper_manifest", {}).get("requires_pin_before_runner"):
            errors.append("wrapper_preflight_not_trusted")
    allowed, reason = runner_command_allowed(profile, argv, plan)
    if not allowed:
        errors.append(reason)

    attempt = {
        "kind": "redteam_ax_v2_governed_runner_attempt",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "execution_plan_id": plan_id or None,
        "execution_token_id": token_id or None,
        "tool_id": (profile or {}).get("tool_id"),
        "execution_mode": execution_mode,
        "runner_argv": argv,
        "shell": False,
        "status": "blocked" if errors else "executing",
        "errors": errors,
        "started_at": now_utc(),
        "completed_at": None,
        "exit_code": None,
        "timeout_seconds": min(int(payload.get("max_runtime_seconds") or (plan or {}).get("environment_constraints", {}).get("max_runtime_seconds") or 30), 120),
        "max_output_bytes": min(int(payload.get("max_output_bytes") or (plan or {}).get("environment_constraints", {}).get("max_output_bytes") or MAX_RUNNER_OUTPUT_BYTES), MAX_RUNNER_OUTPUT_BYTES),
        "cwd": case_dir(case_id).as_posix(),
    }
    if errors:
        return attempt, errors, raw_artifacts

    if (plan or {}).get("environment_constraints", {}).get("isolation_readiness", {}).get("requested_backend") == "ephemeral_container":
        return governed_container_runner_attempt(case_id, action_id, run_id, plan, argv, attempt, payload)

    try:
        completed = subprocess.run(
            argv,
            cwd=case_dir(case_id).as_posix(),
            capture_output=True,
            text=True,
            timeout=attempt["timeout_seconds"],
            shell=False,
        )
        stdout = (completed.stdout or "")[: attempt["max_output_bytes"]]
        stderr = (completed.stderr or "")[: attempt["max_output_bytes"]]
        attempt.update({
            "status": "executed" if completed.returncode == 0 else "failed",
            "completed_at": now_utc(),
            "exit_code": completed.returncode,
            "stdout_bytes": len(stdout.encode("utf-8")),
            "stderr_bytes": len(stderr.encode("utf-8")),
            "output_truncated": len((completed.stdout or "").encode("utf-8")) > attempt["max_output_bytes"] or len((completed.stderr or "").encode("utf-8")) > attempt["max_output_bytes"],
        })
        if stdout:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stdout", stdout))
        if stderr:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stderr", stderr))
    except subprocess.TimeoutExpired as exc:
        attempt.update({"status": "timeout", "completed_at": now_utc(), "exit_code": None})
        errors.append("runner_timeout")
        if exc.stdout:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stdout", str(exc.stdout)[: attempt["max_output_bytes"]]))
        if exc.stderr:
            raw_artifacts.append(write_runner_output_artifact(case_id, run_id, "stderr", str(exc.stderr)[: attempt["max_output_bytes"]]))
    except OSError as exc:
        attempt.update({"status": "failed_to_start", "completed_at": now_utc(), "exit_code": None})
        errors.append(f"runner_start_failed:{exc.__class__.__name__}")
    return attempt, errors, raw_artifacts


def governed_tool_execution(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    action = load_tool_action(action_id, case_id)
    tool_id = str(payload.get("tool_id") or (action or {}).get("tool_id") or "").strip()
    profile = analysis_tool_profile(tool_id)
    execution_mode = str(payload.get("execution_mode") or (profile or {}).get("default_execution_mode") or "manual_operator_run").strip()
    requested_by = str(payload.get("requested_by") or payload.get("executed_by") or "").strip()
    raw_artifacts = payload.get("raw_artifacts") or []
    target_scope_refs = payload.get("target_scope_refs") or (action or {}).get("target_scope_refs") or []
    inputs = payload.get("inputs") or (action or {}).get("inputs") or {}
    errors: list[str] = []

    if action is None:
        errors.append("tool_action_card_required_before_execution")
    if profile is None:
        errors.append("tool_profile_not_registered")
    if not requested_by:
        errors.append("requested_by_required")
    if profile is not None and execution_mode not in profile.get("allowed_execution_modes", []):
        errors.append("execution_mode_not_allowed_for_tool")
    if profile is not None and execution_mode in profile.get("denied_execution_modes", []):
        errors.append("execution_mode_denied_for_tool")
    prohibited_options = {
        option for option in (profile or {}).get("prohibited_options", [])
        if option in inputs or option in payload
    }
    if prohibited_options:
        errors.append(f"prohibited_options_present:{','.join(sorted(prohibited_options))}")

    risk_class = normalize_risk_class((action or {}).get("risk_class") or (profile or {}).get("risk_class"))
    active_modes = {"manual_operator_run", "lab_execute", "staging_execute", "production_read_only", "controlled_production_execute"}
    if execution_mode in active_modes and not target_scope_refs:
        errors.append("target_scope_refs_required_for_active_execution")
    if risk_class in HIGH_RISK_CLASSES and execution_mode in active_modes and action and str(action.get("status") or "") != "Approved":
        errors.append("approval_required_before_tool_execution")
    if risk_class == "T7":
        errors.append("restricted_offensive_tool_execution_prohibited")

    status = "invalid" if errors else "OutputImported"
    if execution_mode == "plan_only" and not errors:
        status = "PlanOnly"
    run_id = str(payload.get("run_id") or stable_id("TRUN", [case_id, action_id, tool_id, execution_mode, requested_by, raw_artifacts, now_utc()]))
    runner_attempt, runner_errors, runner_artifacts = governed_runner_attempt(case_id, action_id, run_id, profile, execution_mode, payload)
    if runner_errors:
        errors.extend(runner_errors)
    if runner_attempt is not None:
        append_artifact_metadata(runner_attempt, "runner-attempts", stable_id("RUNA", [run_id, runner_attempt.get("execution_plan_id"), runner_attempt.get("runner_argv")]))
    if runner_artifacts:
        raw_artifacts = [*raw_artifacts, *runner_artifacts]
    if runner_attempt is not None:
        if errors:
            status = "invalid"
        elif runner_attempt.get("status") == "executed":
            status = "RunnerExecuted"
        elif runner_attempt.get("status") == "container_launch_prepared":
            status = "ContainerLaunchPrepared"
        else:
            status = "RunnerFailed"
    availability = command_availability(str((profile or {}).get("command_name") or ""))
    untrusted_envelope = {
        "trusted_as_instruction": False,
        "trusted_as_data": True,
        "source_tool_id": tool_id or None,
        "run_id": run_id,
        "classification": payload.get("data_classification") or "internal",
        "content_summary": payload.get("output_summary") or "Tool output is isolated as untrusted data for normalizer review.",
        "raw_content_ref": raw_artifacts,
    }
    run_record = {
        "kind": "redteam_ax_v2_tool_run_record",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "tool_id": tool_id,
        "tool_name": (profile or {}).get("name"),
        "execution_mode": execution_mode,
        "environment": payload.get("environment") or (action or {}).get("environment") or "approved_scope",
        "executed_by": requested_by,
        "approved_by": [
            decision.get("approver")
            for decision in ((action or {}).get("approval_decisions") or [])
            if decision.get("decision") == "approve"
        ],
        "status": status,
        "errors": errors,
        "target_scope_refs": target_scope_refs,
        "raw_artifacts": [
            {
                "artifact_id": artifact.get("artifact_id") if isinstance(artifact, dict) and artifact.get("artifact_id") else stable_id("ART", [run_id, artifact]),
                "source_path_or_ref": artifact if isinstance(artifact, str) else artifact.get("source_path_or_ref") or artifact.get("path") or artifact,
                "hash": artifact.get("hash") if isinstance(artifact, dict) and artifact.get("hash") else stable_id("SHA256", [run_id, artifact]),
                "content_type": artifact.get("content_type") if isinstance(artifact, dict) and artifact.get("content_type") else ("application/json" if (profile or {}).get("supports_json_output") else "application/octet-stream"),
                "summary": artifact.get("summary") if isinstance(artifact, dict) and artifact.get("summary") else (payload.get("output_summary") or f"{(profile or {}).get('display_name') or tool_id} output imported for analysis."),
                "imported_at": artifact.get("imported_at") if isinstance(artifact, dict) and artifact.get("imported_at") else now_utc(),
            }
            for artifact in raw_artifacts
        ],
        "runner_attempt": runner_attempt,
        "normalized_results": [],
        "evidence_candidates": [],
        "policy_decision": {
            "risk_class": risk_class,
            "requires_human_approval": bool((profile or {}).get("requires_human_approval")),
            "requires_two_person_approval": bool((profile or {}).get("requires_two_person_approval")),
            "allowed_execution_modes": (profile or {}).get("allowed_execution_modes") or [],
            "denied_execution_modes": (profile or {}).get("denied_execution_modes") or [],
            "decision": "deny" if errors else ("allow_runner_execution" if runner_attempt is not None else "allow_recorded_execution"),
        },
        "runtime_probe": availability,
        "analysis_agent_id": (profile or {}).get("agent_id"),
        "normalizer_id": (profile or {}).get("normalizer_id"),
        "untrusted_output_envelope": untrusted_envelope,
        "notes": payload.get("notes") or "Governed execution record created by RedTeam AX; raw output must be normalized before evidence use.",
    }
    append_artifact_metadata(run_record, "tool-runs", run_id)
    if action is not None and not errors:
        action["status"] = "ToolExecutionPlanned" if status == "PlanOnly" else "OutputImported"
        action.setdefault("audit_events", []).append({"event": "governed_tool_execution_recorded", "at": now_utc(), "run_id": run_id, "tool_id": tool_id, "execution_mode": execution_mode})
        persist_tool_action(action, {"event": "governed_tool_execution_recorded", "run_id": run_id, "tool_id": tool_id, "execution_mode": execution_mode})
    return run_record


def governed_toolchain_execution(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("executed_by") or "").strip()
    chain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("tools") or payload.get("steps") or [], now_utc()]))
    raw_steps = payload.get("tools") or payload.get("steps") or []
    errors: list[str] = []
    warnings: list[str] = []
    steps: list[dict[str, Any]] = []
    progress_events: list[dict[str, Any]] = []
    if not requested_by:
        errors.append("requested_by_required")
    if not isinstance(raw_steps, list) or len(raw_steps) < 2:
        errors.append("at_least_two_tool_steps_required_for_composite_execution")
    if isinstance(raw_steps, list) and len(raw_steps) > 6:
        errors.append("too_many_tool_steps_requested")

    if not errors:
        total_steps = len(raw_steps)
        for index, raw_step in enumerate(raw_steps):
            step = raw_step if isinstance(raw_step, dict) else {}
            tool_id = str(step.get("tool_id") or "").strip()
            profile = analysis_tool_profile(tool_id)
            display_name = (profile or {}).get("display_name") or (profile or {}).get("name") or tool_id or f"step-{index + 1}"
            action_id = str(step.get("action_id") or stable_id("TAC", [case_id, chain_id, index, tool_id]))
            execution_mode = str(step.get("execution_mode") or (profile or {}).get("default_execution_mode") or "manual_operator_run").strip()
            step_record: dict[str, Any] = {
                "index": index,
                "step_number": index + 1,
                "tool_id": tool_id,
                "tool_name": (profile or {}).get("name"),
                "display_name_ko": display_name,
                "action_id": action_id,
                "execution_mode": execution_mode,
                "status": "pending",
                "status_ko": "대기",
                "progress_percent": int(index / total_steps * 100),
                "errors": [],
                "plan": None,
                "run": None,
                "operator_message_ko": f"{display_name} 실행 준비를 시작합니다.",
            }
            if profile is None:
                step_record["status"] = "invalid"
                step_record["status_ko"] = "등록되지 않은 도구"
                step_record["operator_message_ko"] = "이 도구는 RedTeam AX 도구 카탈로그에 등록되어 있지 않습니다."
                step_record["errors"].append("tool_profile_not_registered")
                steps.append(step_record)
                progress_events.append({
                    "step_number": index + 1,
                    "tool_id": tool_id,
                    "stage": "profile_lookup",
                    "status": "invalid",
                    "status_ko": "도구 확인 실패",
                    "message_ko": step_record["operator_message_ko"],
                    "progress_percent": int((index + 1) / total_steps * 100),
                })
                continue

            action = load_tool_action(action_id, case_id)
            if action is None:
                action = plan_tool_action({
                    "case_id": case_id,
                    "action_id": action_id,
                    "title": step.get("title") or f"{chain_id} · {profile.get('display_name') or tool_id}",
                    "objective": step.get("objective") or payload.get("objective") or "Composite RedTeam AX analyzer execution",
                    "tool_id": tool_id,
                    "requested_by": requested_by,
                    "target_scope_refs": step.get("target_scope_refs") or payload.get("target_scope_refs") or [],
                    "environment": step.get("environment") or payload.get("environment") or "approved_scope",
                    "inputs": step.get("inputs") or {},
                })
            plan = build_tool_execution_plan(action_id, {
                "case_id": case_id,
                "tool_id": tool_id,
                "execution_mode": execution_mode,
                "requested_by": requested_by,
                "target_scope_refs": step.get("target_scope_refs") or payload.get("target_scope_refs") or [],
                "environment": step.get("environment") or payload.get("environment") or "approved_scope",
                "runner_backend": step.get("runner_backend") or payload.get("runner_backend"),
                "max_runtime_seconds": step.get("max_runtime_seconds") or payload.get("max_runtime_seconds"),
                "max_output_bytes": step.get("max_output_bytes") or payload.get("max_output_bytes"),
                "network_allowlist": step.get("network_allowlist") or payload.get("network_allowlist"),
            })
            step_record["plan"] = {
                "execution_plan_id": plan.get("execution_plan_id"),
                "status": plan.get("status"),
                "policy_decision": plan.get("policy_decision"),
                "execution_token": plan.get("execution_token"),
                "artifact_path": plan.get("artifact_path"),
            }
            progress_events.append({
                "step_number": index + 1,
                "tool_id": tool_id,
                "tool_name": display_name,
                "stage": "execution_plan",
                "status": plan.get("status") or "unknown",
                "status_ko": "실행 계획 준비됨" if plan.get("status") == "PlanReady" else "실행 계획 차단",
                "message_ko": (
                    f"{display_name} 실행 계획과 실행 토큰을 확인했습니다."
                    if plan.get("status") == "PlanReady"
                    else f"{display_name} 실행 계획이 준비되지 않아 실행하지 않습니다."
                ),
                "progress_percent": int((index + 0.35) / total_steps * 100),
            })
            runner_argv = normalize_runner_argv(step.get("runner_argv") if "runner_argv" in step else step.get("runner_command"))
            import_run_id = str(step.get("run_id") or stable_id("TRUN", [case_id, action_id, tool_id, execution_mode, requested_by, "toolchain-import", index]))
            imported_artifacts = imported_toolchain_step_artifacts(case_id, import_run_id, step)
            if runner_argv and plan.get("status") == "PlanReady":
                progress_events.append({
                    "step_number": index + 1,
                    "tool_id": tool_id,
                    "tool_name": display_name,
                    "stage": "runner_start",
                    "status": "running",
                    "status_ko": "실행 중",
                    "message_ko": f"{display_name}를 승인된 runner로 실행합니다. 쉘 확장은 사용하지 않습니다.",
                    "progress_percent": int((index + 0.55) / total_steps * 100),
                })
                run = governed_tool_execution(action_id, {
                    "case_id": case_id,
                    "tool_id": tool_id,
                    "execution_mode": execution_mode,
                    "requested_by": requested_by,
                    "target_scope_refs": step.get("target_scope_refs") or payload.get("target_scope_refs") or [],
                    "environment": step.get("environment") or payload.get("environment") or "approved_scope",
                    "execution_plan_id": plan.get("execution_plan_id"),
                    "execution_token_id": (plan.get("execution_token") or {}).get("token_id"),
                    "runner_argv": runner_argv,
                    "max_runtime_seconds": step.get("max_runtime_seconds") or payload.get("max_runtime_seconds"),
                    "max_output_bytes": step.get("max_output_bytes") or payload.get("max_output_bytes"),
                    "container_dry_run": step.get("container_dry_run") or payload.get("container_dry_run"),
                    "container_mock_stdout": step.get("container_mock_stdout"),
                    "container_mock_stderr": step.get("container_mock_stderr"),
                    "output_summary": step.get("output_summary") or f"{profile.get('display_name') or tool_id} composite runner output.",
                })
                step_record["run"] = {
                    "run_id": run.get("run_id"),
                    "status": run.get("status"),
                    "policy_decision": run.get("policy_decision"),
                    "runner_attempt": run.get("runner_attempt"),
                    "raw_artifacts": run.get("raw_artifacts") or [],
                    "artifact_path": run.get("artifact_path"),
                    "analysis_agent_id": run.get("analysis_agent_id"),
                    "normalizer_id": run.get("normalizer_id"),
                }
                step_record["status"] = "executed" if run.get("status") in {"RunnerExecuted", "ContainerLaunchPrepared"} else "run_recorded"
                step_record["status_ko"] = "실행 완료" if step_record["status"] == "executed" else "실행 기록됨"
                step_record["progress_percent"] = int((index + 1) / total_steps * 100)
                step_record["operator_message_ko"] = (
                    f"{display_name} 실행 결과가 저장되었습니다. 다음 단계에서 결과 회수·Evidence 후보 생성을 진행하세요."
                    if step_record["status"] == "executed"
                    else f"{display_name} 실행 기록이 저장되었지만 결과 상태를 검토해야 합니다."
                )
                if run.get("errors"):
                    step_record["errors"].extend(run.get("errors") or [])
                    step_record["status_ko"] = "실행 오류"
                    step_record["operator_message_ko"] = f"{display_name} 실행 중 오류가 있어 상세 오류를 확인해야 합니다."
                progress_events.append({
                    "step_number": index + 1,
                    "tool_id": tool_id,
                    "tool_name": display_name,
                    "stage": "runner_finish",
                    "status": step_record["status"],
                    "status_ko": step_record["status_ko"],
                    "message_ko": step_record["operator_message_ko"],
                    "progress_percent": step_record["progress_percent"],
                })
            elif imported_artifacts and plan.get("status") == "PlanReady":
                run = governed_tool_execution(action_id, {
                    "case_id": case_id,
                    "tool_id": tool_id,
                    "execution_mode": execution_mode,
                    "requested_by": requested_by,
                    "target_scope_refs": step.get("target_scope_refs") or payload.get("target_scope_refs") or [],
                    "environment": step.get("environment") or payload.get("environment") or "approved_scope",
                    "run_id": import_run_id,
                    "raw_artifacts": imported_artifacts,
                    "output_summary": step.get("output_summary") or f"{profile.get('display_name') or tool_id} operator/imported output.",
                    "notes": step.get("notes") or "Operator/imported output attached to governed toolchain as untrusted data; no scanner command executed by this import path.",
                })
                step_record["run"] = {
                    "run_id": run.get("run_id"),
                    "status": run.get("status"),
                    "policy_decision": run.get("policy_decision"),
                    "runner_attempt": run.get("runner_attempt"),
                    "raw_artifacts": run.get("raw_artifacts") or [],
                    "artifact_path": run.get("artifact_path"),
                    "analysis_agent_id": run.get("analysis_agent_id"),
                    "normalizer_id": run.get("normalizer_id"),
                }
                step_record["status"] = "imported" if run.get("status") in {"OutputImported", "PlanOnly"} else "run_recorded"
                step_record["status_ko"] = "결과 첨부 완료" if step_record["status"] == "imported" else "결과 첨부 기록됨"
                step_record["progress_percent"] = int((index + 1) / total_steps * 100)
                step_record["operator_message_ko"] = (
                    f"{display_name} 결과 파일을 명령이 아닌 자료로 첨부했습니다. 결과 회수·Evidence 후보 생성을 진행하세요."
                    if step_record["status"] == "imported"
                    else f"{display_name} 결과 첨부 기록을 검토해야 합니다."
                )
                if run.get("errors"):
                    step_record["errors"].extend(run.get("errors") or [])
                    step_record["status_ko"] = "첨부 오류"
                    step_record["operator_message_ko"] = f"{display_name} 결과 첨부 중 오류가 있어 상세 오류를 확인해야 합니다."
                progress_events.append({
                    "step_number": index + 1,
                    "tool_id": tool_id,
                    "tool_name": display_name,
                    "stage": "artifact_import",
                    "status": step_record["status"],
                    "status_ko": step_record["status_ko"],
                    "message_ko": step_record["operator_message_ko"],
                    "progress_percent": step_record["progress_percent"],
                })
            elif runner_argv:
                step_record["status"] = "blocked"
                step_record["status_ko"] = "실행 차단"
                step_record["progress_percent"] = int((index + 1) / total_steps * 100)
                step_record["operator_message_ko"] = f"{display_name} 실행 계획이 준비되지 않아 실행하지 않았습니다."
                step_record["errors"].append("execution_plan_not_ready_for_runner")
                warnings.append(f"{tool_id}:execution_plan_not_ready_for_runner")
            elif imported_artifacts:
                step_record["status"] = "blocked"
                step_record["status_ko"] = "첨부 차단"
                step_record["progress_percent"] = int((index + 1) / total_steps * 100)
                step_record["operator_message_ko"] = f"{display_name} 가져오기 계획이 준비되지 않아 결과를 첨부하지 않았습니다."
                step_record["errors"].append("execution_plan_not_ready_for_import")
                warnings.append(f"{tool_id}:execution_plan_not_ready_for_import")
            else:
                step_record["status"] = "planned"
                step_record["status_ko"] = "계획만 생성"
                step_record["progress_percent"] = int((index + 1) / total_steps * 100)
                step_record["operator_message_ko"] = f"{display_name}는 아직 실행 명령이나 첨부 결과가 없어 계획만 생성했습니다."
            steps.append(step_record)

    executed_count = sum(1 for step in steps if step.get("status") == "executed")
    imported_count = sum(1 for step in steps if step.get("status") == "imported")
    blocked_count = sum(1 for step in steps if step.get("status") in {"blocked", "invalid"} or step.get("errors"))
    completed_step_count = executed_count + imported_count
    progress_percent = 0
    if steps:
        progress_percent = int(sum(int(step.get("progress_percent") or 0) for step in steps) / len(steps))
        if completed_step_count == len(steps) and not blocked_count:
            progress_percent = 100
    elif errors:
        progress_percent = 0
    next_action_ko = (
        "결과 회수 버튼을 눌러 각 도구 출력에서 Evidence 후보를 만드세요."
        if completed_step_count and not blocked_count
        else "차단된 도구의 실행 계획, wrapper pin, 승인 조건을 먼저 해결하세요."
        if blocked_count
        else "도구 ID와 실행 명령 또는 첨부 결과를 입력한 뒤 다시 실행하세요."
    )
    record = {
        "kind": "redteam_ax_v2_governed_toolchain_execution",
        "toolchain_id": chain_id,
        "case_id": case_id,
        "requested_by": requested_by,
        "status": "invalid" if errors else ("completed_with_blocks" if blocked_count else ("executed" if executed_count else ("imported" if imported_count else "planned"))),
        "errors": errors,
        "warnings": warnings,
        "tool_count": len(raw_steps) if isinstance(raw_steps, list) else 0,
        "executed_count": executed_count,
        "imported_count": imported_count,
        "blocked_count": blocked_count,
        "completed_step_count": completed_step_count,
        "progress_percent": progress_percent,
        "current_stage_ko": "완료" if completed_step_count and not blocked_count else ("차단 확인 필요" if blocked_count else "계획 생성"),
        "operator_summary_ko": (
            f"{len(steps)}개 도구 중 {completed_step_count}개가 실행 또는 첨부 완료되었습니다. "
            f"차단 {blocked_count}개, 명령 실행 {executed_count}개, 결과 첨부 {imported_count}개입니다."
        ),
        "next_action_ko": next_action_ko,
        "progress_events": progress_events,
        "commands_executed_by_api": executed_count > 0,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "steps": steps,
        "policy": "Composite execution reuses ToolActionCard, ExecutionPlan, execution token, wrapper pinning, and runner allowlist gates per tool.",
        "created_at": now_utc(),
    }
    append_artifact_metadata(record, "toolchain-runs", chain_id)
    return record


def import_toolchain_artifact_manifest(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "").strip()
    chain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("artifacts") or [], now_utc()]))
    raw_artifacts = payload.get("artifacts") or payload.get("items") or []
    target_scope_refs = payload.get("target_scope_refs") or []
    errors: list[str] = []
    warnings: list[str] = []
    steps: list[dict[str, Any]] = []

    if not requested_by:
        errors.append("requested_by_required")
    if not isinstance(raw_artifacts, list) or len(raw_artifacts) < 2:
        errors.append("at_least_two_artifacts_required_for_toolchain_manifest")
    if isinstance(raw_artifacts, list) and len(raw_artifacts) > 6:
        errors.append("too_many_artifacts_for_toolchain_manifest")

    if not errors:
        for index, raw_item in enumerate(raw_artifacts):
            item = raw_item if isinstance(raw_item, dict) else {}
            tool_id = str(item.get("tool_id") or "").strip()
            profile = analysis_tool_profile(tool_id)
            action_id = str(item.get("action_id") or stable_id("TAC", [case_id, chain_id, index, tool_id, "artifact-manifest"]))
            run_id = str(item.get("run_id") or stable_id("TRUN", [case_id, chain_id, index, tool_id, "artifact-manifest"]))
            step_record: dict[str, Any] = {
                "index": index,
                "tool_id": tool_id,
                "tool_name": (profile or {}).get("name"),
                "action_id": action_id,
                "execution_mode": "offline_parse",
                "status": "pending",
                "errors": [],
                "plan": None,
                "run": None,
                "import": None,
            }
            if profile is None:
                step_record["status"] = "invalid"
                step_record["errors"].append("tool_profile_not_registered")
                steps.append(step_record)
                continue

            action = load_tool_action(action_id, case_id) or plan_tool_action({
                "case_id": case_id,
                "action_id": action_id,
                "title": item.get("title") or f"{chain_id} · {(profile or {}).get('display_name') or tool_id} artifact import",
                "objective": item.get("objective") or payload.get("objective") or "Operator-submitted scanner artifact import for governed toolchain collection.",
                "tool_id": tool_id,
                "requested_by": requested_by,
                "target_scope_refs": item.get("target_scope_refs") or target_scope_refs,
                "environment": item.get("environment") or payload.get("environment") or "approved_scope",
                "inputs": {"requested_execution_mode": "offline_parse", "artifact_manifest_import": True},
            })
            plan = build_tool_execution_plan(action_id, {
                "case_id": case_id,
                "tool_id": tool_id,
                "execution_mode": "offline_parse",
                "requested_by": requested_by,
                "target_scope_refs": item.get("target_scope_refs") or target_scope_refs,
                "environment": item.get("environment") or payload.get("environment") or "approved_scope",
            })
            step_record["plan"] = {
                "execution_plan_id": plan.get("execution_plan_id"),
                "status": plan.get("status"),
                "policy_decision": plan.get("policy_decision"),
                "execution_token": plan.get("execution_token"),
                "artifact_path": plan.get("artifact_path"),
            }
            if plan.get("status") != "PlanReady":
                step_record["status"] = "blocked"
                step_record["errors"].append("execution_plan_not_ready_for_artifact_import")
                warnings.append(f"{tool_id}:execution_plan_not_ready_for_artifact_import")
                steps.append(step_record)
                continue

            run = governed_tool_execution(action_id, {
                "case_id": case_id,
                "tool_id": tool_id,
                "execution_mode": "offline_parse",
                "requested_by": requested_by,
                "target_scope_refs": item.get("target_scope_refs") or target_scope_refs,
                "environment": item.get("environment") or payload.get("environment") or "approved_scope",
                "run_id": run_id,
                "raw_artifacts": [],
                "output_summary": item.get("summary") or f"{(profile or {}).get('display_name') or tool_id} operator artifact manifest import.",
                "notes": "Operator artifact manifest import; RedTeam AX validates and copies the artifact without executing scanner commands.",
            })
            import_record = import_tool_run_file(run_id, {
                "case_id": case_id,
                "source_path": item.get("source_path") or item.get("source_path_or_ref") or item.get("path"),
                "sha256": item.get("sha256") or item.get("hash"),
                "content_type": item.get("content_type"),
                "summary": item.get("summary") or f"{(profile or {}).get('display_name') or tool_id} submitted output artifact.",
                "artifact_id": item.get("artifact_id"),
            })
            updated_run = load_json_record(run_id, "tool-runs", case_id) or run
            step_record["run"] = {
                "run_id": updated_run.get("run_id"),
                "status": updated_run.get("status"),
                "policy_decision": updated_run.get("policy_decision"),
                "runner_attempt": updated_run.get("runner_attempt"),
                "raw_artifacts": updated_run.get("raw_artifacts") or [],
                "artifact_path": updated_run.get("artifact_path"),
                "analysis_agent_id": updated_run.get("analysis_agent_id"),
                "normalizer_id": updated_run.get("normalizer_id"),
            }
            step_record["import"] = {
                "import_id": import_record.get("import_id"),
                "status": import_record.get("status"),
                "errors": import_record.get("errors") or [],
                "artifact": import_record.get("artifact"),
                "artifact_path": import_record.get("artifact_path"),
            }
            if import_record.get("errors"):
                step_record["status"] = "blocked"
                step_record["errors"].extend(import_record.get("errors") or [])
            else:
                step_record["status"] = "imported"
            steps.append(step_record)

    imported_count = sum(1 for step in steps if step.get("status") == "imported")
    blocked_count = sum(1 for step in steps if step.get("status") in {"blocked", "invalid"} or step.get("errors"))
    record = {
        "kind": "redteam_ax_v2_toolchain_artifact_manifest_import",
        "toolchain_id": chain_id,
        "case_id": case_id,
        "requested_by": requested_by,
        "status": "invalid" if errors else ("completed_with_blocks" if blocked_count else "imported"),
        "errors": errors,
        "warnings": warnings,
        "tool_count": len(raw_artifacts) if isinstance(raw_artifacts, list) else 0,
        "imported_count": imported_count,
        "blocked_count": blocked_count,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "requires_evidence_approval_before_finding": True,
        "steps": steps,
        "policy": "Operator artifact manifest imports validate workspace source paths and SHA-256, then reuse ToolActionCard, ExecutionPlan, ToolRunRecord, sanitizer, normalizer, Evidence, Matrix, Report, export, and completion gates.",
        "created_at": now_utc(),
    }
    append_artifact_metadata(record, "toolchain-runs", chain_id)
    return record


def build_toolchain_artifact_manifest(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "").strip()
    chain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("source_dir"), "artifact-manifest-build"]))
    raw_source_dir = str(payload.get("source_dir") or payload.get("directory") or "").strip()
    requested_tool_ids = [
        str(item).strip()
        for item in (payload.get("tool_ids") or [
            "TOOL-NUCLEI-001",
            "TOOL-OPENVAS-001",
            "TOOL-TRIVY-001",
            "TOOL-SCA-001",
            "TOOL-NPM-AUDIT-001",
            "TOOL-ZAP-001",
        ])
        if str(item).strip()
    ]
    recursive = bool(payload.get("recursive", False))
    max_scan_files = int(payload.get("max_scan_files") or 200)
    errors: list[str] = []
    warnings: list[str] = []
    candidate_files: list[Path] = []

    if not requested_by:
        errors.append("requested_by_required")
    if not raw_source_dir:
        errors.append("source_dir_required")
    if len(requested_tool_ids) > 6:
        errors.append("too_many_tool_ids_for_manifest_builder")

    source_dir: Path | None = None
    if raw_source_dir:
        source_dir = Path(raw_source_dir)
        if not source_dir.is_absolute():
            source_dir = PROJECT_ROOT / source_dir
        source_dir = source_dir.resolve()
        project_root = PROJECT_ROOT.resolve()
        if not is_relative_to_path(source_dir, project_root):
            errors.append("source_dir_outside_workspace")
        elif not source_dir.exists():
            errors.append("source_dir_not_found")
        elif not source_dir.is_dir():
            errors.append("source_dir_must_be_directory")

    if not errors and source_dir is not None:
        iterator = source_dir.rglob("*") if recursive else source_dir.glob("*")
        for path in iterator:
            if len(candidate_files) >= max_scan_files:
                warnings.append("max_scan_files_reached")
                break
            if not path.is_file():
                continue
            if path.stat().st_size > MAX_TOOL_ARTIFACT_BYTES:
                warnings.append(f"{path.name}:source_file_exceeds_max_bytes")
                continue
            if path.suffix.lower() not in {".json", ".jsonl", ".ndjson", ".xml", ".txt", ".sarif", ".cyclonedx"}:
                continue
            candidate_files.append(path)

    def content_type_for(path: Path) -> str:
        return {
            ".json": "application/json",
            ".jsonl": "application/x-ndjson",
            ".ndjson": "application/x-ndjson",
            ".xml": "application/xml",
            ".txt": "text/plain",
            ".sarif": "application/sarif+json",
            ".cyclonedx": "application/json",
        }.get(path.suffix.lower(), "application/octet-stream")

    patterns_by_tool = {
        "TOOL-NUCLEI-001": ["*nuclei*.jsonl", "*nuclei*.ndjson", "*nuclei*.json", "*nuclei*.txt"],
        "TOOL-OPENVAS-001": ["*openvas*.xml", "*gvm*.xml", "*greenbone*.xml"],
        "TOOL-TRIVY-001": ["*trivy*.json", "*trivy*.sarif"],
        "TOOL-SCA-001": ["*sca*.json", "*sbom*.json", "*cyclonedx*.json", "*.cyclonedx"],
        "TOOL-NPM-AUDIT-001": ["*npm-audit*.json", "*npm_audit*.json", "*audit*.json"],
        "TOOL-ZAP-001": ["*zap*.json", "*owasp-zap*.json", "*zaproxy*.json"],
    }
    artifacts: list[dict[str, Any]] = []
    unmatched_files: list[str] = []
    used_paths: set[str] = set()
    tool_coverage: list[dict[str, Any]] = []

    for tool_id in requested_tool_ids:
        profile = analysis_tool_profile(tool_id)
        if profile is None:
            warnings.append(f"{tool_id}:tool_profile_not_registered")
            tool_coverage.append({
                "tool_id": tool_id,
                "tool_name": None,
                "status": "unregistered",
                "candidate_count": 0,
                "selected_path": None,
                "required": True,
            })
            continue
        patterns = patterns_by_tool.get(tool_id, [])
        matches = [
            path
            for path in candidate_files
            if path.as_posix() not in used_paths and any(fnmatch(path.name.lower(), pattern) for pattern in patterns)
        ]
        matches.sort(key=lambda item: (item.stat().st_mtime, item.name), reverse=True)
        if not matches:
            warnings.append(f"{tool_id}:artifact_candidate_not_found")
            tool_coverage.append({
                "tool_id": tool_id,
                "tool_name": profile.get("name"),
                "display_name": profile.get("display_name"),
                "status": "missing",
                "candidate_count": 0,
                "selected_path": None,
                "required": True,
                "patterns": patterns,
            })
            continue
        selected = matches[0]
        used_paths.add(selected.as_posix())
        selected_hash = sha256_file(selected)
        artifacts.append({
            "tool_id": tool_id,
            "source_path": selected.as_posix(),
            "sha256": selected_hash,
            "content_type": content_type_for(selected),
            "summary": f"{profile.get('display_name') or tool_id} operator scanner output selected by manifest builder.",
            "artifact_id": stable_id("ART", [case_id, chain_id, tool_id, selected.as_posix(), selected_hash]),
            "detected_by": "filename_pattern",
            "candidate_count": len(matches),
            "alternative_paths": [path.as_posix() for path in matches[1:5]],
        })
        tool_coverage.append({
            "tool_id": tool_id,
            "tool_name": profile.get("name"),
            "display_name": profile.get("display_name"),
            "status": "present",
            "candidate_count": len(matches),
            "selected_path": selected.as_posix(),
            "sha256": selected_hash,
            "required": True,
            "patterns": patterns,
        })

    for path in candidate_files:
        if path.as_posix() not in used_paths:
            unmatched_files.append(path.as_posix())

    if not errors and len(artifacts) < 2:
        warnings.append("at_least_two_artifacts_required_for_import_ready_manifest")

    import_payload = {
        "case_id": case_id,
        "toolchain_id": chain_id,
        "requested_by": requested_by,
        "objective": payload.get("objective") or "Operator scanner artifact manifest prepared from workspace files.",
        "target_scope_refs": payload.get("target_scope_refs") or [],
        "artifacts": artifacts,
    }
    record = {
        "kind": "redteam_ax_v2_toolchain_artifact_manifest_builder",
        "case_id": case_id,
        "toolchain_id": chain_id,
        "requested_by": requested_by,
        "status": "invalid" if errors else ("ready_for_import" if len(artifacts) >= 2 else "needs_more_artifacts"),
        "errors": errors,
        "warnings": warnings,
        "source_dir": source_dir.as_posix() if source_dir is not None else raw_source_dir,
        "recursive": recursive,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "hash_algorithm": "sha256",
        "tool_count": len(requested_tool_ids),
        "artifact_count": len(artifacts),
        "tool_coverage": tool_coverage,
        "present_tool_ids": [item["tool_id"] for item in tool_coverage if item.get("status") == "present"],
        "missing_tool_ids": [item["tool_id"] for item in tool_coverage if item.get("status") != "present"],
        "tool_coverage_complete": bool(tool_coverage) and all(item.get("status") == "present" for item in tool_coverage),
        "unmatched_file_count": len(unmatched_files),
        "unmatched_files": unmatched_files[:20],
        "import_payload": import_payload,
        "policy": "Manifest builder scans workspace files only, computes SHA-256, and prepares an import payload; scanner commands and active scans are not executed.",
        "created_at": now_utc(),
    }
    append_artifact_metadata(record, "toolchain-runs", f"{chain_id}-manifest-builder")
    return record


def collect_toolchain_results(toolchain_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    toolchain = load_json_record(toolchain_id, "toolchain-runs", case_id)
    requested_by = str(payload.get("requested_by") or payload.get("analyst") or "").strip()
    create_evidence_candidates = bool(payload.get("create_evidence_candidates", True))
    errors: list[str] = []
    warnings: list[str] = []
    collected_steps: list[dict[str, Any]] = []
    analysis_agent_summaries: list[dict[str, Any]] = []
    if toolchain is None:
        errors.append("toolchain_run_required")
    if not requested_by:
        errors.append("requested_by_required")

    for step in (toolchain or {}).get("steps") or []:
        run = step.get("run") if isinstance(step, dict) else None
        run_id = str((run or {}).get("run_id") or "")
        step_record = {
            "index": step.get("index") if isinstance(step, dict) else None,
            "tool_id": step.get("tool_id") if isinstance(step, dict) else None,
            "run_id": run_id,
            "status": "skipped",
            "errors": [],
            "sanitize_preview": None,
            "normalized_result": None,
            "evidence_candidate": None,
        }
        if not run_id:
            step_record["status"] = "blocked"
            step_record["errors"].append("tool_run_required_for_collection")
            collected_steps.append(step_record)
            continue

        preview = preview_tool_output_sanitizer(run_id, {"case_id": case_id})
        step_record["sanitize_preview"] = {
            "preview_id": preview.get("preview_id"),
            "status": preview.get("status"),
            "requires_human_review": preview.get("requires_human_review"),
            "redaction_count": len((preview.get("sanitizer") or {}).get("redactions") or []),
            "errors": preview.get("errors") or [],
        }
        if preview.get("errors"):
            step_record["errors"].extend(preview.get("errors") or [])
        if preview.get("status") == "quarantine":
            step_record["status"] = "quarantined"
            step_record["errors"].append("tool_output_quarantined")
            collected_steps.append(step_record)
            continue

        normalized = agent_analyze_tool_run(run_id, {
            "case_id": case_id,
            "summary": payload.get("summary") or "Composite toolchain output collected for analyst review.",
            "result_type": payload.get("result_type") or "toolchain_result_evidence_candidate",
        })
        agent = normalized.get("analysis_agent") if isinstance(normalized.get("analysis_agent"), dict) else {}
        sanitizer = normalized.get("sanitizer_report") if isinstance(normalized.get("sanitizer_report"), dict) else {}
        parser_report = normalized.get("parser_report") if isinstance(normalized.get("parser_report"), dict) else {}
        structured_item_count = len(normalized.get("structured_items") or [])
        agent_name = str(agent.get("name") or agent.get("agent_id") or "LLM result normalizer agent")
        step_record["normalized_result"] = {
            "result_id": normalized.get("result_id"),
            "status": normalized.get("status"),
            "structured_item_count": structured_item_count,
            "parser": parser_report.get("parser"),
            "input_source": parser_report.get("input_source"),
            "errors": normalized.get("errors") or [],
        }
        if normalized.get("errors"):
            step_record["errors"].extend(normalized.get("errors") or [])

        if normalized.get("status") == "Normalized" and create_evidence_candidates:
            evidence = create_evidence_from_tool_run(run_id, {
                "case_id": case_id,
                "result_id": normalized.get("result_id"),
                "summary": payload.get("evidence_summary") or f"{step_record['tool_id']} toolchain output evidence candidate.",
                "validation_status": "candidate",
            })
            step_record["evidence_candidate"] = {
                "evidence_id": evidence.get("evidence_id"),
                "validation_status": evidence.get("validation_status"),
                "status": "created" if not evidence.get("errors") else "invalid",
                "errors": evidence.get("errors") or [],
            }
            if evidence.get("errors"):
                step_record["errors"].extend(evidence.get("errors") or [])

        evidence_id = (step_record.get("evidence_candidate") or {}).get("evidence_id")
        agent_summary = {
            "tool_id": step_record["tool_id"],
            "run_id": run_id,
            "result_id": normalized.get("result_id"),
            "agent_id": agent.get("agent_id"),
            "agent_name": agent_name,
            "normalizer_id": normalized.get("normalizer_id"),
            "parser": parser_report.get("parser"),
            "input_source": parser_report.get("input_source"),
            "sanitizer_status": sanitizer.get("status") or sanitizer.get("decision"),
            "redaction_count": len(sanitizer.get("redactions") or []),
            "structured_item_count": structured_item_count,
            "evidence_id": evidence_id,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "requires_evidence_approval_before_finding": True,
            "summary_ko": (
                f"{step_record['tool_id']} 결과를 {agent_name}가 정규화했습니다. "
                f"구조화 항목 {structured_item_count}건은 Evidence 후보이며 승인 전 Finding/Report Claim으로 확정하지 않습니다."
            ),
            "next_action_ko": (
                "Evidence 후보를 검토·승인한 뒤 Finding 초안 생성 단계로 이동하세요."
                if evidence_id else "정규화 결과와 sanitizer 오류를 먼저 확인한 뒤 Evidence 후보 생성을 재시도하세요."
            ),
            "evidence_use_limit_ko": (
                "원시 도구 출력은 LLM 명령이 아니라 untrusted data이며, 승인된 Evidence Card와 "
                "2인 severity 승인 전에는 보고서 주장에 사용할 수 없습니다."
            ),
        }
        step_record["analysis_agent_summary"] = agent_summary
        analysis_agent_summaries.append(agent_summary)

        step_record["status"] = "collected" if not step_record["errors"] else "collected_with_errors"
        collected_steps.append(step_record)

    collected_count = sum(1 for step in collected_steps if step.get("status") == "collected")
    evidence_count = sum(1 for step in collected_steps if (step.get("evidence_candidate") or {}).get("evidence_id"))
    blocked_count = sum(1 for step in collected_steps if step.get("status") in {"blocked", "quarantined", "collected_with_errors"})
    if toolchain is not None and not collected_steps:
        warnings.append("toolchain_has_no_collectable_runs")
    result = {
        "kind": "redteam_ax_v2_toolchain_result_collection",
        "collection_id": str(payload.get("collection_id") or stable_id("TCC", [toolchain_id, case_id, requested_by, collected_steps, now_utc()])),
        "toolchain_id": toolchain_id,
        "case_id": case_id,
        "requested_by": requested_by,
        "status": "invalid" if errors else ("collected_with_blocks" if blocked_count else "collected"),
        "errors": errors,
        "warnings": warnings,
        "toolchain_status": (toolchain or {}).get("status"),
        "step_count": len(collected_steps),
        "collected_count": collected_count,
        "blocked_count": blocked_count,
        "evidence_candidate_count": evidence_count,
        "analysis_agent_summary_count": len(analysis_agent_summaries),
        "analysis_agent_summaries": analysis_agent_summaries,
        "commands_executed_by_api": False,
        "raw_output_trusted_as_instruction": False,
        "requires_human_validation": True,
        "requires_evidence_approval_before_finding": True,
        "steps": collected_steps,
        "policy": "Toolchain collection only reads stored runner artifacts, sanitizes untrusted output, invokes normalizer agents, and creates candidate Evidence Cards for analyst approval.",
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-result-collections", result["collection_id"])
    if toolchain is not None and not errors:
        collections = list(toolchain.get("result_collections") or [])
        if result["collection_id"] not in collections:
            collections.append(result["collection_id"])
        toolchain["result_collections"] = collections
        toolchain["result_collection_status"] = result["status"]
        append_artifact_metadata(toolchain, "toolchain-runs", toolchain_id)
    return result


def approve_toolchain_collection_evidence(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    reviewer = str(payload.get("reviewed_by") or payload.get("approver") or payload.get("approved_by") or "").strip()
    reviewer_role = normalize_approver_role(payload.get("reviewer_role") or payload.get("approver_role") or "red_team_lead")
    requested_ids = {
        str(item).strip()
        for item in (payload.get("evidence_ids") or [])
        if str(item).strip()
    }
    errors: list[str] = []
    warnings: list[str] = []
    if collection is None:
        errors.append("toolchain_result_collection_required")
    if not reviewer:
        errors.append("reviewed_by_required")

    candidate_ids: list[str] = []
    for step in (collection or {}).get("steps") or []:
        evidence_candidate = step.get("evidence_candidate") if isinstance(step, dict) else None
        evidence_id = str((evidence_candidate or {}).get("evidence_id") or "").strip()
        if evidence_id and (not requested_ids or evidence_id in requested_ids):
            candidate_ids.append(evidence_id)
    if collection is not None and not candidate_ids:
        errors.append("evidence_candidates_required")
    missing_requested_ids = sorted(requested_ids - set(candidate_ids))
    if missing_requested_ids:
        errors.extend(f"evidence_candidate_not_in_collection:{evidence_id}" for evidence_id in missing_requested_ids)

    approval_id = stable_id("TCEVA", [collection_id, case_id, reviewer, reviewer_role, sorted(candidate_ids), now_utc()])
    approvals: list[dict[str, Any]] = []
    if not errors:
        for evidence_id in candidate_ids:
            approval = approve_evidence_card(evidence_id, {
                **payload,
                "case_id": case_id,
                "reviewed_by": reviewer,
                "reviewer_role": reviewer_role,
                "decision": payload.get("decision") or "approve",
            })
            approvals.append({
                "evidence_id": evidence_id,
                "approval_id": approval.get("approval_id"),
                "status": approval.get("status"),
                "identity_binding": approval.get("identity_binding"),
                "errors": approval.get("errors") or [],
            })
            if approval.get("errors"):
                errors.extend(f"evidence_approval:{evidence_id}:{error}" for error in approval.get("errors") or [])

    approved_count = sum(1 for item in approvals if item.get("status") == "approved")
    rejected_count = sum(1 for item in approvals if item.get("status") == "rejected")
    invalid_count = sum(1 for item in approvals if item.get("errors") or item.get("status") == "invalid")
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_evidence_approval",
        "approval_batch_id": approval_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": "invalid" if errors else ("evidence_rejected" if rejected_count else "evidence_approved"),
        "decision": str(payload.get("decision") or "approve").strip().lower(),
        "reviewed_by": reviewer,
        "reviewer_role": reviewer_role,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "invalid_count": invalid_count,
        "candidate_count": len(candidate_ids),
        "evidence_ids": candidate_ids,
        "approvals": approvals,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "finding_created": False,
        "report_claim_inserted": False,
        "requires_human_validation": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "승인된 Evidence ID를 Finding 후보 검토 패키지에 연결합니다.",
            "Finding 생성 후 red_team_lead와 business_owner의 severity 2인 승인을 완료합니다.",
            "Claim-Evidence Matrix 초안에서 held row가 0건인지 확인합니다.",
        ],
    }
    append_artifact_metadata(result, "toolchain-evidence-approvals", approval_id)
    if collection is not None and not errors:
        collection["evidence_approval_batch_id"] = approval_id
        collection["evidence_approval_status"] = result["status"]
        collection["approved_evidence_ids"] = candidate_ids if result["status"] == "evidence_approved" else []
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def _finding_payload_from_collection_evidence(
    collection_id: str,
    collection: dict[str, Any],
    evidence: dict[str, Any],
    step: dict[str, Any],
    payload: dict[str, Any],
) -> dict[str, Any]:
    evidence_id = str(evidence.get("evidence_id") or "").strip()
    case_id = str(evidence.get("case_id") or collection.get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    normalized_fields = evidence.get("normalized_fields") if isinstance(evidence.get("normalized_fields"), dict) else {}
    structured_items = normalized_fields.get("structured_items") if isinstance(normalized_fields.get("structured_items"), list) else []
    primary_item = next((item for item in structured_items if isinstance(item, dict)), {})
    tool_id = str(step.get("tool_id") or normalized_fields.get("tool_id") or collection.get("toolchain_id") or "toolchain").strip()
    item_name = (
        primary_item.get("name")
        or primary_item.get("title")
        or primary_item.get("vulnerability_id")
        or primary_item.get("package_name")
        or evidence.get("summary")
        or "도구 결과 후보"
    )
    target = primary_item.get("target") or primary_item.get("package_name") or primary_item.get("component") or "승인 범위 자산"
    severity = normalize_severity(primary_item.get("severity") or payload.get("severity_draft") or "medium")
    finding_id = str(payload.get("finding_id") or "").strip() or stable_id("FCOLL", [collection_id, evidence_id, item_name])
    title_prefix = str(payload.get("title_prefix") or "복합 도구 결과 후보").strip()
    return {
        "case_id": case_id,
        "finding_id": finding_id,
        "title": f"{title_prefix}: {item_name}",
        "severity_draft": severity,
        "confidence": float(payload.get("confidence") or 0.72),
        "related_objective": payload.get("related_objective") or collection.get("requested_by") or "복합 분석도구 결과 검토",
        "affected_assets": payload.get("affected_assets") or [target],
        "affected_business_process": payload.get("affected_business_process") or ["승인 범위 내 보안 검증 대상"],
        "crown_jewel_link": payload.get("crown_jewel_link") or ["case_scope"],
        "observation": (
            f"{tool_id} 결과에서 Evidence {evidence_id}로 승인된 후보가 관찰됨. "
            f"원본 요약: {evidence.get('summary') or '정규화된 도구 결과'}"
        ),
        "evidence_ids": [evidence_id],
        "expected_control": payload.get("expected_control") or "취약 컴포넌트/설정 후보는 담당자가 검토하고 조치 여부를 결정해야 함",
        "observed_control_response": payload.get("observed_control_response") or "도구 결과가 Evidence Card로 승인되었으나 Finding severity는 아직 미승인",
        "detection_gap": payload.get("detection_gap") or "탐지/운영 영향은 사람 검토 전 확정하지 않음",
        "response_gap": payload.get("response_gap") or "재시험 계획과 owner/SLA 지정 필요",
        "root_cause": payload.get("root_cause") or ["정규화된 도구 결과에서 취약점 또는 설정 검토 후보가 확인됨"],
        "business_impact": payload.get("business_impact") or "승인 범위 내 시스템에 보안 검토 및 조치 판단이 필요한 후보 리스크가 존재할 수 있음",
        "likelihood": payload.get("likelihood") or "medium",
        "impact": payload.get("impact") or ("high" if severity in {"high", "critical"} else "medium"),
        "recommendation": payload.get("recommendation") or ["담당자가 원본 Evidence와 정규화 결과를 대조하고 조치·예외·오탐 여부를 기록한다"],
        "owner": payload.get("owner") or "security-owner",
        "sla": payload.get("sla") or ("7 days" if severity in {"high", "critical"} else "30 days"),
        "verification_method": payload.get("verification_method") or "Evidence Card와 원본 도구 결과를 재검토하고 재시험 결과를 첨부",
        "retest_criteria": payload.get("retest_criteria") or "동일 도구/동일 범위 재시험에서 후보 항목이 해소되었거나 승인된 예외로 기록됨",
        "residual_risk": payload.get("residual_risk") or "최종 severity 2인 승인 전까지 보고서 Claim으로 사용하지 않음",
    }


def promote_toolchain_collection_evidence_to_findings(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "").strip()
    requested_ids = {
        str(item).strip()
        for item in (payload.get("evidence_ids") or [])
        if str(item).strip()
    }
    errors: list[str] = []
    warnings: list[str] = []
    if collection is None:
        errors.append("toolchain_result_collection_required")
    if not requested_by:
        errors.append("requested_by_required")

    collection_candidate_ids: set[str] = set()
    selected_steps: list[tuple[str, dict[str, Any]]] = []
    for step in (collection or {}).get("steps") or []:
        evidence_candidate = step.get("evidence_candidate") if isinstance(step, dict) else None
        evidence_id = str((evidence_candidate or {}).get("evidence_id") or "").strip()
        if not evidence_id:
            continue
        collection_candidate_ids.add(evidence_id)
        if not requested_ids or evidence_id in requested_ids:
            selected_steps.append((evidence_id, step))
    missing_requested_ids = sorted(requested_ids - collection_candidate_ids)
    if missing_requested_ids:
        errors.extend(f"evidence_candidate_not_in_collection:{evidence_id}" for evidence_id in missing_requested_ids)
    if collection is not None and not selected_steps:
        errors.append("approved_evidence_candidates_required")

    promotion_id = stable_id("TCFPR", [collection_id, case_id, requested_by, sorted(evidence_id for evidence_id, _ in selected_steps), now_utc()])
    promotions: list[dict[str, Any]] = []
    if not errors:
        for evidence_id, step in selected_steps:
            evidence_issues = evidence_approval_issues(case_id, [evidence_id])
            evidence = load_json_record(evidence_id, "evidence", case_id)
            item_errors = [f"evidence:{issue['type']}:{issue['id']}" for issue in evidence_issues]
            finding: dict[str, Any] | None = None
            if evidence is None:
                item_errors.append(f"evidence:missing_evidence:{evidence_id}")
            if not item_errors and evidence is not None:
                finding_payload = _finding_payload_from_collection_evidence(collection_id, collection or {}, evidence, step, payload)
                existing_finding = load_json_record(str(finding_payload.get("finding_id") or ""), "findings", case_id)
                if existing_finding is not None:
                    finding = existing_finding
                    warnings.append(f"finding_already_exists:{finding.get('finding_id')}")
                else:
                    finding = create_finding(finding_payload)
                    if finding.get("errors"):
                        item_errors.extend(str(error) for error in finding.get("errors") or [])
            promotions.append({
                "evidence_id": evidence_id,
                "status": "finding_draft_created" if finding is not None and not item_errors else "blocked",
                "finding_id": (finding or {}).get("finding_id"),
                "finding_status": (finding or {}).get("status"),
                "finding_approval_status": (finding or {}).get("approval_status"),
                "severity_draft": (finding or {}).get("severity_draft"),
                "evidence_issues": evidence_issues,
                "errors": item_errors,
            })

    created_count = sum(1 for item in promotions if item.get("status") == "finding_draft_created")
    blocked_count = sum(1 for item in promotions if item.get("status") == "blocked")
    status = "invalid" if errors else ("finding_drafts_created" if created_count and not blocked_count else "finding_drafts_partially_created" if created_count else "blocked")
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_finding_promotion",
        "promotion_batch_id": promotion_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": status,
        "requested_by": requested_by,
        "candidate_count": len(selected_steps),
        "created_count": created_count,
        "blocked_count": blocked_count,
        "promotions": promotions,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "finding_created": bool(created_count),
        "report_claim_inserted": False,
        "requires_human_validation": True,
        "requires_severity_approval": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "생성된 Finding 초안의 원본 Evidence와 관찰 내용을 검토합니다.",
            "red_team_lead와 business_owner가 severity를 각각 승인해야 Matrix ready가 됩니다.",
            "보고서 Claim 삽입 전 Claim-Evidence Matrix와 report gate를 다시 실행합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-finding-promotions", promotion_id)
    if collection is not None and not errors:
        collection["finding_promotion_batch_id"] = promotion_id
        collection["finding_promotion_status"] = status
        collection["promoted_finding_ids"] = [item.get("finding_id") for item in promotions if item.get("finding_id")]
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def approve_toolchain_collection_finding_severity(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    requested_ids = {
        str(item).strip()
        for item in (payload.get("finding_ids") or [])
        if str(item).strip()
    }
    lead_approver = str(payload.get("lead_approver") or payload.get("red_team_lead") or "").strip()
    owner_approver = str(payload.get("business_owner_approver") or payload.get("business_owner") or "").strip()
    errors: list[str] = []
    warnings: list[str] = []
    if collection is None:
        errors.append("toolchain_result_collection_required")
    if not lead_approver:
        errors.append("lead_approver_required")
    if not owner_approver:
        errors.append("business_owner_approver_required")
    if lead_approver and owner_approver and lead_approver.lower() == owner_approver.lower():
        errors.append("distinct_finding_severity_approvers_required")

    collection_finding_ids = {
        str(item).strip()
        for item in (collection or {}).get("promoted_finding_ids") or []
        if str(item).strip()
    }
    finding_ids = sorted(requested_ids or collection_finding_ids)
    missing_requested = sorted(requested_ids - collection_finding_ids)
    if missing_requested:
        errors.extend(f"finding_not_promoted_from_collection:{finding_id}" for finding_id in missing_requested)
    if collection is not None and not finding_ids:
        errors.append("promoted_findings_required")

    batch_id = stable_id("TCFAPR", [collection_id, case_id, lead_approver, owner_approver, finding_ids, now_utc()])
    approvals: list[dict[str, Any]] = []
    if not errors:
        for finding_id in finding_ids:
            finding = load_json_record(finding_id, "findings", case_id)
            item_errors: list[str] = []
            if finding is None:
                item_errors.append("finding_not_found")
                approvals.append({
                    "finding_id": finding_id,
                    "status": "invalid",
                    "severity_final": None,
                    "lead_approval_status": "invalid",
                    "business_owner_approval_status": "invalid",
                    "errors": item_errors,
                })
                continue
            severity_final = normalize_severity(payload.get("severity_final") or finding.get("severity_draft") or "medium")
            lead_payload = {
                "case_id": case_id,
                "approved_by": lead_approver,
                "approver_role": "red_team_lead",
                "severity_final": severity_final,
                "_actor_context": {
                    **resolve_actor_context({"case_id": case_id, "approver_role": "red_team_lead"}, actor_id=lead_approver, actor_role="red_team_lead"),
                    "resolved": True,
                },
            }
            lead_approval = approve_finding_severity(finding_id, lead_payload)
            owner_payload = {
                "case_id": case_id,
                "approved_by": owner_approver,
                "approver_role": "business_owner",
                "severity_final": severity_final,
                "_actor_context": {
                    **resolve_actor_context({"case_id": case_id, "approver_role": "business_owner"}, actor_id=owner_approver, actor_role="business_owner"),
                    "resolved": True,
                },
            }
            owner_approval = approve_finding_severity(finding_id, owner_payload)
            final_finding = owner_approval.get("finding") or lead_approval.get("finding") or finding
            item_errors.extend(str(error) for error in (lead_approval.get("errors") or []))
            item_errors.extend(str(error) for error in (owner_approval.get("errors") or []))
            pending_conditions = list(owner_approval.get("pending_conditions") or [])
            approvals.append({
                "finding_id": finding_id,
                "status": "approved" if final_finding.get("approval_status") == "approved" and not item_errors and not pending_conditions else "pending" if not item_errors else "invalid",
                "severity_final": final_finding.get("severity_final") or severity_final,
                "lead_approval_id": lead_approval.get("approval_id"),
                "lead_approval_status": lead_approval.get("status"),
                "business_owner_approval_id": owner_approval.get("approval_id"),
                "business_owner_approval_status": owner_approval.get("status"),
                "finding_status": final_finding.get("status"),
                "finding_approval_status": final_finding.get("approval_status"),
                "pending_conditions": pending_conditions,
                "errors": item_errors,
            })

    approved_count = sum(1 for item in approvals if item.get("status") == "approved")
    invalid_count = sum(1 for item in approvals if item.get("status") == "invalid")
    pending_count = sum(1 for item in approvals if item.get("status") == "pending")
    status = "invalid" if errors else ("findings_severity_approved" if approved_count == len(approvals) and approvals else "findings_severity_partially_approved" if approved_count else "blocked")
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_finding_severity_approval",
        "approval_batch_id": batch_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": status,
        "lead_approver": lead_approver,
        "business_owner_approver": owner_approver,
        "finding_count": len(finding_ids),
        "approved_count": approved_count,
        "pending_count": pending_count,
        "invalid_count": invalid_count,
        "approvals": approvals,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "finding_created": False,
        "report_claim_inserted": False,
        "requires_human_validation": True,
        "requires_matrix_validation": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "Claim-Evidence Matrix 초안을 다시 생성해 모든 row가 ready인지 확인합니다.",
            "report gate blocker가 0건인지 확인한 뒤 Report v2 draft를 생성합니다.",
            "최종 export 전 별도 사람 승인을 유지합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-finding-severity-approvals", batch_id)
    if collection is not None and not errors:
        collection["finding_severity_approval_batch_id"] = batch_id
        collection["finding_severity_approval_status"] = status
        collection["approved_finding_ids"] = [item["finding_id"] for item in approvals if item.get("status") == "approved"]
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def _coerce_json(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None
    return None


def _raw_output_values(payload: dict[str, Any]) -> list[Any]:
    if "raw_outputs" in payload and isinstance(payload.get("raw_outputs"), list):
        return payload.get("raw_outputs") or []
    if "raw_output" in payload:
        return [payload.get("raw_output")]
    if "tool_output" in payload:
        return [payload.get("tool_output")]
    return []


def raw_value_to_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return str(value)


def sanitize_tool_output_text(text: str, source_ref: str) -> dict[str, Any]:
    sanitized = text
    lowered = text.lower()
    indicators: list[dict[str, Any]] = []
    redactions: list[dict[str, Any]] = []

    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern in lowered:
            indicators.append({
                "category": "prompt_injection",
                "pattern": pattern,
                "source_ref": source_ref,
                "severity": "high" if pattern in {"ignore all previous instructions", "ignore previous instructions"} else "medium",
            })
    if indicators:
        sanitized_lines = []
        for line in sanitized.splitlines() or [sanitized]:
            line_lower = line.lower()
            if any(pattern in line_lower for pattern in PROMPT_INJECTION_PATTERNS):
                sanitized_lines.append("[PROMPT_INJECTION_REMOVED]")
                redactions.append({
                    "category": "prompt_injection",
                    "source_ref": source_ref,
                    "replacement": "[PROMPT_INJECTION_REMOVED]",
                })
            else:
                sanitized_lines.append(line)
        sanitized = "\n".join(sanitized_lines)

    for label, regex in SECRET_REDACTION_PATTERNS:
        matches = list(regex.finditer(sanitized))
        if not matches:
            continue
        redactions.extend({
            "category": "secret",
            "label": label,
            "source_ref": source_ref,
            "replacement": "[REDACTED_SECRET]",
        } for _ in matches)
        sanitized = regex.sub("[REDACTED_SECRET]", sanitized)

    prompt_score = 0.92 if any(item["severity"] == "high" for item in indicators) else (0.68 if indicators else 0.0)
    secret_score = min(1.0, 0.55 + (0.1 * len([item for item in redactions if item.get("category") == "secret"]))) if any(item.get("category") == "secret" for item in redactions) else 0.0
    return {
        "source_ref": source_ref,
        "sanitized_text": sanitized,
        "indicators": indicators,
        "redactions": redactions,
        "prompt_injection_score": prompt_score,
        "secret_detection_score": secret_score,
    }


def sanitize_tool_output_values(raw_values: list[Any], source_prefix: str = "payload") -> dict[str, Any]:
    sanitized_outputs: list[str] = []
    indicators: list[dict[str, Any]] = []
    redactions: list[dict[str, Any]] = []
    prompt_score = 0.0
    secret_score = 0.0
    for index, value in enumerate(raw_values):
        result = sanitize_tool_output_text(raw_value_to_text(value), f"{source_prefix}:{index}")
        sanitized_outputs.append(result["sanitized_text"])
        indicators.extend(result["indicators"])
        redactions.extend(result["redactions"])
        prompt_score = max(prompt_score, float(result["prompt_injection_score"]))
        secret_score = max(secret_score, float(result["secret_detection_score"]))
    if prompt_score >= 0.85:
        decision = "quarantine"
    elif redactions:
        decision = "redact"
    else:
        decision = "allow"
    return {
        "trusted_as_instruction": False,
        "trusted_as_data": True,
        "decision": decision,
        "prompt_injection_score": prompt_score,
        "secret_detection_score": secret_score,
        "redactions": redactions,
        "indicators": indicators,
        "sanitized_outputs": sanitized_outputs,
        "sanitized_summary": (
            "Tool output quarantined due to prompt injection indicators."
            if decision == "quarantine"
            else "Sensitive tokens were redacted from tool output."
            if decision == "redact"
            else "No prompt injection or secret indicators detected."
        ),
        "warnings": [
            *([] if prompt_score < 0.85 else ["tool_output_prompt_injection_quarantine"]),
            *([] if not redactions else ["tool_output_secret_or_instruction_redacted"]),
        ],
    }


def detect_visual_ocr_sensitive_text(ocr_text: str) -> dict[str, Any]:
    sanitized = str(ocr_text or "")
    labels: list[str] = []
    redactions: list[dict[str, Any]] = []

    sanitizer_result = sanitize_tool_output_text(sanitized, "visual_ocr:0")
    sanitized = sanitizer_result["sanitized_text"]
    for item in sanitizer_result["redactions"]:
        redactions.append({
            "action": "mask_text_region",
            "category": item.get("category") or "secret",
            "label": item.get("label") or item.get("category") or "tool_output_guardrail",
            "source_ref": item.get("source_ref") or "visual_ocr:0",
            "replacement": item.get("replacement") or "[REDACTED_VISUAL_TEXT]",
            "reason": "OCR text matched existing tool-output sanitizer guardrails.",
        })
        labels.append(str(item.get("label") or item.get("category") or "tool_output_guardrail"))

    for label, regex in VISUAL_OCR_SENSITIVE_PATTERNS:
        matches = list(regex.finditer(sanitized))
        if not matches:
            continue
        labels.append(label)
        redactions.extend({
            "action": "mask_text_region",
            "category": "visual_sensitive_text",
            "label": label,
            "source_ref": "visual_ocr:0",
            "replacement": f"[REDACTED_VISUAL_{label.upper()}]",
            "reason": "OCR text contains sensitive visual evidence that must be masked before report use.",
        } for _ in matches)
        sanitized = regex.sub(f"[REDACTED_VISUAL_{label.upper()}]", sanitized)

    sensitive_labels = sorted(set(labels))
    return {
        "sanitized_text": sanitized,
        "sensitive_labels": sensitive_labels,
        "sensitive_label_count": len(sensitive_labels),
        "redaction_actions": redactions,
        "prompt_injection_indicators": sanitizer_result["indicators"],
        "prompt_injection_score": sanitizer_result["prompt_injection_score"],
        "secret_detection_score": sanitizer_result["secret_detection_score"],
    }


def decode_image_data_url(value: Any) -> tuple[bytes | None, str | None, list[str]]:
    raw = str(value or "").strip()
    errors: list[str] = []
    if not raw:
        return None, None, ["image_data_url_required"]
    match = re.fullmatch(r"data:(image/[A-Za-z0-9.+-]+);base64,(.+)", raw, flags=re.DOTALL)
    if not match:
        return None, None, ["image_data_url_invalid"]
    try:
        return base64.b64decode(match.group(2), validate=True), match.group(1), errors
    except (binascii.Error, ValueError):
        return None, match.group(1), ["image_data_url_base64_invalid"]


def _visual_redaction_regions(image_width: int, image_height: int, actions: list[dict[str, Any]], payload: dict[str, Any]) -> list[dict[str, int | str]]:
    explicit_regions = payload.get("redaction_regions")
    regions: list[dict[str, int | str]] = []
    if isinstance(explicit_regions, list):
        for index, item in enumerate(explicit_regions):
            if not isinstance(item, dict):
                continue
            x = max(0, min(image_width, int(item.get("x") or 0)))
            y = max(0, min(image_height, int(item.get("y") or 0)))
            width = max(1, min(image_width - x, int(item.get("width") or item.get("w") or image_width)))
            height = max(1, min(image_height - y, int(item.get("height") or item.get("h") or 24)))
            regions.append({
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "source": "explicit_region",
                "action_index": index,
            })
    if regions:
        return regions

    if not actions:
        return []
    band_height = max(18, min(44, image_height // max(4, min(len(actions) + 2, 10))))
    top_margin = max(4, image_height // 20)
    usable_height = max(1, image_height - top_margin)
    for index, action in enumerate(actions):
        y = min(image_height - band_height, top_margin + int(index * band_height * 1.35) % usable_height)
        regions.append({
            "x": 0,
            "y": max(0, y),
            "width": image_width,
            "height": band_height,
            "source": "estimated_ocr_band",
            "action_index": index,
            "label": str(action.get("label") or action.get("category") or "sensitive_text"),
        })
    return regions


def create_visual_redaction_bundle(
    case_id: str,
    visual_evidence_id: str,
    filename: str,
    image_data_url: Any,
    expected_sha256: str,
    redaction_actions: list[dict[str, Any]],
    payload: dict[str, Any],
) -> dict[str, Any]:
    content, detected_content_type, decode_errors = decode_image_data_url(image_data_url)
    if decode_errors or content is None:
        return {"status": "failed", "errors": decode_errors, "warnings": [], "redaction_regions": []}

    uploaded_sha256 = hashlib.sha256(content).hexdigest()
    errors: list[str] = []
    warnings: list[str] = []
    if expected_sha256 and uploaded_sha256 != expected_sha256:
        errors.append("source_sha256_mismatch")
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return {
            "status": "failed",
            "errors": [*errors, "pillow_not_available"],
            "warnings": warnings,
            "source_upload_sha256": uploaded_sha256,
            "redaction_regions": [],
        }
    try:
        image = Image.open(io.BytesIO(content)).convert("RGBA")
    except Exception:
        return {
            "status": "failed",
            "errors": [*errors, "image_decode_failed"],
            "warnings": warnings,
            "source_upload_sha256": uploaded_sha256,
            "redaction_regions": [],
        }

    bundle_dir = case_dir(case_id) / "visual-bundles" / safe_name(visual_evidence_id)
    bundle_dir.mkdir(parents=True, exist_ok=True)
    original_path = bundle_dir / "original.png"
    redacted_path = bundle_dir / "redacted.png"
    manifest_path = bundle_dir / "screenshot_manifest.json"
    sha256sums_path = bundle_dir / "sha256sums.txt"

    image.save(original_path, format="PNG")
    redacted = image.copy()
    draw = ImageDraw.Draw(redacted)
    regions = _visual_redaction_regions(redacted.width, redacted.height, redaction_actions, payload)
    for region in regions:
        x = int(region["x"])
        y = int(region["y"])
        width = int(region["width"])
        height = int(region["height"])
        draw.rectangle([x, y, x + width, y + height], fill=(0, 0, 0, 255))
    redacted.save(redacted_path, format="PNG")

    original_sha256 = sha256_file(original_path)
    redacted_sha256 = sha256_file(redacted_path)
    if redaction_actions and original_sha256 == redacted_sha256:
        warnings.append("redacted_image_hash_matches_original")
    manifest = {
        "kind": "redteam_ax_v2_visual_redaction_bundle",
        "case_id": case_id,
        "visual_evidence_id": visual_evidence_id,
        "filename": filename,
        "source_content_type": detected_content_type,
        "source_upload_sha256": uploaded_sha256,
        "source_sha256_verified": not errors,
        "original_artifact_path": original_path.as_posix(),
        "redacted_artifact_path": redacted_path.as_posix(),
        "original_sha256": original_sha256,
        "redacted_sha256": redacted_sha256,
        "redaction_regions": regions,
        "redaction_actions": redaction_actions,
        "created_at": now_utc(),
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    sha256sums_path.write_text(
        f"{original_sha256}  original.png\n{redacted_sha256}  redacted.png\n{sha256_file(manifest_path)}  screenshot_manifest.json\n",
        encoding="utf-8",
    )
    return {
        "status": "redacted" if redaction_actions else "copied",
        "errors": errors,
        "warnings": warnings,
        "bundle_dir": bundle_dir.as_posix(),
        "manifest_path": manifest_path.as_posix(),
        "sha256sums_path": sha256sums_path.as_posix(),
        "source_upload_sha256": uploaded_sha256,
        "source_content_type": detected_content_type,
        "source_sha256_verified": not errors,
        "original_artifact_path": original_path.as_posix(),
        "redacted_artifact_path": redacted_path.as_posix(),
        "original_sha256": original_sha256,
        "redacted_sha256": redacted_sha256,
        "redaction_regions": regions,
    }


def preview_visual_evidence_redaction(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    visual_evidence_id = str(payload.get("visual_evidence_id") or stable_id("VEV", [case_id, payload.get("sha256"), now_utc()]))
    filename = str(payload.get("filename") or "visual-evidence.png")
    content_type = str(payload.get("content_type") or "image/png")
    sha256 = str(payload.get("sha256") or "").strip().lower()
    ocr_text = str(payload.get("ocr_text") or payload.get("manual_ocr_text") or "")
    claim = str(payload.get("claim") or "")
    classification = str(payload.get("classification") or payload.get("data_classification") or "restricted").lower()
    errors: list[str] = []
    warnings: list[str] = []

    if not sha256:
        errors.append("source_sha256_required")
    elif not re.fullmatch(r"[a-f0-9]{64}", sha256):
        errors.append("source_sha256_invalid")
    if not filename:
        errors.append("filename_required")
    if not ocr_text.strip():
        warnings.append("ocr_text_missing_manual_review_required")

    detector = detect_visual_ocr_sensitive_text(ocr_text)
    redaction_actions = detector["redaction_actions"]
    visual_bundle: dict[str, Any] = {"status": "not_requested", "errors": [], "warnings": [], "redaction_regions": []}
    if payload.get("image_data_url"):
        visual_bundle = create_visual_redaction_bundle(case_id, visual_evidence_id, filename, payload.get("image_data_url"), sha256, redaction_actions, payload)
        errors.extend(visual_bundle.get("errors") or [])
        warnings.extend(visual_bundle.get("warnings") or [])
    else:
        warnings.append("pixel_redaction_skipped_image_data_url_missing")
    if claim.strip():
        warnings.append("screenshot_only_claims_blocked_link_log_ticket_or_tool_evidence")
    if classification in {"restricted", "confidential", "privacy", "secret"}:
        warnings.append("restricted_visual_evidence_requires_human_approval")
    if detector["prompt_injection_score"] >= 0.85:
        warnings.append("visual_ocr_prompt_injection_quarantine")

    if errors:
        status = "invalid"
    elif detector["prompt_injection_score"] >= 0.85:
        status = "needs_review"
    elif redaction_actions:
        status = "redact"
    else:
        status = "allow"

    preview_id = str(payload.get("preview_id") or stable_id("VRED", [case_id, visual_evidence_id, sha256, detector, now_utc()]))
    visual_descriptor = {
        "visual_evidence_id": visual_evidence_id,
        "type": payload.get("type") or "screenshot",
        "source_artifact_sha256": sha256,
        "source_upload_sha256": visual_bundle.get("source_upload_sha256") or "",
        "original_artifact_path": visual_bundle.get("original_artifact_path") or payload.get("original_artifact_path") or "",
        "redacted_artifact_path": visual_bundle.get("redacted_artifact_path") or payload.get("redacted_artifact_path") or "",
        "original_sha256": visual_bundle.get("original_sha256") or "",
        "redacted_sha256": visual_bundle.get("redacted_sha256") or "",
        "masking_status": "redacted" if visual_bundle.get("redacted_artifact_path") and redaction_actions else ("pending" if redaction_actions else "none"),
        "redaction_actions": redaction_actions,
        "redaction_regions": visual_bundle.get("redaction_regions") or [],
        "trusted_as_instruction": False,
        "trusted_as_data": True,
        "requires_human_review": bool(redaction_actions or errors or classification in {"restricted", "confidential", "privacy", "secret"}),
        "limitations": [
            "OCR text and visual redaction preview do not prove compromise.",
            "Screenshot-only conclusions are blocked until linked to log, ticket, tool-output, or other non-visual evidence.",
            "Pixel-level redaction uses explicit regions when supplied; otherwise it creates estimated OCR masking bands that require human review.",
        ],
    }
    preview = {
        "kind": "redteam_ax_v2_visual_redaction_preview",
        "preview_id": preview_id,
        "case_id": case_id,
        "visual_evidence_id": visual_evidence_id,
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "source": {
            "filename": filename,
            "content_type": content_type,
            "sha256": sha256,
            "image_data_url_present": bool(payload.get("image_data_url")),
            "ocr_source": payload.get("ocr_source") or "manual_ocr_text",
            "classification": classification,
        },
        "ocr": {
            "text_supplied": bool(ocr_text.strip()),
            "confidence": float(payload.get("ocr_confidence") or 0.0),
            "sanitized_text": detector["sanitized_text"],
            "sensitive_label_count": detector["sensitive_label_count"],
            "sensitive_labels": detector["sensitive_labels"],
            "prompt_injection_score": detector["prompt_injection_score"],
            "secret_detection_score": detector["secret_detection_score"],
        },
        "redaction_actions": redaction_actions,
        "visual_bundle": visual_bundle,
        "visual_descriptor": visual_descriptor,
        "policy": {
            "raw_visual_trust": "data_only_never_instruction",
            "screenshot_only_claims_blocked": True,
            "restricted_visual_requires_approval": True,
            "pixel_level_redaction_artifact_required_before_report_export": True,
        },
        "created_at": now_utc(),
    }
    append_artifact_metadata(preview, "visual-redaction-previews", preview_id)
    return preview


def _severity(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"critical", "high", "medium", "low", "info", "informational"}:
        return "info" if raw == "informational" else raw
    if raw in {"5"}:
        return "critical"
    if raw in {"4"}:
        return "high"
    if raw in {"3"}:
        return "medium"
    if raw in {"2"}:
        return "low"
    return raw or "unknown"


def _confidence_for_severity(severity: str) -> float:
    return {
        "critical": 0.78,
        "high": 0.76,
        "medium": 0.72,
        "low": 0.66,
        "info": 0.58,
    }.get(_severity(severity), 0.55)


def _jsonl_items(raw: Any) -> list[dict[str, Any]]:
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, dict):
        return [raw]
    if not isinstance(raw, str):
        return []
    items: list[dict[str, Any]] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        parsed = _coerce_json(line)
        if isinstance(parsed, dict):
            items.append(parsed)
    parsed_all = _coerce_json(raw)
    if not items and isinstance(parsed_all, list):
        items.extend(item for item in parsed_all if isinstance(item, dict))
    elif not items and isinstance(parsed_all, dict):
        items.append(parsed_all)
    return items


def _normalize_nuclei_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        for finding in _jsonl_items(raw):
            info = finding.get("info") if isinstance(finding.get("info"), dict) else {}
            template_id = finding.get("template-id") or finding.get("template_id") or finding.get("template")
            if not template_id and not info:
                continue
            severity = _severity(info.get("severity") or finding.get("severity"))
            items.append({
                "item_type": "scanner_finding_candidate",
                "tool": "nuclei",
                "template_id": template_id,
                "name": info.get("name") or finding.get("name") or finding.get("matcher-name"),
                "severity": severity,
                "target": finding.get("matched-at") or finding.get("host") or finding.get("ip") or finding.get("url"),
                "evidence_ref": finding.get("curl-command") or finding.get("matcher-name") or finding.get("type"),
                "tags": info.get("tags") or [],
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "confidence": _confidence_for_severity(severity),
            })
    return items


def _normalize_trivy_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        parsed = _coerce_json(raw)
        if not isinstance(parsed, dict):
            continue
        for result in parsed.get("Results") or parsed.get("results") or []:
            target = result.get("Target") or result.get("target")
            result_class = result.get("Class") or result.get("class") or result.get("Type") or result.get("type")
            for vuln in result.get("Vulnerabilities") or result.get("vulnerabilities") or []:
                severity = _severity(vuln.get("Severity") or vuln.get("severity"))
                items.append({
                    "item_type": "sca_vulnerability_candidate",
                    "tool": "trivy",
                    "target": target,
                    "class": result_class,
                    "package_name": vuln.get("PkgName") or vuln.get("pkgName") or vuln.get("packageName"),
                    "installed_version": vuln.get("InstalledVersion") or vuln.get("installedVersion"),
                    "fixed_version": vuln.get("FixedVersion") or vuln.get("fixedVersion"),
                    "vulnerability_id": vuln.get("VulnerabilityID") or vuln.get("vulnerabilityID") or vuln.get("id"),
                    "severity": severity,
                    "title": vuln.get("Title") or vuln.get("title"),
                    "primary_url": vuln.get("PrimaryURL") or vuln.get("primaryURL"),
                    "trusted_as_instruction": False,
                    "requires_human_validation": True,
                    "confidence": _confidence_for_severity(severity),
                })
    return items


def _normalize_npm_audit_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        parsed = _coerce_json(raw)
        if not isinstance(parsed, dict):
            continue
        vulnerabilities = parsed.get("vulnerabilities")
        if isinstance(vulnerabilities, dict):
            iterable = vulnerabilities.items()
        else:
            iterable = []
        for package_name, vuln in iterable:
            if not isinstance(vuln, dict):
                continue
            severity = _severity(vuln.get("severity"))
            via = vuln.get("via") or []
            advisory_ids = [
                str(item.get("source") or item.get("url") or item.get("name"))
                for item in via
                if isinstance(item, dict)
            ]
            items.append({
                "item_type": "sca_vulnerability_candidate",
                "tool": "npm audit",
                "package_name": vuln.get("name") or package_name,
                "severity": severity,
                "range": vuln.get("range"),
                "fix_available": vuln.get("fixAvailable"),
                "advisory_refs": advisory_ids,
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "confidence": _confidence_for_severity(severity),
            })
        advisories = parsed.get("advisories")
        if isinstance(advisories, dict):
            for advisory_id, advisory in advisories.items():
                if not isinstance(advisory, dict):
                    continue
                severity = _severity(advisory.get("severity"))
                items.append({
                    "item_type": "sca_vulnerability_candidate",
                    "tool": "npm audit",
                    "package_name": advisory.get("module_name"),
                    "severity": severity,
                    "advisory_id": advisory_id,
                    "title": advisory.get("title"),
                    "url": advisory.get("url"),
                    "trusted_as_instruction": False,
                    "requires_human_validation": True,
                    "confidence": _confidence_for_severity(severity),
                })
    return items


def _normalize_zap_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        parsed = _coerce_json(raw)
        if not isinstance(parsed, dict):
            continue
        sites = parsed.get("site") or parsed.get("sites") or []
        if isinstance(sites, dict):
            sites = [sites]
        for site in sites:
            for alert in site.get("alerts") or []:
                severity = _severity(alert.get("riskcode") or alert.get("riskdesc") or alert.get("risk"))
                instances = alert.get("instances") or []
                first_instance = instances[0] if instances and isinstance(instances[0], dict) else {}
                items.append({
                    "item_type": "scanner_finding_candidate",
                    "tool": "owasp-zap",
                    "alert_id": alert.get("pluginid") or alert.get("id"),
                    "name": alert.get("name") or alert.get("alert"),
                    "severity": severity,
                    "confidence_label": alert.get("confidence") or alert.get("confidencedesc"),
                    "target": first_instance.get("uri") or site.get("@name") or site.get("name"),
                    "cwe_id": alert.get("cweid"),
                    "wasc_id": alert.get("wascid"),
                    "trusted_as_instruction": False,
                    "requires_human_validation": True,
                    "confidence": _confidence_for_severity(severity),
                })
    return items


def _normalize_openvas_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        if not isinstance(raw, str):
            continue
        try:
            root = ET.fromstring(raw)
        except ET.ParseError:
            continue
        for result in root.findall(".//result"):
            nvt = result.find("nvt")
            name = result.findtext("name") or (nvt.findtext("name") if nvt is not None else None)
            severity = _severity(result.findtext("threat") or result.findtext("severity"))
            items.append({
                "item_type": "scanner_finding_candidate",
                "tool": "openvas",
                "result_id": result.findtext("id"),
                "name": name,
                "severity": severity,
                "cvss": result.findtext("severity"),
                "host": result.findtext("host"),
                "port": result.findtext("port"),
                "description": (result.findtext("description") or "")[:500],
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "confidence": _confidence_for_severity(severity),
            })
    return items


def _component_license_names(value: Any) -> list[str]:
    names: list[str] = []
    if not isinstance(value, list):
        return names
    for item in value:
        if isinstance(item, str) and item.strip():
            names.append(item.strip())
        elif isinstance(item, dict):
            license_obj = item.get("license") if isinstance(item.get("license"), dict) else item
            name = license_obj.get("id") or license_obj.get("name") or license_obj.get("expression")
            if name:
                names.append(str(name))
    return names


def _component_supplier_name(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, dict):
        name = value.get("name") or value.get("url")
        return str(name) if name else None
    return None


def _sca_affected_component_refs(value: Any) -> list[str]:
    refs: list[str] = []
    if not isinstance(value, list):
        return refs
    for item in value:
        if isinstance(item, str) and item.strip():
            refs.append(item.strip())
        elif isinstance(item, dict):
            ref = item.get("ref") or item.get("bom-ref") or item.get("bom_ref") or item.get("purl")
            if ref:
                refs.append(str(ref))
    return refs


def _normalize_sca_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        parsed = _coerce_json(raw)
        if not isinstance(parsed, dict):
            continue
        component_lookup: dict[str, dict[str, Any]] = {}
        components = parsed.get("components") or parsed.get("packages") or []
        if isinstance(components, dict):
            components = components.values()
        for component in components:
            if not isinstance(component, dict):
                continue
            component_ref = str(component.get("bom-ref") or component.get("ref") or component.get("purl") or component.get("name") or "").strip()
            package_name = component.get("name") or component.get("package_name") or component.get("purl")
            component_record = {
                "item_type": "sca_component_inventory_evidence",
                "tool": "sca",
                "component_ref": component_ref or None,
                "package_name": package_name,
                "version": component.get("version"),
                "package_url": component.get("purl"),
                "licenses": _component_license_names(component.get("licenses")),
                "supplier": _component_supplier_name(component.get("supplier")),
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "claim_scope": "component_presence_only_until_vulnerability_evidence_approved",
                "confidence": 0.65,
            }
            if component_ref:
                component_lookup[component_ref] = component_record
            if package_name or component_ref:
                items.append(component_record)
        vulnerabilities = parsed.get("vulnerabilities") or parsed.get("findings") or []
        if isinstance(vulnerabilities, dict):
            vulnerabilities = vulnerabilities.values()
        for finding in vulnerabilities:
            if not isinstance(finding, dict):
                continue
            rating_severity = None
            if isinstance(finding.get("ratings"), list) and finding.get("ratings"):
                first_rating = finding["ratings"][0]
                if isinstance(first_rating, dict):
                    rating_severity = first_rating.get("severity")
            severity = _severity(finding.get("severity") or rating_severity)
            package = finding.get("package") if isinstance(finding.get("package"), dict) else {}
            affects = _sca_affected_component_refs(finding.get("affects"))
            affected_components = [
                {
                    "component_ref": ref,
                    "package_name": component_lookup.get(ref, {}).get("package_name"),
                    "version": component_lookup.get(ref, {}).get("version"),
                    "package_url": component_lookup.get(ref, {}).get("package_url"),
                }
                for ref in affects
            ]
            primary_ref = affects[0] if affects else None
            matched_component = component_lookup.get(primary_ref or "", {})
            items.append({
                "item_type": "sca_vulnerability_candidate",
                "tool": "sca",
                "package_name": finding.get("package_name") or package.get("name") or finding.get("component") or matched_component.get("package_name") or finding.get("name"),
                "vulnerability_id": finding.get("id") or finding.get("vulnerability_id") or finding.get("cve"),
                "severity": severity,
                "source": finding.get("source") or finding.get("bom-ref"),
                "affected_component_refs": affects,
                "affected_components": affected_components,
                "package_url": package.get("purl") or matched_component.get("package_url"),
                "version": package.get("version") or matched_component.get("version"),
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "requires_component_match_review": bool(affects),
                "confidence": _confidence_for_severity(severity),
            })
    return items


def _normalize_container_launch_output(raw_values: list[Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in raw_values:
        parsed = _coerce_json(raw)
        if not isinstance(parsed, dict) or parsed.get("kind") != "redteam_ax_v2_container_launch_plan":
            continue
        launch = parsed.get("container_launch") if isinstance(parsed.get("container_launch"), dict) else {}
        container_argv = launch.get("container_argv") if isinstance(launch.get("container_argv"), list) else []
        items.append({
            "item_type": "container_launch_evidence",
            "tool": "ephemeral_container_runner",
            "run_id": parsed.get("run_id"),
            "execution_plan_id": parsed.get("execution_plan_id"),
            "image_digest": launch.get("image_digest"),
            "runtime_name": launch.get("runtime_name"),
            "network_policy": "deny" if "--network" in container_argv and "none" in container_argv else "review_required",
            "read_only_rootfs": "--read-only" in container_argv,
            "capabilities_dropped": "--cap-drop" in container_argv and "ALL" in container_argv,
            "no_new_privileges": "no-new-privileges" in container_argv,
            "mounts": launch.get("mounts") or [],
            "resource_limits": launch.get("resource_limits") or {},
            "dry_run": bool(parsed.get("dry_run")),
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "confidence": 0.7,
        })
    return items


def tool_specific_structured_items(tool_id: str, payload: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    raw_values = _raw_output_values(payload)
    if not raw_values:
        return [], {"parser": "none", "raw_output_count": 0, "parsed_item_count": 0}
    profile = analysis_tool_profile(tool_id)
    name = str((profile or {}).get("name") or tool_id).lower()
    parser = "generic"
    container_items = _normalize_container_launch_output(raw_values)
    if name == "nuclei":
        parser = "nuclei_jsonl"
        items = _normalize_nuclei_output(raw_values)
    elif name == "trivy":
        parser = "trivy_json"
        items = _normalize_trivy_output(raw_values)
    elif name == "npm audit":
        parser = "npm_audit_json"
        items = _normalize_npm_audit_output(raw_values)
    elif name == "owasp-zap":
        parser = "zap_json"
        items = _normalize_zap_output(raw_values)
    elif name == "openvas":
        parser = "openvas_xml"
        items = _normalize_openvas_output(raw_values)
    elif name == "sca":
        parser = "sca_json"
        items = _normalize_sca_output(raw_values)
    else:
        items = []
    if container_items:
        items = [*container_items, *items]
        parser = f"container_launch_plan+{parser}" if parser != "generic" else "container_launch_plan"
    return items, {
        "parser": parser,
        "raw_output_count": len(raw_values),
        "parsed_item_count": len(items),
        "container_launch_item_count": len(container_items),
        "trusted_as_instruction": False,
    }


def enforce_structured_item_trust_contract(items: Any) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    if not isinstance(items, list):
        return normalized
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized.append({
            **item,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
        })
    return normalized


def artifact_raw_output_values(tool_run: dict[str, Any] | None) -> tuple[list[str], dict[str, Any]]:
    raw_values: list[str] = []
    errors: list[str] = []
    checked_artifacts = 0
    skipped_artifacts = 0
    for artifact in (tool_run or {}).get("raw_artifacts") or []:
        if not isinstance(artifact, dict):
            skipped_artifacts += 1
            continue
        storage_path = artifact.get("storage_path") or artifact.get("stored_path") or artifact.get("source_path_or_ref")
        if not storage_path:
            skipped_artifacts += 1
            continue
        if str(storage_path).startswith(("artifact://", "tool-run://", "http://", "https://")):
            skipped_artifacts += 1
            continue
        path = Path(str(storage_path)).resolve()
        checked_artifacts += 1
        if not path.exists() or not path.is_file():
            errors.append(f"stored_artifact_missing:{artifact.get('artifact_id') or path.name}")
            continue
        expected_hash = str(artifact.get("sha256") or artifact.get("hash") or "").strip().lower()
        actual_hash = sha256_file(path)
        if expected_hash and expected_hash != actual_hash:
            errors.append(f"stored_artifact_hash_mismatch:{artifact.get('artifact_id') or path.name}")
            continue
        content_type = str(artifact.get("content_type") or "")
        if not text_like_artifact(path, content_type):
            skipped_artifacts += 1
            continue
        if path.stat().st_size > MAX_TOOL_ARTIFACT_BYTES:
            errors.append(f"stored_artifact_exceeds_max_bytes:{artifact.get('artifact_id') or path.name}")
            continue
        raw_values.append(path.read_text(encoding="utf-8", errors="replace"))
    return raw_values, {
        "artifact_input_count": len(raw_values),
        "artifact_checked_count": checked_artifacts,
        "artifact_skipped_count": skipped_artifacts,
        "artifact_errors": errors,
    }


def agent_analyze_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")
    elif tool_run.get("status") not in {"OutputImported", "RunnerExecuted", "ContainerLaunchPrepared", "Normalized", "EvidenceCreated"}:
        errors.append("tool_run_output_must_be_imported")

    tool_id = str((tool_run or {}).get("tool_id") or payload.get("tool_id") or "")
    profile = analysis_tool_profile(tool_id)
    agent = ANALYSIS_AGENT_REGISTRY.get(str((profile or {}).get("agent_id") or ""))
    if profile is None:
        errors.append("tool_profile_not_registered")
    if agent is None:
        errors.append("analysis_agent_not_registered")

    raw_artifacts = (tool_run or {}).get("raw_artifacts") or []
    artifact_raw_values, artifact_report = artifact_raw_output_values(tool_run)
    analysis_payload = payload
    if not _raw_output_values(payload) and artifact_raw_values:
        analysis_payload = {**payload, "raw_outputs": artifact_raw_values}
    raw_values_for_analysis = _raw_output_values(analysis_payload)
    sanitizer_report = sanitize_tool_output_values(raw_values_for_analysis, "agent-analyze") if raw_values_for_analysis else {
        "trusted_as_instruction": False,
        "trusted_as_data": True,
        "decision": "allow",
        "prompt_injection_score": 0.0,
        "secret_detection_score": 0.0,
        "redactions": [],
        "indicators": [],
        "sanitized_outputs": [],
        "sanitized_summary": "No raw tool output supplied for sanitizer preview.",
        "warnings": [],
    }
    if raw_values_for_analysis:
        analysis_payload = {**analysis_payload, "raw_outputs": sanitizer_report["sanitized_outputs"]}
    parsed_items, parser_report = tool_specific_structured_items(tool_id, analysis_payload)
    parser_report = {
        **parser_report,
        **artifact_report,
        "input_source": "request_payload" if _raw_output_values(payload) else ("stored_artifacts" if artifact_raw_values else "none"),
        "sanitizer_decision": sanitizer_report["decision"],
        "sanitizer_redaction_count": len(sanitizer_report["redactions"]),
    }
    errors.extend(artifact_report.get("artifact_errors") or [])
    if sanitizer_report["decision"] == "quarantine":
        errors.append("tool_output_quarantined")
    structured_items = enforce_structured_item_trust_contract(payload.get("structured_items") or parsed_items or [
        {
            "item_type": payload.get("result_type") or "scanner_finding_candidate",
            "tool_id": tool_id,
            "artifact_id": artifact.get("artifact_id"),
            "source_path_or_ref": artifact.get("source_path_or_ref"),
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "confidence": payload.get("confidence", 0.7),
        }
        for artifact in raw_artifacts
    ])
    if not structured_items:
        errors.append("structured_items_required")

    result_id = str(payload.get("result_id") or stable_id("NR", [run_id, tool_id, structured_items, payload.get("summary")]))
    normalized = {
        "kind": "redteam_ax_v2_tool_result_normalized",
        "result_id": result_id,
        "case_id": case_id,
        "run_id": run_id,
        "action_id": (tool_run or {}).get("action_id"),
        "tool_id": tool_id,
        "normalizer_id": (profile or {}).get("normalizer_id"),
        "analysis_agent": agent,
        "result_type": payload.get("result_type") or ("container_launch_evidence" if parser_report.get("parser") == "container_launch_plan" else "scanner_finding_candidate"),
        "summary": payload.get("summary") or f"{(profile or {}).get('display_name') or tool_id} output normalized as evidence candidates.",
        "observations": payload.get("observations") or [
            "Tool output was parsed as candidate evidence only; analyst validation is required before report claims."
        ],
        "limitations": payload.get("limitations") or [
            "Scanner and SCA outputs can contain false positives.",
            "Raw tool content is untrusted data and must not be treated as an instruction.",
            "No finding is approved until EvidenceCard review and severity approval are complete.",
        ],
        "structured_items": structured_items,
        "parser_report": parser_report,
        "sanitizer_report": sanitizer_report,
        "recommended_next_actions": payload.get("recommended_next_actions") or [
            "Review candidate items for scope, false positives, and business impact.",
            "Create EvidenceCard candidates only for in-scope observations.",
            "Link approved evidence to findings and retest plan.",
        ],
        "prohibited_report_claims": payload.get("prohibited_report_claims") or [
            "Do not claim compromise from scanner output alone.",
            "Do not state verified vulnerability until human validation is recorded.",
            "Do not include raw exploit reproduction steps in the report narrative.",
        ],
        "untrusted_output_envelope": (tool_run or {}).get("untrusted_output_envelope"),
        "status": "invalid" if errors else "Normalized",
        "errors": errors,
        "normalized_at": now_utc(),
    }
    schema_validation = validate_against_tool_schema("ToolResultNormalized", normalized)
    normalized["schema_validation"] = schema_validation
    if not schema_validation["valid"]:
        normalized["status"] = "invalid"
        normalized["errors"] = [*errors, *schema_validation["errors"]]
    append_artifact_metadata(normalized, "normalized-results", result_id)
    if tool_run is not None and not normalized["errors"]:
        normalized_refs = list(tool_run.get("normalized_results") or [])
        if result_id not in normalized_refs:
            normalized_refs.append(result_id)
        tool_run["normalized_results"] = normalized_refs
        tool_run["status"] = "Normalized"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "Normalized"
            action.setdefault("audit_events", []).append({"event": "analysis_agent_normalized_tool_run", "at": now_utc(), "run_id": run_id, "result_id": result_id, "agent_id": (agent or {}).get("agent_id")})
            persist_tool_action(action, {"event": "analysis_agent_normalized_tool_run", "run_id": run_id, "result_id": result_id, "agent_id": (agent or {}).get("agent_id")})
    return normalized


def request_tool_action_approval(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    action = load_tool_action(action_id, case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_approval_request",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }

    requested_by = str(payload.get("requested_by") or "").strip()
    justification = str(payload.get("justification") or "").strip()
    errors: list[str] = []
    if not requested_by:
        errors.append("requested_by_required")
    if not justification:
        errors.append("justification_required")

    risk_class = normalize_risk_class(action.get("risk_class"))
    policy = approval_policy_for(action)
    request_id = stable_id("APR", [action_id, requested_by, justification, now_utc()])
    approval_request = {
        "kind": "redteam_ax_v2_approval_request",
        "request_id": request_id,
        "case_id": action.get("case_id") or "CASE-UNSPECIFIED",
        "action_id": action_id,
        "status": "invalid" if errors else "ApprovalRequested",
        "errors": errors,
        "requested_by": requested_by,
        "requested_at": now_utc(),
        "justification": justification,
        "required_approvers": policy["required_approver_roles"],
        "required_approver_roles": policy["required_approver_roles"],
        "approval_mode": policy["approval_mode"],
        "risk_class": risk_class,
    }
    append_artifact_metadata(approval_request, "approvals", request_id)
    if not errors:
        action["status"] = "ApprovalRequested"
        action["approval_request_id"] = request_id
        action.setdefault("audit_events", []).append({"event": "approval_requested", "at": now_utc(), "actor": requested_by})
        persist_tool_action(action, {"event": "approval_requested", "request_id": request_id, "actor": requested_by})
    return {**approval_request, "action": action}


def approve_tool_action(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    action = load_tool_action(action_id, case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_approval_decision",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }

    approver = str(payload.get("approver") or payload.get("approved_by") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role") or payload.get("role"))
    actor_context, binding_errors = approval_actor_binding_errors(payload, approver, approver_role)
    decision = str(payload.get("decision") or "approve").strip().lower()
    conditions = payload.get("conditions") or []
    policy = approval_policy_for(action)
    required_roles = set(policy["required_approver_roles"])
    errors: list[str] = []
    if not approver:
        errors.append("approver_required")
    errors.extend(binding_errors)
    if decision == "approve" and required_roles and not approver_role:
        errors.append("approver_role_required")
    if decision == "approve" and approver_role and approver_role not in required_roles:
        errors.append("approver_role_not_authorized")
    if decision == "approve" and approver_role in approved_roles_for(action):
        errors.append("approver_role_already_satisfied")
    if decision == "approve" and policy["requires_distinct_approvers"] and approver.lower() in approved_actors_for(action):
        errors.append("two_person_approval_requires_distinct_approvers")
    if decision not in {"approve", "reject"}:
        errors.append("decision_must_be_approve_or_reject")

    decision_id = stable_id("APD", [action_id, approver, approver_role, decision, conditions, now_utc()])
    projected_action = {
        **action,
        "approval_decisions": [
            *(action.get("approval_decisions") or []),
            {
                "decision_id": decision_id,
                "approver": approver,
                "approver_role": approver_role,
                "decision": decision,
                "conditions": conditions,
                "actor_context": actor_context,
                "decided_at": now_utc(),
            },
        ],
    }
    decision_status = "invalid" if errors else ("Rejected" if decision == "reject" else approval_status_for(projected_action))
    approval_decision = {
        "kind": "redteam_ax_v2_approval_decision",
        "decision_id": decision_id,
        "case_id": action.get("case_id") or "CASE-UNSPECIFIED",
        "action_id": action_id,
        "status": decision_status,
        "errors": errors,
        "approver": approver,
        "approver_role": approver_role,
        "actor_context": actor_context,
        "identity_binding": "bound" if not binding_errors else "invalid",
        "decision": decision,
        "conditions": conditions,
        "required_approver_roles": policy["required_approver_roles"],
        "approval_mode": policy["approval_mode"],
        "decided_at": now_utc(),
    }
    append_artifact_metadata(approval_decision, "approvals", decision_id)
    if not errors:
        action["status"] = decision_status
        action["approval_decision_id"] = decision_id
        action["approval_conditions"] = conditions
        action["approval_policy"] = policy
        action["required_approver_roles"] = policy["required_approver_roles"]
        action["approval_decisions"] = projected_action["approval_decisions"]
        if decision == "approve" and decision_status == "Approved" and "Run in Lab" not in action.get("allowed_buttons", []):
            action.setdefault("allowed_buttons", []).append("Run in Lab")
        action.setdefault("audit_events", []).append({"event": "approval_decided", "at": now_utc(), "actor": approver, "approver_role": approver_role, "decision": decision, "status": decision_status})
        persist_tool_action(action, {"event": "approval_decided", "decision_id": decision_id, "actor": approver, "approver_role": approver_role, "decision": decision, "status": decision_status})
    return {**approval_decision, "action": action}


def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    executed_by = str(payload.get("executed_by") or "").strip()
    uploaded_artifacts = payload.get("uploaded_artifacts") or []
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    action = load_tool_action(action_id, case_id)
    errors: list[str] = []
    if not executed_by:
        errors.append("executed_by_required")
    if not isinstance(uploaded_artifacts, list) or not uploaded_artifacts:
        errors.append("uploaded_artifacts_required")
    if action is None:
        errors.append("tool_action_card_required_before_manual_run")
    if action and normalize_risk_class(action.get("risk_class")) in HIGH_RISK_CLASSES and str(action.get("status") or "") != "Approved":
        errors.append("approval_required_before_manual_run")

    run_id = stable_id("TMR", [action_id, executed_by, payload.get("started_at"), payload.get("ended_at"), uploaded_artifacts])
    evidence_candidates = [
        {
            "evidence_id": stable_id("EV", [run_id, artifact]),
            "source_type": "manual_run_artifact",
            "source_path_or_ref": artifact,
            "validation_status": "candidate",
            "summary": payload.get("notes") or "Manual run artifact imported for analyst review",
        }
        for artifact in uploaded_artifacts
    ]
    result = {
        "kind": "redteam_ax_v2_manual_run_record",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "status": "invalid" if errors else "ManuallyExecuted",
        "errors": errors,
        "executed_by": executed_by,
        "started_at": payload.get("started_at"),
        "ended_at": payload.get("ended_at"),
        "notes": payload.get("notes") or "",
        "uploaded_artifacts": uploaded_artifacts,
        "normalized_result": {
            "status": "pending_review" if not errors else "blocked",
            "evidence_candidate_count": len(evidence_candidates),
        },
        "evidence_candidates": evidence_candidates,
        "audit_events": [{"event": "manual_run_recorded", "at": now_utc(), "actor": executed_by or "unknown"}],
    }
    return append_artifact_metadata(result, "manual-runs", run_id)


def import_tool_run_file(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")
    elif tool_run.get("status") not in {"OutputImported", "RunnerExecuted", "ContainerLaunchPrepared", "Normalized", "EvidenceCreated"}:
        errors.append("tool_run_output_must_be_imported")

    source_value = payload.get("source_path") or payload.get("source_path_or_ref") or payload.get("path")
    source_path, source_errors = resolve_workspace_source_path(source_value)
    errors.extend(source_errors)
    expected_hash = str(payload.get("sha256") or payload.get("hash") or "").strip().lower()
    if not expected_hash:
        errors.append("artifact_sha256_required")

    actual_hash = ""
    if source_path is not None and source_path.exists() and source_path.is_file() and not source_errors:
        actual_hash = sha256_file(source_path)
        if expected_hash and expected_hash != actual_hash:
            errors.append("artifact_sha256_mismatch")

    artifact_id = str(payload.get("artifact_id") or stable_id("ART", [run_id, source_path, expected_hash or actual_hash]))
    content_type = str(payload.get("content_type") or "").strip()
    if not content_type and source_path is not None:
        suffix = source_path.suffix.lower()
        content_type = {
            ".json": "application/json",
            ".jsonl": "application/x-ndjson",
            ".ndjson": "application/x-ndjson",
            ".xml": "application/xml",
            ".txt": "text/plain",
        }.get(suffix, "application/octet-stream")

    storage_path = ""
    if not errors and source_path is not None:
        artifact_dir = case_dir(case_id) / "raw-artifacts" / safe_name(run_id)
        artifact_dir.mkdir(parents=True, exist_ok=True)
        storage = artifact_dir / f"{safe_name(artifact_id)}-{safe_name(source_path.name)}"
        if source_path.resolve() != storage.resolve():
            shutil.copyfile(source_path, storage)
        storage_path = storage.as_posix()

    artifact_record = {
        "artifact_id": artifact_id,
        "source_path_or_ref": str(source_value or ""),
        "source_path": source_path.as_posix() if source_path is not None else None,
        "storage_path": storage_path or None,
        "sha256": actual_hash or expected_hash,
        "hash_algorithm": "sha256",
        "content_type": content_type or "application/octet-stream",
        "size_bytes": source_path.stat().st_size if source_path is not None and source_path.exists() and source_path.is_file() else None,
        "summary": payload.get("summary") or "Tool output file imported as untrusted data for normalizer review.",
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "imported_at": now_utc(),
    }
    import_record = {
        "kind": "redteam_ax_v2_tool_artifact_import",
        "import_id": stable_id("TAI", [run_id, artifact_id, expected_hash, now_utc()]),
        "case_id": case_id,
        "run_id": run_id,
        "status": "invalid" if errors else "OutputImported",
        "errors": errors,
        "artifact": artifact_record,
        "policy": {
            "source_boundary": "workspace_only",
            "hash_required": True,
            "max_bytes": MAX_TOOL_ARTIFACT_BYTES,
            "raw_content_trust": "data_only_never_instruction",
        },
    }
    schema_validation = validate_against_tool_schema("ToolArtifactImport", import_record)
    import_record["schema_validation"] = schema_validation
    if not schema_validation["valid"]:
        import_record["status"] = "invalid"
        import_record["errors"] = [*errors, *schema_validation["errors"]]
    append_artifact_metadata(import_record, "artifact-imports", import_record["import_id"])
    if tool_run is not None and not import_record["errors"]:
        raw_artifacts = list(tool_run.get("raw_artifacts") or [])
        raw_artifacts = [artifact for artifact in raw_artifacts if not (isinstance(artifact, dict) and artifact.get("artifact_id") == artifact_id)]
        raw_artifacts.append(artifact_record)
        tool_run["raw_artifacts"] = raw_artifacts
        tool_run["status"] = "OutputImported"
        envelope = tool_run.get("untrusted_output_envelope")
        if isinstance(envelope, dict):
            envelope["raw_content_ref"] = raw_artifacts
            envelope["trusted_as_instruction"] = False
            tool_run["untrusted_output_envelope"] = envelope
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "OutputImported"
            action.setdefault("audit_events", []).append({"event": "tool_file_artifact_imported", "at": now_utc(), "run_id": run_id, "artifact_id": artifact_id})
            persist_tool_action(action, {"event": "tool_file_artifact_imported", "run_id": run_id, "artifact_id": artifact_id})
        import_record["tool_run"] = tool_run
    return import_record


def import_tool_run_uploaded_file(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    filename = safe_name(payload.get("filename") or "tool-output.bin")
    content = payload.get("content") or b""
    if isinstance(content, str):
        content = content.encode("utf-8")
    errors: list[str] = []
    if not isinstance(content, (bytes, bytearray)):
        content = b""
        errors.append("uploaded_file_content_invalid")
    if not content:
        errors.append("uploaded_file_required")
    if len(content) > MAX_TOOL_ARTIFACT_BYTES:
        errors.append("source_file_exceeds_max_bytes")

    upload_dir = case_dir(case_id) / "upload-inbox" / safe_name(run_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    source_path = upload_dir / filename
    if not errors:
        source_path.write_bytes(bytes(content))

    result = import_tool_run_file(
        run_id,
        {
            "case_id": case_id,
            "source_path": source_path.as_posix(),
            "sha256": payload.get("sha256"),
            "content_type": payload.get("content_type") or "application/octet-stream",
            "summary": payload.get("summary") or "Tool output file uploaded as untrusted data for normalizer review.",
            "artifact_id": payload.get("artifact_id"),
        },
    )
    if errors:
        result["status"] = "invalid"
        result["errors"] = [*errors, *(result.get("errors") or [])]
        result["schema_validation"] = validate_against_tool_schema("ToolArtifactImport", result)
        append_artifact_metadata(result, "artifact-imports", result["import_id"])
    result["upload"] = {
        "filename": filename,
        "content_type": payload.get("content_type") or "application/octet-stream",
        "size_bytes": len(content),
        "source_path": source_path.as_posix(),
        "transport": "multipart/form-data",
    }
    return result


def preview_tool_output_sanitizer(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")

    raw_values = _raw_output_values(payload)
    input_source = "request_payload"
    artifact_report: dict[str, Any] = {}
    if not raw_values and tool_run is not None:
        raw_values, artifact_report = artifact_raw_output_values(tool_run)
        input_source = "stored_artifacts" if raw_values else "none"
        errors.extend(artifact_report.get("artifact_errors") or [])
    if not raw_values:
        errors.append("raw_output_required")

    sanitizer = sanitize_tool_output_values(raw_values, input_source) if raw_values else sanitize_tool_output_values([], input_source)
    preview_id = str(payload.get("preview_id") or stable_id("SAN", [run_id, sanitizer, now_utc()]))
    preview = {
        "kind": "redteam_ax_v2_tool_output_sanitizer_preview",
        "preview_id": preview_id,
        "case_id": case_id,
        "run_id": run_id,
        "action_id": (tool_run or {}).get("action_id"),
        "tool_id": (tool_run or {}).get("tool_id") or payload.get("tool_id"),
        "input_source": input_source,
        "artifact_report": artifact_report,
        "status": "invalid" if errors else sanitizer["decision"],
        "errors": errors,
        "trusted_as_instruction": False,
        "trusted_as_data": True,
        "requires_human_review": sanitizer["decision"] in {"quarantine", "redact", "needs_review"} or bool(errors),
        "sanitizer": sanitizer,
        "sanitized_output_preview": "\n".join(sanitizer["sanitized_outputs"])[:2000],
        "policy": {
            "prompt_injection_threshold_quarantine": 0.85,
            "secret_redaction_required": True,
            "raw_output_trust": "data_only_never_instruction",
        },
        "created_at": now_utc(),
    }
    append_artifact_metadata(preview, "tool-sanitizer-previews", preview_id)
    if tool_run is not None and not errors:
        previews = list(tool_run.get("sanitizer_previews") or [])
        if preview_id not in previews:
            previews.append(preview_id)
        tool_run["sanitizer_previews"] = previews
        if sanitizer["decision"] == "quarantine":
            tool_run["status"] = "Quarantined"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
    return preview


def import_tool_run_output(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    manual_run = load_json_record(run_id, "manual-runs", case_id)
    errors: list[str] = []
    if manual_run is None:
        errors.append("manual_run_record_required")
    elif manual_run.get("status") != "ManuallyExecuted":
        errors.append("manual_run_must_be_manually_executed")

    raw_artifacts = payload.get("raw_artifacts") or payload.get("uploaded_artifacts") or []
    if not isinstance(raw_artifacts, list) or not raw_artifacts:
        errors.append("raw_artifacts_required")

    imported_artifacts = [
        {
            "artifact_id": stable_id("ART", [run_id, artifact]),
            "source_path_or_ref": artifact if isinstance(artifact, str) else artifact.get("source_path_or_ref") or artifact.get("path") or artifact,
            "hash": stable_id("SHA256", [run_id, artifact]),
            "content_type": "application/octet-stream" if isinstance(artifact, str) else artifact.get("content_type", "application/octet-stream"),
            "summary": "" if isinstance(artifact, str) else artifact.get("summary", ""),
            "imported_at": now_utc(),
        }
        for artifact in raw_artifacts
    ]
    action_id = str(payload.get("action_id") or (manual_run or {}).get("action_id") or "")
    tool_run = {
        "kind": "redteam_ax_v2_tool_run_record",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "tool_id": payload.get("tool_id") or "TOOL-MANUAL-RECORDER",
        "execution_mode": payload.get("execution_mode") or "manual_operator_run",
        "environment": payload.get("environment") or "approved_scope",
        "executed_by": (manual_run or {}).get("executed_by") or payload.get("executed_by"),
        "status": "invalid" if errors else "OutputImported",
        "errors": errors,
        "raw_artifacts": imported_artifacts,
        "normalized_results": [],
        "evidence_candidates": [],
        "notes": payload.get("notes") or (manual_run or {}).get("notes") or "",
    }
    append_artifact_metadata(tool_run, "tool-runs", run_id)
    if action_id and not errors:
        action = load_tool_action(action_id, case_id)
        if action is not None:
            action["status"] = "OutputImported"
            action.setdefault("audit_events", []).append({"event": "output_imported", "at": now_utc(), "run_id": run_id})
            persist_tool_action(action, {"event": "output_imported", "run_id": run_id})
    return tool_run


def normalize_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")
    elif tool_run.get("status") not in {"OutputImported", "RunnerExecuted", "ContainerLaunchPrepared", "Normalized", "EvidenceCreated"}:
        errors.append("tool_run_output_must_be_imported")

    raw_artifacts = (tool_run or {}).get("raw_artifacts") or []
    structured_items = payload.get("structured_items")
    if structured_items is None:
        structured_items = [
            {
                "item_type": payload.get("result_type") or "artifact_observation",
                "artifact_id": artifact.get("artifact_id"),
                "source_path_or_ref": artifact.get("source_path_or_ref"),
                "trusted_as_instruction": False,
                "requires_human_validation": True,
                "confidence": payload.get("confidence", 0.75),
            }
            for artifact in raw_artifacts
        ]
    structured_items = enforce_structured_item_trust_contract(structured_items)
    if not structured_items:
        errors.append("structured_items_required")

    result_id = str(payload.get("result_id") or stable_id("NR", [run_id, structured_items, payload.get("summary")]))
    normalized = {
        "kind": "redteam_ax_v2_tool_result_normalized",
        "result_id": result_id,
        "case_id": case_id,
        "run_id": run_id,
        "action_id": (tool_run or {}).get("action_id"),
        "result_type": payload.get("result_type") or "artifact_observation",
        "summary": payload.get("summary") or f"{len(structured_items)} tool output item(s) normalized for analyst review.",
        "observations": payload.get("observations") or [],
        "limitations": payload.get("limitations") or ["Tool output is evidence candidate material and does not prove compromise without analyst review."],
        "structured_items": structured_items,
        "recommended_next_actions": payload.get("recommended_next_actions") or ["Review normalized output and create EvidenceCard candidates."],
        "prohibited_report_claims": payload.get("prohibited_report_claims") or [
            "Do not claim compromise from tool output alone.",
            "Do not promote candidates to findings without approved EvidenceCard links.",
        ],
        "status": "invalid" if errors else "Normalized",
        "errors": errors,
        "normalized_at": now_utc(),
    }
    schema_validation = validate_against_tool_schema("ToolResultNormalized", normalized)
    normalized["schema_validation"] = schema_validation
    if not schema_validation["valid"]:
        normalized["status"] = "invalid"
        normalized["errors"] = [*errors, *schema_validation["errors"]]
    append_artifact_metadata(normalized, "normalized-results", result_id)
    if tool_run is not None and not normalized["errors"]:
        normalized_refs = list(tool_run.get("normalized_results") or [])
        if result_id not in normalized_refs:
            normalized_refs.append(result_id)
        tool_run["normalized_results"] = normalized_refs
        tool_run["status"] = "Normalized"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "Normalized"
            action.setdefault("audit_events", []).append({"event": "tool_run_normalized", "at": now_utc(), "run_id": run_id, "result_id": result_id})
            persist_tool_action(action, {"event": "tool_run_normalized", "run_id": run_id, "result_id": result_id})
    return normalized


def create_evidence_from_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")

    result_id = str(payload.get("result_id") or "")
    if not result_id and tool_run is not None:
        normalized_refs = tool_run.get("normalized_results") or []
        result_id = str(normalized_refs[-1]) if normalized_refs else ""
    normalized = load_json_record(result_id, "normalized-results", case_id) if result_id else None
    if normalized is None:
        errors.append("normalized_result_required")

    source_path = (normalized or {}).get("artifact_path") or f"tool-run://{run_id}/{result_id or 'missing-normalized-result'}"
    evidence = create_evidence_card({
        "case_id": case_id,
        "source_type": payload.get("source_type") or "tool_normalized_result",
        "source_path_or_url": source_path,
        "summary": payload.get("summary") or (normalized or {}).get("summary") or "Normalized tool result requires analyst review.",
        "normalized_fields": {
            "run_id": run_id,
            "result_id": result_id,
            "result_type": (normalized or {}).get("result_type"),
            "structured_items": (normalized or {}).get("structured_items") or [],
            "prohibited_report_claims": (normalized or {}).get("prohibited_report_claims") or [],
        },
        "validation_status": payload.get("validation_status") or "candidate",
    })
    evidence["kind"] = "redteam_ax_v2_evidence_candidate"
    evidence["errors"] = [*(evidence.get("errors") or []), *errors]
    evidence["validation_status"] = "candidate" if evidence["errors"] else evidence.get("validation_status", "candidate")
    append_artifact_metadata(evidence, "evidence", evidence["evidence_id"])

    if tool_run is not None and not errors:
        evidence_refs = list(tool_run.get("evidence_candidates") or [])
        if evidence["evidence_id"] not in evidence_refs:
            evidence_refs.append(evidence["evidence_id"])
        tool_run["evidence_candidates"] = evidence_refs
        tool_run["status"] = "EvidenceCreated"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "EvidenceCreated"
            action.setdefault("audit_events", []).append({"event": "evidence_candidate_created", "at": now_utc(), "run_id": run_id, "evidence_id": evidence["evidence_id"]})
            persist_tool_action(action, {"event": "evidence_candidate_created", "run_id": run_id, "evidence_id": evidence["evidence_id"]})
    return evidence


def create_evidence_card(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip()
    source = str(payload.get("source_path_or_url") or payload.get("source_path_or_ref") or "").strip()
    summary = str(payload.get("summary") or "").strip()
    errors: list[str] = []
    if not case_id:
        errors.append("case_id_required")
    if not source:
        errors.append("source_path_or_url_required")
    if not summary:
        errors.append("summary_required")
    evidence_id = str(payload.get("evidence_id") or stable_id("EV", [case_id, source, summary]))
    result = {
        "kind": "redteam_ax_v2_evidence_card",
        "evidence_id": evidence_id,
        "case_id": case_id,
        "source_type": payload.get("source_type") or "artifact",
        "source_path_or_url": source,
        "collected_at": payload.get("collected_at") or now_utc(),
        "hash": payload.get("hash") or stable_id("SHA256", [source, summary]),
        "summary": summary,
        "normalized_fields": payload.get("normalized_fields") or {},
        "classification": payload.get("classification") or "internal",
        "approval_status": payload.get("approval_status") or ("draft" if errors else "pending_review"),
        "review_required": payload.get("review_required", True),
        "validation_status": "candidate" if errors else payload.get("validation_status", "candidate"),
        "errors": errors,
    }
    return append_artifact_metadata(result, "evidence", evidence_id)


def approve_evidence_card(evidence_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    evidence = load_json_record(evidence_id, "evidence", case_id)
    errors: list[str] = []
    actor_context = actor_context_from_payload(payload)
    reviewer = str(payload.get("reviewed_by") or payload.get("approver") or payload.get("approved_by") or "").strip()
    reviewer_role = normalize_approver_role(payload.get("reviewer_role") or payload.get("approver_role") or "red_team_lead")
    decision = str(payload.get("decision") or "approve").strip().lower()

    if evidence is None:
        errors.append("evidence_not_found")
    if not reviewer:
        errors.append("reviewed_by_required")
    if not actor_context["actor_id"]:
        errors.append("actor_context_required")
    if not actor_context["actor_role"]:
        errors.append("actor_role_required")
    if actor_context.get("errors"):
        errors.extend(actor_context["errors"])
    if actor_context["actor_id"] and not actor_context.get("authenticated"):
        errors.append("actor_context_not_authenticated")
    if reviewer and actor_context["actor_id"] and reviewer.lower() != actor_context["actor_id"]:
        errors.append("reviewer_must_match_authenticated_actor")
    if reviewer_role and actor_context["actor_role"] and reviewer_role != actor_context["actor_role"]:
        errors.append("reviewer_role_must_match_authenticated_actor_role")
    if reviewer_role not in {"red_team_lead", "control_team", "legal_privacy", "data_owner"}:
        errors.append("reviewer_role_not_authorized")
    if decision not in {"approve", "reject"}:
        errors.append("decision_must_be_approve_or_reject")

    resolved_case_id = str((evidence or {}).get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    approval_id = stable_id("EVA", [resolved_case_id, evidence_id, reviewer, reviewer_role, decision, now_utc()])
    status = "invalid" if errors else ("approved" if decision == "approve" else "rejected")
    result = {
        "kind": "redteam_ax_v2_evidence_approval",
        "approval_id": approval_id,
        "evidence_id": evidence_id,
        "case_id": resolved_case_id,
        "status": status,
        "decision": decision,
        "reviewed_by": reviewer,
        "reviewer_role": reviewer_role,
        "actor_context": actor_context,
        "identity_binding": "bound" if not errors else "invalid",
        "reviewed_at": now_utc() if not errors else None,
        "errors": errors,
    }
    append_artifact_metadata(result, "evidence-approvals", approval_id)
    if evidence is not None and not errors:
        evidence["approval_status"] = status
        evidence["validation_status"] = "approved" if status == "approved" else "rejected"
        evidence["review_required"] = False
        evidence["reviewed_by"] = reviewer
        evidence["reviewer_role"] = reviewer_role
        evidence["reviewed_at"] = result["reviewed_at"]
        evidence["approval_id"] = approval_id
        append_artifact_metadata(evidence, "evidence", evidence_id)
    return {**result, "evidence": evidence}


def evidence_approval_issues(case_id: str, evidence_ids: list[str]) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    for evidence_id in sorted({str(item).strip() for item in evidence_ids if str(item).strip()}):
        evidence = load_json_record(evidence_id, "evidence", case_id)
        if evidence is None:
            issues.append({"type": "missing_evidence", "id": evidence_id})
            continue
        approval_status = str(evidence.get("approval_status") or "").lower()
        validation_status = str(evidence.get("validation_status") or "").lower()
        if approval_status != "approved":
            issues.append({"type": "unapproved_evidence", "id": evidence_id, "approval_status": approval_status or "unknown"})
        if validation_status not in {"approved", "verified"}:
            issues.append({"type": "unverified_evidence", "id": evidence_id, "validation_status": validation_status or "unknown"})
    return issues


def _approved_case_evidence(case_id: str) -> list[dict[str, Any]]:
    approved: list[dict[str, Any]] = []
    for evidence in list_json_artifacts(case_id, "evidence"):
        approval_status = str(evidence.get("approval_status") or "").lower()
        validation_status = str(evidence.get("validation_status") or "").lower()
        if approval_status == "approved" and validation_status in {"approved", "verified"}:
            approved.append(evidence)
    return approved


def _evidence_search_text(evidence: dict[str, Any]) -> str:
    values = [
        evidence.get("summary"),
        evidence.get("source_path_or_url"),
        evidence.get("source_type"),
        json.dumps(evidence.get("normalized_fields") or {}, ensure_ascii=False, sort_keys=True),
    ]
    return " ".join(str(value or "") for value in values).lower()


def _tokenize_query_text(value: Any) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9가-힣_.:/-]{3,}", str(value or "").lower())
        if token not in {"the", "and", "with", "for", "from", "that", "this"}
    }


def _select_agentic_rag_corpora(query: str, payload: dict[str, Any]) -> list[str]:
    selected = ["redteam_ax_v2_evidence_store", "agentic_rag_spec", "redteam_ax_spec"]
    query_l = query.lower()
    requested = [str(item).strip() for item in (payload.get("target_corpora") or []) if str(item).strip()]
    for corpus in requested:
        if corpus not in selected:
            selected.append(corpus)
    if any(term in query_l for term in ["sca", "sbom", "trivy", "npm", "dependency", "의존성"]):
        selected.append("toolchain_sca_policy")
    if any(term in query_l for term in ["report", "보고서", "claim", "evidence", "citation", "matrix"]):
        selected.append("claim_evidence_matrix_policy")
    return list(dict.fromkeys(selected))


def _agentic_rag_citations(case_id: str, query: str, payload: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    approved_evidence = _approved_case_evidence(case_id)
    requested_ids = {
        str(evidence_id).strip()
        for claim in (payload.get("claims") or [])
        for evidence_id in (claim.get("evidence_ids") or [])
        if str(evidence_id).strip()
    }
    query_tokens = _tokenize_query_text(query)
    required_tokens = _tokenize_query_text(" ".join(str(item) for item in (payload.get("required_facts") or [])))
    search_tokens = query_tokens | required_tokens

    hits: list[dict[str, Any]] = []
    for evidence in approved_evidence:
        evidence_id = str(evidence.get("evidence_id") or "").strip()
        text = _evidence_search_text(evidence)
        if requested_ids and evidence_id in requested_ids:
            hits.append(evidence)
            continue
        if not requested_ids and (not search_tokens or any(token in text for token in search_tokens)):
            hits.append(evidence)
    if not hits and not requested_ids and approved_evidence:
        hits = approved_evidence[:3]

    citations = [
        {
            "citation_id": f"EVIDENCE:{evidence.get('evidence_id')}",
            "evidence_id": evidence.get("evidence_id"),
            "case_id": case_id,
            "source_path_or_url": evidence.get("source_path_or_url"),
            "summary": evidence.get("summary"),
            "classification": evidence.get("classification"),
            "approval_status": evidence.get("approval_status"),
            "validation_status": evidence.get("validation_status"),
            "trusted_as_instruction": False,
            "requires_human_validation": True,
        }
        for evidence in hits
    ]
    return citations, approved_evidence


def _verify_agentic_rag_claims(case_id: str, payload: dict[str, Any], citations: list[dict[str, Any]]) -> dict[str, Any]:
    citation_ids = {str(item.get("evidence_id")) for item in citations if item.get("evidence_id")}
    claims = payload.get("claims") or []
    if not claims and citations:
        claims = [
            {
                "claim_id": "C-RAG-DRAFT-1",
                "text": "승인된 EvidenceCard를 근거로 보고서 초안에 사용할 수 있는 제한적 분석 후보가 있습니다.",
                "evidence_ids": [citations[0]["evidence_id"]],
            }
        ]

    claim_results: list[dict[str, Any]] = []
    unsupported_claims: list[dict[str, Any]] = []
    for index, claim in enumerate(claims, start=1):
        evidence_ids = [str(item).strip() for item in (claim.get("evidence_ids") or []) if str(item).strip()]
        issues = evidence_approval_issues(case_id, evidence_ids)
        missing_from_retrieval = [evidence_id for evidence_id in evidence_ids if evidence_id not in citation_ids]
        if missing_from_retrieval:
            issues.extend({"type": "not_in_retrieved_context", "id": evidence_id} for evidence_id in missing_from_retrieval)
        if not evidence_ids:
            issues.append({"type": "evidence_ids_required", "id": claim.get("claim_id") or f"C-RAG-{index}"})

        claim_id = str(claim.get("claim_id") or claim.get("id") or f"C-RAG-{index}")
        text = str(claim.get("text") or claim.get("claim") or claim.get("summary") or "").strip()
        result = {
            "claim_id": claim_id,
            "text": text,
            "evidence_ids": evidence_ids,
            "support_level": "supported" if not issues else "unsupported",
            "issues": issues,
        }
        claim_results.append(result)
        if issues:
            unsupported_claims.append(result)

    return {
        "claim_results": claim_results,
        "unsupported_claims": unsupported_claims,
        "unsupported_claim_count": len(unsupported_claims),
        "all_material_claims_supported": bool(claim_results) and not unsupported_claims,
    }


def agentic_rag_sca_query(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    query = str(payload.get("query") or payload.get("question") or "").strip()
    selected_corpora = _select_agentic_rag_corpora(query, payload)
    citations, approved_evidence = _agentic_rag_citations(case_id, query, payload)
    verification = _verify_agentic_rag_claims(case_id, payload, citations)

    combined_context = " ".join(_evidence_search_text(evidence) for evidence in approved_evidence)
    required_facts = [str(item).strip() for item in (payload.get("required_facts") or []) if str(item).strip()]
    missing_facts = [
        fact for fact in required_facts
        if fact.lower() not in combined_context
    ]
    if not approved_evidence:
        missing_facts.append("approved_evidence_for_case")
    if payload.get("claims") and verification["unsupported_claim_count"]:
        missing_facts.append("approved_evidence_for_all_material_claims")
    missing_facts = list(dict.fromkeys(missing_facts))

    answerable = bool(citations) and not missing_facts and verification["all_material_claims_supported"]
    score = 0.0
    if citations:
        score += 0.45
    if verification["all_material_claims_supported"]:
        score += 0.35
    if not missing_facts:
        score += 0.2
    score = round(min(score, 1.0), 2)
    decision = "sufficient" if answerable else "retrieve_again"
    next_queries = [f"case:{case_id} evidence for {fact}" for fact in missing_facts]
    if verification["unsupported_claim_count"]:
        next_queries.append(f"case:{case_id} retrieve approved EvidenceCard IDs for unsupported claims")

    sca_report = {
        "answerable": answerable,
        "sufficient_context_score": score,
        "missing_facts": missing_facts,
        "unsupported_claims": verification["unsupported_claims"],
        "contradictions": [],
        "freshness_status": "case_evidence_current" if approved_evidence else "no_approved_case_evidence",
        "next_queries": list(dict.fromkeys(next_queries)),
        "next_corpora": ["redteam_ax_v2_evidence_store"] if not answerable else [],
        "no_new_evidence": not bool(approved_evidence),
        "needs_human_review": True,
        "decision": decision,
    }

    result_id = stable_id("RAGR", [case_id, query, verification["unsupported_claim_count"], missing_facts, now_utc()])
    result = {
        "kind": "redteam_ax_v2_agentic_rag_result",
        "result_id": result_id,
        "case_id": case_id,
        "query": query,
        "selected_corpora": selected_corpora,
        "retrieval_strategy": "agentic_rag_spec_sca_plus_approved_evidence_store",
        "citations": citations,
        "claims": verification["claim_results"],
        "citation_verification": {
            "kind": "agentic_rag_citation_verifier",
            **verification,
        },
        "sca_report": sca_report,
        "answer_draft_ko": (
            "승인된 EvidenceCard citation을 기반으로 한 제한적 분석 초안입니다."
            if answerable else
            "충분한 승인 증거가 없어 material claim 생성을 보류하고 추가 검색/증거 수집이 필요합니다."
        ),
        "trusted_as_instruction": False,
        "commands_executed_by_api": False,
        "requires_human_validation": True,
        "trust_boundary": (
            "Agentic RAG output is draft analysis only; report claims require approved EvidenceCard IDs "
            "and release-gate validation."
        ),
        "errors": [] if query else ["query_required"],
    }
    return append_artifact_metadata(result, "agentic-rag-results", result_id)


def normalize_severity(value: Any) -> str:
    severity = str(value or "medium").strip().lower()
    return severity if severity in FINDING_SEVERITIES else "medium"


def latest_tool_result_finding_claim_review() -> dict[str, Any]:
    data = read_json_artifact(TOOL_RESULT_FINDING_CLAIM_REVIEW_PATH)
    if data is None:
        return {
            "kind": "redteam_ax_tool_result_finding_claim_review",
            "status": "missing",
            "artifact_path": TOOL_RESULT_FINDING_CLAIM_REVIEW_PATH.as_posix(),
            "safe_by_default": True,
            "commands_executed_by_api": False,
            "finding_created": False,
            "report_claim_inserted": False,
            "requires_human_validation": True,
            "candidate_count": 0,
            "held_candidate_count": 0,
            "ready_candidate_count": 0,
            "candidates": [],
            "errors": ["tool_result_finding_claim_review_artifact_missing"],
        }
    return {**data, "artifact_path": TOOL_RESULT_FINDING_CLAIM_REVIEW_PATH.as_posix()}


def tool_result_finding_candidate(candidate_id: str, package: dict[str, Any] | None = None) -> dict[str, Any] | None:
    review = package or latest_tool_result_finding_claim_review()
    for candidate in review.get("candidates") or []:
        if str(candidate.get("candidate_id") or "").strip() == candidate_id:
            return candidate
    return None


def promote_tool_result_candidate_to_finding(candidate_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    review = latest_tool_result_finding_claim_review()
    candidate = tool_result_finding_candidate(candidate_id, review)
    case_id_override = str(payload.get("case_id") or "").strip()
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "").strip()
    errors: list[str] = []
    warnings: list[str] = []
    if candidate is None:
        errors.append("tool_result_finding_candidate_not_found")
    if not requested_by:
        errors.append("requested_by_required")

    candidate_status = str((candidate or {}).get("status") or "missing")
    evidence_review = (candidate or {}).get("evidence_review") if isinstance((candidate or {}).get("evidence_review"), dict) else {}
    finding_payload = dict((candidate or {}).get("finding_payload") or {})
    if case_id_override:
        finding_payload["case_id"] = case_id_override

    evidence_ids = [str(item).strip() for item in (finding_payload.get("evidence_ids") or []) if str(item).strip()]
    evidence_issues = evidence_approval_issues(str(finding_payload.get("case_id") or "CASE-UNSPECIFIED"), evidence_ids)
    evidence_store_approved = bool(evidence_ids) and not evidence_issues
    candidate_ready = candidate_status == "ready_for_finding_review" or evidence_store_approved
    if candidate is not None and candidate_status != "ready_for_finding_review":
        warnings.append(f"candidate_status_from_package:{candidate_status}")
    if candidate is not None and not evidence_review.get("approved") and evidence_store_approved:
        warnings.append("candidate_package_evidence_review_stale_but_store_approved")
    if candidate is not None and not candidate_ready:
        errors.append(f"candidate_status_not_ready:{candidate_status}")
    if candidate is not None and not evidence_review.get("approved") and not evidence_store_approved:
        errors.append("candidate_evidence_not_approved")
    if evidence_issues:
        errors.extend(f"evidence:{issue['type']}:{issue['id']}" for issue in evidence_issues)
    if payload.get("force") or payload.get("allow_unapproved_draft"):
        warnings.append("force_flags_ignored_until_evidence_approved")

    promotion_id = stable_id("TFPROMO", [candidate_id, requested_by, case_id_override, now_utc()])
    if errors:
        result = {
            "kind": "redteam_ax_v2_tool_result_candidate_promotion",
            "promotion_id": promotion_id,
            "candidate_id": candidate_id,
            "case_id": finding_payload.get("case_id") or case_id_override or "CASE-UNSPECIFIED",
            "status": "blocked",
            "finding_created": False,
            "report_claim_inserted": False,
            "safe_by_default": True,
            "commands_executed_by_api": False,
            "active_scan_executed": False,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "candidate_status": candidate_status,
            "candidate": candidate,
            "evidence_issues": evidence_issues,
            "warnings": warnings,
            "errors": errors,
            "next_human_actions_ko": [
                "Evidence Card를 승인한 뒤 다시 시도합니다.",
                "원본 도구 출력과 정규화 결과를 비교합니다.",
                "Finding 생성 후 severity 2인 승인을 완료해야 보고서에 사용할 수 있습니다.",
            ],
        }
        return append_artifact_metadata(result, "finding-candidate-promotions", promotion_id)

    finding = create_finding(finding_payload)
    if finding.get("errors"):
        errors.extend(str(error) for error in finding.get("errors") or [])
    result = {
        "kind": "redteam_ax_v2_tool_result_candidate_promotion",
        "promotion_id": promotion_id,
        "candidate_id": candidate_id,
        "case_id": finding.get("case_id") or finding_payload.get("case_id") or "CASE-UNSPECIFIED",
        "status": "finding_created" if not errors else "finding_created_pending_review_with_errors",
        "finding_created": True,
        "report_claim_inserted": False,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "candidate_status": candidate_status,
        "candidate": candidate,
        "finding": finding,
        "claim_candidate": candidate.get("claim_candidate") if candidate else None,
        "evidence_issues": evidence_issues,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "생성된 Finding의 severity를 red_team_lead와 business_owner가 각각 승인합니다.",
            "Claim-Evidence Matrix에서 Claim 후보와 승인된 Evidence ID를 다시 검증합니다.",
            "보고서 export 전 report gate가 0건 blocker인지 확인합니다.",
        ],
    }
    return append_artifact_metadata(result, "finding-candidate-promotions", promotion_id)


def build_tool_result_claim_evidence_matrix_draft(payload: dict[str, Any]) -> dict[str, Any]:
    review = latest_tool_result_finding_claim_review()
    requested_case_id = str(payload.get("case_id") or "").strip()
    requested_ids = {
        str(item).strip()
        for item in (payload.get("candidate_ids") or [])
        if str(item).strip()
    }
    candidates = [
        candidate
        for candidate in (review.get("candidates") or [])
        if not requested_ids or str(candidate.get("candidate_id") or "").strip() in requested_ids
    ]
    errors: list[str] = []
    if requested_ids and len(candidates) != len(requested_ids):
        found_ids = {str(candidate.get("candidate_id") or "").strip() for candidate in candidates}
        errors.extend(f"candidate_not_found:{candidate_id}" for candidate_id in sorted(requested_ids - found_ids))

    rows: list[dict[str, Any]] = []
    ready_claims: list[dict[str, Any]] = []
    ready_findings: list[dict[str, Any]] = []
    held_claims: list[dict[str, Any]] = []
    for candidate in candidates:
        candidate_id = str(candidate.get("candidate_id") or "").strip()
        finding_payload = dict(candidate.get("finding_payload") or {})
        claim_candidate = dict(candidate.get("claim_candidate") or {})
        case_id = requested_case_id or str(finding_payload.get("case_id") or "CASE-UNSPECIFIED").strip()
        evidence_ids = [
            str(item).strip()
            for item in (claim_candidate.get("evidence_ids") or finding_payload.get("evidence_ids") or [])
            if str(item).strip()
        ]
        finding_id = str(finding_payload.get("finding_id") or "").strip()
        stored_finding = load_json_record(finding_id, "findings", case_id) if finding_id else None
        severity_final = str((stored_finding or {}).get("severity_final") or finding_payload.get("severity_final") or "").strip().lower()
        finding_for_validation = {
            "finding_id": finding_id,
            "title": finding_payload.get("title"),
            "severity_final": severity_final,
            "evidence_ids": evidence_ids,
        }
        evidence_issues = evidence_approval_issues(case_id, evidence_ids)
        finding_issues = finding_approval_issues(case_id, [finding_for_validation])
        support_level = str(claim_candidate.get("support_level") or "supported").strip().lower()
        claim_issues: list[dict[str, Any]] = []
        if not evidence_ids:
            claim_issues.append({"type": "claim_without_evidence", "id": claim_candidate.get("claim_id") or candidate_id})
        if support_level in {"unsupported", "none"}:
            claim_issues.append({"type": "unsupported_claim", "id": claim_candidate.get("claim_id") or candidate_id})
        row_issues = [*evidence_issues, *finding_issues, *claim_issues]
        ready = not row_issues
        claim_row = {
            "claim_id": claim_candidate.get("claim_id") or stable_id("C", [candidate_id, evidence_ids]),
            "statement_ko": claim_candidate.get("statement_ko") or finding_payload.get("observation") or "",
            "support_level": "supported",
            "evidence_ids": evidence_ids,
            "source": "tool_result_finding_claim_review",
            "candidate_id": candidate_id,
            "finding_id": finding_id,
        }
        finding_row = {
            "finding_id": finding_id,
            "title": finding_payload.get("title") or "Tool result finding",
            "severity_final": severity_final,
            "evidence_ids": evidence_ids,
        }
        row = {
            "candidate_id": candidate_id,
            "case_id": case_id,
            "status": "ready_for_report_validation" if ready else "hold_until_evidence_and_finding_approved",
            "claim": claim_row,
            "finding": finding_row,
            "stored_finding_status": (stored_finding or {}).get("status") or "missing",
            "stored_finding_approval_status": (stored_finding or {}).get("approval_status") or "missing",
            "evidence_issues": evidence_issues,
            "finding_issues": finding_issues,
            "claim_issues": claim_issues,
            "blocking_items": row_issues,
            "report_claim_inserted": False,
            "finding_required": True,
            "requires_human_validation": True,
            "commands_executed_by_api": False,
            "active_scan_executed": False,
            "trusted_as_instruction": False,
        }
        rows.append(row)
        if ready:
            ready_claims.append(claim_row)
            ready_findings.append(finding_row)
        else:
            held_claims.append({
                "candidate_id": candidate_id,
                "claim_id": claim_row["claim_id"],
                "hold_reason": "Evidence Card approval and two-person Finding severity approval are required before report validation.",
                "blocking_items": row_issues,
            })

    resolved_case_id = requested_case_id or str((candidates[0].get("finding_payload") or {}).get("case_id") if candidates else "CASE-UNSPECIFIED")
    report_payload_preview = {
        "case_id": resolved_case_id,
        "title": payload.get("title") or "Red Team Report v2 tool result matrix draft",
        "claims": ready_claims,
        "findings": ready_findings,
        "tool_actions": [],
        "held_claims": held_claims,
    }
    validation_preview = (
        validate_report(report_payload_preview)
        if ready_claims
        else {
            "kind": "redteam_ax_v2_report_validation_preview",
            "case_id": resolved_case_id,
            "gate_status": "not_run_no_ready_rows",
            "blocking_items": [],
        }
    )
    draft_id = stable_id("TCEM", [resolved_case_id, [row["candidate_id"] for row in rows], len(ready_claims), len(held_claims), now_utc()])
    result = {
        "kind": "redteam_ax_v2_tool_result_claim_evidence_matrix_draft",
        "draft_id": draft_id,
        "case_id": resolved_case_id,
        "status": "matrix_draft_ready" if ready_claims else "matrix_draft_held",
        "source_review_artifact_path": review.get("artifact_path"),
        "candidate_count": len(rows),
        "ready_claim_count": len(ready_claims),
        "held_claim_count": len(held_claims),
        "rows": rows,
        "report_validation_payload_preview": report_payload_preview,
        "validation_preview": validation_preview,
        "report_claim_inserted": False,
        "finding_created": False,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "errors": errors,
        "next_human_actions_ko": [
            "held row는 Evidence Card 승인과 Finding severity 2인 승인 후 다시 초안을 생성합니다.",
            "ready row만 보고서 검증 payload preview에 포함합니다.",
            "초안 API는 보고서 Claim을 자동 삽입하지 않습니다.",
        ],
    }
    return append_artifact_metadata(result, "claim-evidence-matrix-drafts", draft_id)


def generate_tool_result_report_draft_from_matrix(payload: dict[str, Any]) -> dict[str, Any]:
    matrix_draft = build_tool_result_claim_evidence_matrix_draft(payload)
    errors = list(matrix_draft.get("errors") or [])
    if int(matrix_draft.get("ready_claim_count") or 0) <= 0:
        errors.append("matrix_draft_has_no_ready_rows")
    if int(matrix_draft.get("held_claim_count") or 0) > 0:
        errors.append("matrix_draft_has_held_rows")
    validation_preview = matrix_draft.get("validation_preview") or {}
    if validation_preview.get("gate_status") not in {"pass"}:
        errors.append(f"report_validation_not_pass:{validation_preview.get('gate_status') or 'unknown'}")

    report_request_id = stable_id("TCRPT", [matrix_draft.get("draft_id"), errors, now_utc()])
    if errors:
        result = {
            "kind": "redteam_ax_v2_tool_result_report_draft_from_matrix",
            "report_request_id": report_request_id,
            "case_id": matrix_draft.get("case_id") or "CASE-UNSPECIFIED",
            "status": "blocked",
            "report_generated": False,
            "report": None,
            "matrix_draft": matrix_draft,
            "validation_preview": validation_preview,
            "safe_by_default": True,
            "commands_executed_by_api": False,
            "active_scan_executed": False,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "errors": errors,
            "next_human_actions_ko": [
                "held row의 Evidence Card 승인과 Finding severity 2인 승인을 완료합니다.",
                "Matrix draft의 모든 row가 ready_for_report_validation인지 확인합니다.",
                "report gate blocker가 0건인 경우에만 Report v2 draft를 생성합니다.",
            ],
        }
        return append_artifact_metadata(result, "tool-result-report-drafts", report_request_id)

    report_payload = dict(matrix_draft.get("report_validation_payload_preview") or {})
    report_payload["title"] = payload.get("title") or report_payload.get("title") or "Red Team Report v2 tool result draft"
    report = generate_report(report_payload)
    result = {
        "kind": "redteam_ax_v2_tool_result_report_draft_from_matrix",
        "report_request_id": report_request_id,
        "case_id": matrix_draft.get("case_id") or report.get("case_id") or "CASE-UNSPECIFIED",
        "status": "report_draft_generated" if report.get("gate_status") == "pass" else "blocked",
        "report_generated": report.get("gate_status") == "pass",
        "report": report,
        "matrix_draft": matrix_draft,
        "validation_preview": validation_preview,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "errors": [] if report.get("gate_status") == "pass" else [f"report_gate:{report.get('gate_status') or 'unknown'}"],
        "next_human_actions_ko": [
            "생성된 Report v2 draft를 사람이 검토합니다.",
            "export 전 최종 승인과 report gate snapshot을 다시 확인합니다.",
            "재시험 계획과 Evidence Card 연결이 누락되지 않았는지 검토합니다.",
        ],
    }
    return append_artifact_metadata(result, "tool-result-report-drafts", report_request_id)


def build_toolchain_collection_claim_evidence_matrix_draft(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    requested_ids = {
        str(item).strip()
        for item in (payload.get("finding_ids") or [])
        if str(item).strip()
    }
    errors: list[str] = []
    if collection is None:
        errors.append("toolchain_result_collection_required")

    collection_finding_ids = {
        str(item).strip()
        for item in (collection or {}).get("approved_finding_ids") or (collection or {}).get("promoted_finding_ids") or []
        if str(item).strip()
    }
    finding_ids = sorted(requested_ids or collection_finding_ids)
    missing_requested = sorted(requested_ids - collection_finding_ids)
    if missing_requested:
        errors.extend(f"finding_not_from_collection:{finding_id}" for finding_id in missing_requested)
    if collection is not None and not finding_ids:
        errors.append("approved_collection_findings_required")

    rows: list[dict[str, Any]] = []
    ready_claims: list[dict[str, Any]] = []
    ready_findings: list[dict[str, Any]] = []
    held_claims: list[dict[str, Any]] = []
    for finding_id in finding_ids:
        finding = load_json_record(finding_id, "findings", case_id)
        evidence_ids = [str(item).strip() for item in (finding or {}).get("evidence_ids") or [] if str(item).strip()]
        severity_final = str((finding or {}).get("severity_final") or "").strip().lower()
        claim_id = stable_id("C-TCF", [collection_id, finding_id, evidence_ids])
        claim_row = {
            "claim_id": claim_id,
            "statement_ko": (finding or {}).get("observation") or (finding or {}).get("title") or "승인된 도구 결과 Finding",
            "support_level": "supported",
            "evidence_ids": evidence_ids,
            "source": "toolchain_collection_matrix_draft",
            "finding_id": finding_id,
        }
        finding_row = {
            "finding_id": finding_id,
            "title": (finding or {}).get("title") or "Toolchain collection finding",
            "severity_final": severity_final,
            "evidence_ids": evidence_ids,
        }
        evidence_issues = evidence_approval_issues(case_id, evidence_ids)
        finding_issues = finding_approval_issues(case_id, [finding_row])
        claim_issues: list[dict[str, Any]] = []
        if finding is None:
            finding_issues.append({"type": "missing_finding", "id": finding_id})
        if not evidence_ids:
            claim_issues.append({"type": "claim_without_evidence", "id": claim_id})
        row_issues = [*evidence_issues, *finding_issues, *claim_issues]
        ready = not row_issues
        row = {
            "collection_id": collection_id,
            "case_id": case_id,
            "finding_id": finding_id,
            "status": "ready_for_report_validation" if ready else "hold_until_evidence_and_finding_approved",
            "claim": claim_row,
            "finding": finding_row,
            "stored_finding_status": (finding or {}).get("status") or "missing",
            "stored_finding_approval_status": (finding or {}).get("approval_status") or "missing",
            "evidence_issues": evidence_issues,
            "finding_issues": finding_issues,
            "claim_issues": claim_issues,
            "blocking_items": row_issues,
            "report_claim_inserted": False,
            "finding_created": False,
            "requires_human_validation": True,
            "commands_executed_by_api": False,
            "active_scan_executed": False,
            "trusted_as_instruction": False,
        }
        rows.append(row)
        if ready:
            ready_claims.append(claim_row)
            ready_findings.append(finding_row)
        else:
            held_claims.append({
                "finding_id": finding_id,
                "claim_id": claim_id,
                "hold_reason": "Approved Evidence and two-person Finding severity approval are required before report validation.",
                "blocking_items": row_issues,
            })

    report_payload_preview = {
        "case_id": case_id,
        "title": payload.get("title") or "Red Team Report v2 collection matrix draft",
        "claims": ready_claims,
        "findings": ready_findings,
        "tool_actions": [],
        "held_claims": held_claims,
    }
    validation_preview = (
        validate_report(report_payload_preview)
        if ready_claims
        else {
            "kind": "redteam_ax_v2_report_validation_preview",
            "case_id": case_id,
            "gate_status": "not_run_no_ready_rows",
            "blocking_items": [],
        }
    )
    draft_id = stable_id("TCCEM", [collection_id, case_id, finding_ids, len(ready_claims), len(held_claims), now_utc()])
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_claim_evidence_matrix_draft",
        "draft_id": draft_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": "matrix_draft_ready" if ready_claims and not held_claims and not errors else "matrix_draft_held",
        "finding_count": len(finding_ids),
        "ready_claim_count": len(ready_claims),
        "held_claim_count": len(held_claims),
        "rows": rows,
        "report_validation_payload_preview": report_payload_preview,
        "validation_preview": validation_preview,
        "report_claim_inserted": False,
        "finding_created": False,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "errors": errors,
        "next_human_actions_ko": [
            "ready row만 Report v2 draft 입력으로 사용합니다.",
            "held row가 있으면 Evidence 승인과 Finding severity 2인 승인을 먼저 완료합니다.",
            "초안 API는 보고서 Claim을 자동 삽입하지 않습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-claim-evidence-matrix-drafts", draft_id)
    if collection is not None and not errors:
        collection["claim_evidence_matrix_draft_id"] = draft_id
        collection["claim_evidence_matrix_status"] = result["status"]
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def generate_toolchain_collection_report_draft_from_matrix(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    matrix_draft = build_toolchain_collection_claim_evidence_matrix_draft(collection_id, payload)
    errors = list(matrix_draft.get("errors") or [])
    if int(matrix_draft.get("ready_claim_count") or 0) <= 0:
        errors.append("matrix_draft_has_no_ready_rows")
    if int(matrix_draft.get("held_claim_count") or 0) > 0:
        errors.append("matrix_draft_has_held_rows")
    validation_preview = matrix_draft.get("validation_preview") or {}
    if validation_preview.get("gate_status") not in {"pass"}:
        errors.append(f"report_validation_not_pass:{validation_preview.get('gate_status') or 'unknown'}")

    report_request_id = stable_id("TCCRPT", [collection_id, matrix_draft.get("draft_id"), errors, now_utc()])
    if errors:
        result = {
            "kind": "redteam_ax_v2_toolchain_collection_report_draft_from_matrix",
            "report_request_id": report_request_id,
            "collection_id": collection_id,
            "case_id": matrix_draft.get("case_id") or "CASE-UNSPECIFIED",
            "status": "blocked",
            "report_generated": False,
            "report": None,
            "matrix_draft": matrix_draft,
            "validation_preview": validation_preview,
            "safe_by_default": True,
            "commands_executed_by_api": False,
            "active_scan_executed": False,
            "trusted_as_instruction": False,
            "requires_human_validation": True,
            "requires_final_export_approval": True,
            "errors": errors,
            "next_human_actions_ko": [
                "Matrix draft의 held row를 0건으로 만듭니다.",
                "report gate blocker가 0건인 경우에만 Report v2 draft를 생성합니다.",
                "최종 export 전 사람 승인을 별도로 수행합니다.",
            ],
        }
        return append_artifact_metadata(result, "toolchain-report-drafts", report_request_id)

    report_payload = dict(matrix_draft.get("report_validation_payload_preview") or {})
    report_payload["title"] = payload.get("title") or report_payload.get("title") or "Red Team Report v2 collection draft"
    report = generate_report(report_payload)
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_report_draft_from_matrix",
        "report_request_id": report_request_id,
        "collection_id": collection_id,
        "case_id": matrix_draft.get("case_id") or report.get("case_id") or "CASE-UNSPECIFIED",
        "status": "report_draft_generated" if report.get("gate_status") == "pass" else "blocked",
        "report_generated": report.get("gate_status") == "pass",
        "report": report,
        "matrix_draft": matrix_draft,
        "validation_preview": validation_preview,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "requires_final_export_approval": True,
        "errors": [] if report.get("gate_status") == "pass" else [f"report_gate:{report.get('gate_status') or 'unknown'}"],
        "next_human_actions_ko": [
            "생성된 Report v2 draft를 사람이 검토합니다.",
            "최종 export 전 별도 approval gate를 통과시킵니다.",
            "재시험 계획과 Evidence Card 연결을 검증합니다.",
        ],
    }
    return append_artifact_metadata(result, "toolchain-report-drafts", report_request_id)


def close_toolchain_collection_e2e(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    reviewer = str(payload.get("reviewed_by") or payload.get("evidence_reviewer") or "").strip()
    lead_approver = str(payload.get("lead_approver") or payload.get("red_team_lead") or "").strip()
    business_owner = str(payload.get("business_owner_approver") or payload.get("business_owner") or "").strip()
    export_approver = str(payload.get("export_approver") or payload.get("executive_sponsor") or "").strip()
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "current-analyst").strip()
    errors: list[str] = []
    warnings: list[str] = []
    if collection is None:
        errors.append("toolchain_result_collection_required")
    if not reviewer:
        errors.append("evidence_reviewer_required")
    if not lead_approver:
        errors.append("lead_approver_required")
    if not business_owner:
        errors.append("business_owner_approver_required")
    if not export_approver:
        errors.append("export_approver_required")
    if lead_approver and business_owner and lead_approver.lower() == business_owner.lower():
        errors.append("distinct_finding_severity_approvers_required")

    candidate_evidence_ids = [
        str(((step or {}).get("evidence_candidate") or {}).get("evidence_id") or "").strip()
        for step in (collection or {}).get("steps") or []
        if str(((step or {}).get("evidence_candidate") or {}).get("evidence_id") or "").strip()
    ]
    if collection is not None and not candidate_evidence_ids:
        errors.append("evidence_candidates_required")

    closure_id = stable_id("TCCE2E", [collection_id, case_id, reviewer, lead_approver, business_owner, export_approver, now_utc()])
    evidence_approval: dict[str, Any] | None = None
    finding_promotion: dict[str, Any] | None = None
    severity_approval: dict[str, Any] | None = None
    matrix_draft: dict[str, Any] | None = None
    report_draft: dict[str, Any] | None = None
    export_approval: dict[str, Any] | None = None
    export_result: dict[str, Any] | None = None
    completion_gate: dict[str, Any] | None = None

    if not errors:
        evidence_approval = approve_toolchain_collection_evidence(collection_id, {
            **payload,
            "case_id": case_id,
            "reviewed_by": reviewer,
            "reviewer_role": normalize_approver_role(payload.get("reviewer_role") or "red_team_lead"),
            "decision": "approve",
            "evidence_ids": payload.get("evidence_ids") or candidate_evidence_ids,
            "_actor_context": {
                **resolve_actor_context(
                    {"case_id": case_id, "reviewer_role": normalize_approver_role(payload.get("reviewer_role") or "red_team_lead")},
                    actor_id=reviewer,
                    actor_role=normalize_approver_role(payload.get("reviewer_role") or "red_team_lead"),
                ),
                "resolved": True,
            },
        })
        if evidence_approval.get("errors") or evidence_approval.get("status") != "evidence_approved":
            errors.extend(f"evidence_approval:{error}" for error in (evidence_approval.get("errors") or [evidence_approval.get("status")]))

    if not errors:
        approved_ids = evidence_approval.get("evidence_ids") or candidate_evidence_ids
        finding_promotion = promote_toolchain_collection_evidence_to_findings(collection_id, {
            **payload,
            "case_id": case_id,
            "requested_by": requested_by,
            "evidence_ids": approved_ids,
        })
        if finding_promotion.get("errors") or finding_promotion.get("status") not in {"finding_drafts_created", "finding_drafts_partially_created"}:
            errors.extend(f"finding_promotion:{error}" for error in (finding_promotion.get("errors") or [finding_promotion.get("status")]))

    finding_ids: list[str] = []
    if not errors:
        finding_ids = [
            str(item.get("finding_id") or "").strip()
            for item in (finding_promotion or {}).get("promotions") or []
            if str(item.get("finding_id") or "").strip()
        ]
        severity_approval = approve_toolchain_collection_finding_severity(collection_id, {
            **payload,
            "case_id": case_id,
            "finding_ids": finding_ids,
            "lead_approver": lead_approver,
            "business_owner_approver": business_owner,
            "severity_final": payload.get("severity_final") or "medium",
        })
        if severity_approval.get("errors") or severity_approval.get("status") != "findings_severity_approved":
            errors.extend(f"finding_severity:{error}" for error in (severity_approval.get("errors") or [severity_approval.get("status")]))

    if not errors:
        approved_finding_ids = [
            str(item.get("finding_id") or "").strip()
            for item in (severity_approval or {}).get("approvals") or []
            if item.get("status") == "approved" and str(item.get("finding_id") or "").strip()
        ]
        matrix_draft = build_toolchain_collection_claim_evidence_matrix_draft(collection_id, {
            **payload,
            "case_id": case_id,
            "finding_ids": approved_finding_ids,
            "title": payload.get("matrix_title") or "복합 도구 결과 Claim-Evidence Matrix 초안",
        })
        if matrix_draft.get("errors") or matrix_draft.get("status") != "matrix_draft_ready":
            errors.extend(f"matrix:{error}" for error in (matrix_draft.get("errors") or [matrix_draft.get("status")]))

    if not errors:
        report_draft = generate_toolchain_collection_report_draft_from_matrix(collection_id, {
            **payload,
            "case_id": case_id,
            "finding_ids": [
                str(row.get("finding_id") or "").strip()
                for row in (matrix_draft or {}).get("rows") or []
                if str(row.get("finding_id") or "").strip()
            ],
            "title": payload.get("report_title") or payload.get("title") or "복합 도구 결과 기반 Korean Red Team Report v2 draft",
        })
        if report_draft.get("errors") or not report_draft.get("report_generated"):
            errors.extend(f"report_draft:{error}" for error in (report_draft.get("errors") or [report_draft.get("status")]))

    report = (report_draft or {}).get("report") or {}
    report_id = str(report.get("report_id") or "").strip()
    if not errors:
        export_approval = approve_report_export(report_id, {
            **payload,
            "case_id": case_id,
            "approved_by": export_approver,
            "approver_role": "executive_sponsor",
            "_actor_context": {
                **resolve_actor_context(
                    {"case_id": case_id, "approver_role": "executive_sponsor"},
                    actor_id=export_approver,
                    actor_role="executive_sponsor",
                ),
                "resolved": True,
            },
        })
        if export_approval.get("errors") or export_approval.get("status") != "ExportApproved":
            errors.extend(f"export_approval:{error}" for error in (export_approval.get("errors") or [export_approval.get("status")]))

    if not errors:
        export_result = export_report(report_id, {
            "case_id": case_id,
            "approval_id": (export_approval or {}).get("approval_id"),
        })
        if export_result.get("errors") or export_result.get("status") != "Exported":
            errors.extend(f"export:{error}" for error in (export_result.get("errors") or [export_result.get("status")]))

    if not errors:
        completion_gate = verify_toolchain_collection_completion_gate(collection_id, {
            "case_id": case_id,
            "report_id": report_id,
            "approval_id": (export_approval or {}).get("approval_id"),
            "export_id": (export_result or {}).get("export_id"),
        })
        if completion_gate.get("errors") or not completion_gate.get("complete"):
            gate_errors = completion_gate.get("errors") or [
                str((item or {}).get("reason") or (item or {}).get("gate") or item)
                for item in (completion_gate.get("blockers") or [])
            ]
            errors.extend(f"completion_gate:{error}" for error in gate_errors)

    completed = not errors and bool((completion_gate or {}).get("complete"))
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_e2e_closure",
        "closure_id": closure_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": "collection_e2e_complete" if completed else "blocked",
        "complete": completed,
        "requested_by": requested_by,
        "reviewed_by": reviewer or None,
        "lead_approver": lead_approver or None,
        "business_owner_approver": business_owner or None,
        "export_approver": export_approver or None,
        "evidence_approval": evidence_approval,
        "finding_promotion": finding_promotion,
        "finding_severity_approval": severity_approval,
        "matrix_draft": matrix_draft,
        "report_draft": report_draft,
        "export_approval": export_approval,
        "export": export_result,
        "completion_gate": completion_gate,
        "report_id": report_id or None,
        "approval_id": (export_approval or {}).get("approval_id"),
        "export_id": (export_result or {}).get("export_id"),
        "candidate_evidence_count": len(set(candidate_evidence_ids)),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "requires_explicit_human_approver_fields": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "complete=true인 경우에도 최종 산출물은 사람이 보고서와 Evidence 연결을 검토합니다.",
            "blocked이면 errors에 표시된 단계부터 다시 수행합니다.",
            "이 API는 scanner 명령이나 능동 스캔을 실행하지 않고 기존 collection 산출물만 닫습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-e2e-closures", closure_id)
    if collection is not None:
        collection["e2e_closure_id"] = closure_id
        collection["e2e_closure_status"] = result["status"]
        collection["completion_gate_id"] = (completion_gate or {}).get("gate_id") or collection.get("completion_gate_id")
        collection["completion_gate_status"] = (completion_gate or {}).get("status") or collection.get("completion_gate_status")
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def close_operating_toolchain_artifact_manifest_e2e(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    requested_by = str(payload.get("requested_by") or payload.get("operator") or "current-analyst").strip()
    toolchain_id = str(payload.get("toolchain_id") or stable_id("TCHAIN", [case_id, requested_by, payload.get("source_dir") or payload.get("artifacts") or [], "operating-close-e2e"]))
    raw_artifacts = payload.get("artifacts") or payload.get("items") or []
    raw_source_dir = str(payload.get("source_dir") or payload.get("directory") or "").strip()
    required_tool_ids = [
        str(item).strip()
        for item in (payload.get("required_tool_ids") or [
            "TOOL-NUCLEI-001",
            "TOOL-OPENVAS-001",
            "TOOL-TRIVY-001",
            "TOOL-SCA-001",
            "TOOL-NPM-AUDIT-001",
            "TOOL-ZAP-001",
        ])
        if str(item).strip()
    ]
    require_all_named_tools = bool(payload.get("require_all_named_tools", True))
    closure_id = stable_id("OPCLOSE", [case_id, toolchain_id, requested_by, raw_source_dir or raw_artifacts, now_utc()])
    errors: list[str] = []
    warnings: list[str] = []
    present_tool_ids: list[str] = []
    missing_required_tool_ids: list[str] = []
    manifest_builder: dict[str, Any] | None = None
    manifest_import: dict[str, Any] | None = None
    collection: dict[str, Any] | None = None
    closure: dict[str, Any] | None = None

    if not requested_by:
        errors.append("requested_by_required")
    if not raw_source_dir and not isinstance(raw_artifacts, list):
        errors.append("source_dir_or_artifacts_required")
    if not raw_source_dir and isinstance(raw_artifacts, list) and len(raw_artifacts) < 2:
        errors.append("at_least_two_artifacts_required_for_operating_close")

    import_payload: dict[str, Any] | None = None
    if not errors and raw_source_dir:
        manifest_builder = build_toolchain_artifact_manifest({
            **payload,
            "case_id": case_id,
            "toolchain_id": toolchain_id,
            "requested_by": requested_by,
            "source_dir": raw_source_dir,
            "tool_ids": required_tool_ids,
        })
        if manifest_builder.get("errors") or manifest_builder.get("status") != "ready_for_import":
            errors.extend(f"manifest_builder:{error}" for error in (manifest_builder.get("errors") or [manifest_builder.get("status")]))
        else:
            import_payload = dict(manifest_builder.get("import_payload") or {})
    elif not errors:
        import_payload = {
            **payload,
            "case_id": case_id,
            "toolchain_id": toolchain_id,
            "requested_by": requested_by,
            "artifacts": raw_artifacts,
        }

    if not errors and import_payload is not None and require_all_named_tools:
        present_tool_ids = sorted({
            str(item.get("tool_id") or "").strip()
            for item in import_payload.get("artifacts") or []
            if isinstance(item, dict) and str(item.get("tool_id") or "").strip()
        })
        missing_required_tool_ids = [tool_id for tool_id in required_tool_ids if tool_id not in present_tool_ids]
        if missing_required_tool_ids:
            errors.append("all_required_tool_artifacts_required")

    if not errors and import_payload is not None:
        manifest_import = import_toolchain_artifact_manifest({
            **import_payload,
            "case_id": case_id,
            "toolchain_id": toolchain_id,
            "requested_by": requested_by,
            "objective": import_payload.get("objective") or payload.get("objective") or "운영자가 제출한 scanner 산출물을 가져와 전체 close-e2e lane을 수행한다.",
        })
        if manifest_import.get("errors") or manifest_import.get("status") != "imported":
            errors.extend(f"manifest_import:{error}" for error in (manifest_import.get("errors") or [manifest_import.get("status")]))

    if not errors:
        collection = collect_toolchain_results(toolchain_id, {
            **payload,
            "case_id": case_id,
            "requested_by": requested_by,
            "summary": payload.get("collection_summary") or "운영 scanner 산출물을 Evidence 후보 collection으로 회수한다.",
        })
        if collection.get("errors") or collection.get("status") != "collected":
            errors.extend(f"collection:{error}" for error in (collection.get("errors") or [collection.get("status")]))

    if not errors and collection is not None:
        closure = close_toolchain_collection_e2e(str(collection.get("collection_id")), {
            **payload,
            "case_id": case_id,
            "requested_by": requested_by,
            "reviewed_by": payload.get("reviewed_by") or payload.get("evidence_reviewer"),
            "lead_approver": payload.get("lead_approver") or payload.get("red_team_lead"),
            "business_owner_approver": payload.get("business_owner_approver") or payload.get("business_owner"),
            "export_approver": payload.get("export_approver") or payload.get("executive_sponsor"),
            "report_title": payload.get("report_title") or "운영 scanner 산출물 기반 Korean Red Team Report v2",
        })
        if closure.get("errors") or not closure.get("complete"):
            errors.extend(f"closure:{error}" for error in (closure.get("errors") or [closure.get("status")]))

    completed = not errors and bool((closure or {}).get("complete"))
    result = {
        "kind": "redteam_ax_v2_operating_toolchain_artifact_manifest_e2e_closure",
        "closure_id": closure_id,
        "case_id": case_id,
        "toolchain_id": toolchain_id,
        "collection_id": (collection or {}).get("collection_id"),
        "status": "operating_collection_e2e_complete" if completed else "blocked",
        "complete": completed,
        "requested_by": requested_by,
        "source_dir": raw_source_dir or None,
        "manifest_builder": manifest_builder,
        "manifest_import": manifest_import,
        "collection": collection,
        "closure": closure,
        "required_tool_ids": required_tool_ids,
        "present_tool_ids": present_tool_ids or (manifest_builder or {}).get("present_tool_ids") or [],
        "missing_required_tool_ids": missing_required_tool_ids,
        "tool_coverage_complete": not missing_required_tool_ids and bool(present_tool_ids or (manifest_builder or {}).get("present_tool_ids")),
        "tool_coverage": (manifest_builder or {}).get("tool_coverage") or [],
        "artifact_count": (manifest_import or {}).get("imported_count") or (manifest_builder or {}).get("artifact_count") or (len(raw_artifacts) if isinstance(raw_artifacts, list) else 0),
        "candidate_evidence_count": (collection or {}).get("evidence_candidate_count") or 0,
        "report_id": (closure or {}).get("report_id"),
        "export_id": (closure or {}).get("export_id"),
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "requires_existing_operator_artifacts": True,
        "requires_explicit_human_approver_fields": True,
        "warnings": warnings,
        "errors": errors,
        "next_human_actions_ko": [
            "source_dir 또는 artifacts manifest는 이미 생성된 운영 scanner 산출물만 가리켜야 합니다.",
            "Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 6개 결과가 모두 있어야 전체 닫기를 진행합니다.",
            "blocked이면 manifest_builder, manifest_import, collection, closure 중 표시된 단계부터 수정합니다.",
            "이 API는 scanner, Docker, WSL, 네트워크 스캔 명령을 실행하지 않습니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-operating-e2e-closures", closure_id)
    return result


def verify_toolchain_collection_completion_gate(collection_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    collection = load_json_record(collection_id, "toolchain-result-collections", case_id)
    report_id = str(payload.get("report_id") or "").strip()
    export_id = str(payload.get("export_id") or "").strip()
    approval_id = str(payload.get("approval_id") or "").strip()
    report = load_json_record(report_id, "reports", case_id=case_id) if report_id else None
    export = load_json_record(export_id, "exports", case_id=case_id) if export_id else None
    approval = load_json_record(approval_id, "report-export-approvals", case_id=case_id) if approval_id else None
    errors: list[str] = []
    blockers: list[dict[str, Any]] = []

    if collection is None:
        errors.append("toolchain_result_collection_required")
    if not report_id:
        errors.append("report_id_required")
    if not export_id:
        errors.append("export_id_required")

    candidate_evidence_ids = [
        str(((step or {}).get("evidence_candidate") or {}).get("evidence_id") or "").strip()
        for step in (collection or {}).get("steps") or []
        if str(((step or {}).get("evidence_candidate") or {}).get("evidence_id") or "").strip()
    ]
    approved_evidence_ids = [str(item).strip() for item in (collection or {}).get("approved_evidence_ids") or [] if str(item).strip()]
    promoted_finding_ids = [str(item).strip() for item in (collection or {}).get("promoted_finding_ids") or [] if str(item).strip()]
    approved_finding_ids = [str(item).strip() for item in (collection or {}).get("approved_finding_ids") or [] if str(item).strip()]
    matrix_status = str((collection or {}).get("claim_evidence_matrix_status") or "").strip()

    if collection is not None:
        if not candidate_evidence_ids:
            blockers.append({"gate": "collection", "reason": "evidence_candidates_required"})
        if len(set(approved_evidence_ids)) != len(set(candidate_evidence_ids)):
            blockers.append({
                "gate": "evidence",
                "reason": "all_collection_evidence_candidates_must_be_approved",
                "candidate_count": len(set(candidate_evidence_ids)),
                "approved_count": len(set(approved_evidence_ids)),
            })
        if len(set(promoted_finding_ids)) != len(set(approved_evidence_ids)):
            blockers.append({
                "gate": "finding_promotion",
                "reason": "all_approved_evidence_must_have_promoted_findings",
                "approved_evidence_count": len(set(approved_evidence_ids)),
                "promoted_finding_count": len(set(promoted_finding_ids)),
            })
        if len(set(approved_finding_ids)) != len(set(promoted_finding_ids)):
            blockers.append({
                "gate": "finding_severity",
                "reason": "all_promoted_findings_must_have_two_person_severity_approval",
                "promoted_finding_count": len(set(promoted_finding_ids)),
                "approved_finding_count": len(set(approved_finding_ids)),
            })
        if matrix_status != "matrix_draft_ready":
            blockers.append({"gate": "matrix", "reason": "claim_evidence_matrix_not_ready", "status": matrix_status or "missing"})

    if report is None:
        blockers.append({"gate": "report", "reason": "report_not_found", "report_id": report_id or None})
    else:
        report_errors = report_export_gate_errors(report)
        if report_errors:
            blockers.append({"gate": "report", "reason": "report_export_gate_errors", "errors": report_errors})

    if approval_id:
        if approval is None:
            blockers.append({"gate": "export_approval", "reason": "report_export_approval_not_found", "approval_id": approval_id})
        elif approval.get("status") != "ExportApproved" or approval.get("report_id") != report_id:
            blockers.append({
                "gate": "export_approval",
                "reason": "report_export_approval_invalid",
                "status": approval.get("status"),
                "approval_report_id": approval.get("report_id"),
            })

    if export is None:
        blockers.append({"gate": "export", "reason": "report_export_artifact_not_found", "export_id": export_id or None})
    else:
        if export.get("status") != "Exported":
            blockers.append({"gate": "export", "reason": "report_not_exported", "status": export.get("status")})
        if export.get("report_id") != report_id:
            blockers.append({"gate": "export", "reason": "report_export_report_mismatch", "export_report_id": export.get("report_id")})
        if approval_id and export.get("approval_id") != approval_id:
            blockers.append({"gate": "export", "reason": "report_export_approval_mismatch", "export_approval_id": export.get("approval_id")})
        if export.get("errors"):
            blockers.append({"gate": "export", "reason": "report_export_errors_present", "errors": export.get("errors")})

    gate_id = stable_id("TCCGATE", [collection_id, case_id, report_id, export_id, len(blockers), now_utc()])
    status = "collection_e2e_complete" if not errors and not blockers else "blocked"
    result = {
        "kind": "redteam_ax_v2_toolchain_collection_completion_gate",
        "gate_id": gate_id,
        "collection_id": collection_id,
        "toolchain_id": (collection or {}).get("toolchain_id"),
        "case_id": case_id,
        "status": status,
        "complete": status == "collection_e2e_complete",
        "report_id": report_id or None,
        "approval_id": approval_id or None,
        "export_id": export_id or None,
        "candidate_evidence_count": len(set(candidate_evidence_ids)),
        "approved_evidence_count": len(set(approved_evidence_ids)),
        "promoted_finding_count": len(set(promoted_finding_ids)),
        "approved_finding_count": len(set(approved_finding_ids)),
        "matrix_status": matrix_status or None,
        "report_gate_snapshot": report_gate_snapshot(report) if report else None,
        "blocker_count": len(blockers),
        "blockers": blockers,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "errors": errors,
        "next_human_actions_ko": [
            "blocker가 있으면 해당 단계의 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report, Export를 먼저 완료합니다.",
            "complete=true일 때만 이 collection의 테스트된 E2E 산출을 운영 완료 증거로 사용할 수 있습니다.",
            "이 게이트는 도구 실행이나 승인 처리를 수행하지 않고 기존 artifact만 검증합니다.",
        ],
        "created_at": now_utc(),
    }
    append_artifact_metadata(result, "toolchain-completion-gates", gate_id)
    if collection is not None:
        collection["completion_gate_id"] = gate_id
        collection["completion_gate_status"] = status
        collection["completion_gate_blocker_count"] = len(blockers)
        append_artifact_metadata(collection, "toolchain-result-collections", collection_id)
    return result


def create_finding(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED").strip() or "CASE-UNSPECIFIED"
    evidence_ids = [str(item).strip() for item in (payload.get("evidence_ids") or []) if str(item).strip()]
    finding_id = str(payload.get("finding_id") or "").strip() or stable_id("F", [case_id, payload.get("title"), evidence_ids])
    severity_draft = normalize_severity(payload.get("severity_draft") or payload.get("severity") or "medium")
    required_text_fields = ["title", "root_cause", "business_impact", "owner", "sla", "retest_criteria"]
    errors = [f"{field}_required" for field in required_text_fields if not payload.get(field)]
    evidence_issues = evidence_approval_issues(case_id, evidence_ids)
    errors.extend(f"evidence:{issue['type']}:{issue['id']}" for issue in evidence_issues)
    if not evidence_ids:
        errors.append("evidence_ids_required")
    if severity_draft in {"high", "critical"} and not (payload.get("crown_jewel_link") or payload.get("affected_business_process")):
        errors.append("high_critical_requires_crown_jewel_or_business_process")

    status = "needs_evidence" if not evidence_ids else "pending_review"
    finding = {
        "kind": "redteam_ax_v2_finding",
        "case_id": case_id,
        "finding_id": finding_id,
        "title": str(payload.get("title") or "Untitled Finding").strip(),
        "severity_draft": severity_draft,
        "severity_final": None,
        "confidence": float(payload.get("confidence") or 0.75),
        "status": status,
        "approval_status": "pending",
        "related_objective": str(payload.get("related_objective") or "").strip(),
        "related_scenario": str(payload.get("related_scenario") or "").strip(),
        "related_campaign": str(payload.get("related_campaign") or "").strip(),
        "affected_assets": payload.get("affected_assets") or [],
        "affected_business_process": payload.get("affected_business_process") or [],
        "affected_data": payload.get("affected_data") or [],
        "crown_jewel_link": payload.get("crown_jewel_link") or [],
        "attack_path_reference": payload.get("attack_path_reference") or [],
        "observation": str(payload.get("observation") or "").strip(),
        "evidence_ids": evidence_ids,
        "expected_control": str(payload.get("expected_control") or "").strip(),
        "observed_control_response": str(payload.get("observed_control_response") or "").strip(),
        "detection_gap": str(payload.get("detection_gap") or "").strip(),
        "response_gap": str(payload.get("response_gap") or "").strip(),
        "root_cause": payload.get("root_cause") or [],
        "business_impact": str(payload.get("business_impact") or "").strip(),
        "likelihood": str(payload.get("likelihood") or "medium").strip().lower(),
        "impact": str(payload.get("impact") or "medium").strip().lower(),
        "recommendation": payload.get("recommendation") or [],
        "owner": str(payload.get("owner") or "").strip(),
        "sla": str(payload.get("sla") or "").strip(),
        "verification_method": str(payload.get("verification_method") or "").strip(),
        "retest_criteria": str(payload.get("retest_criteria") or "").strip(),
        "residual_risk": str(payload.get("residual_risk") or "").strip(),
        "human_reviewer": None,
        "approval_decisions": [],
        "severity_approval_policy": {
            "required_approver_roles": sorted(FINDING_SEVERITY_APPROVER_ROLES),
            "requires_distinct_approvers": True,
        },
        "errors": errors,
        "created_at": now_utc(),
    }
    return append_artifact_metadata(finding, "findings", finding_id)


def approved_finding_roles(finding: dict[str, Any], severity_final: str) -> tuple[set[str], set[str], bool]:
    roles: set[str] = set()
    actors: set[str] = set()
    severities: set[str] = set()
    for decision in finding.get("approval_decisions") or []:
        if str(decision.get("decision") or "").lower() != "approve":
            continue
        role = normalize_approver_role(decision.get("approver_role"))
        actor = str(decision.get("approved_by") or "").strip().lower()
        severity = normalize_severity(decision.get("severity_final"))
        if role in FINDING_SEVERITY_APPROVER_ROLES and actor:
            roles.add(role)
            actors.add(actor)
            severities.add(severity)
    return roles, actors, severities == {severity_final}


def approve_finding_severity(finding_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    finding = load_json_record(finding_id, "findings", case_id=case_id)
    errors: list[str] = []
    if finding is None:
        errors.append("finding_not_found")
        resolved_case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    else:
        resolved_case_id = str(finding.get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")

    approver = str(payload.get("approved_by") or payload.get("approver") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role"))
    actor_context, binding_errors = approval_actor_binding_errors(payload, approver, approver_role)
    decision = str(payload.get("decision") or "approve").strip().lower()
    severity_final = normalize_severity(payload.get("severity_final") or (finding or {}).get("severity_draft"))

    if not approver:
        errors.append("approved_by_required")
    errors.extend(binding_errors)
    if approver_role not in FINDING_SEVERITY_APPROVER_ROLES:
        errors.append("finding_severity_approver_role_required")
    if decision != "approve":
        errors.append("approval_decision_must_be_approve")

    evidence_issues: list[dict[str, Any]] = []
    if finding is not None:
        evidence_ids = [str(item).strip() for item in (finding.get("evidence_ids") or []) if str(item).strip()]
        if not evidence_ids:
            errors.append("evidence_ids_required")
        evidence_issues = evidence_approval_issues(resolved_case_id, evidence_ids)
        errors.extend(f"evidence:{issue['type']}:{issue['id']}" for issue in evidence_issues)

    approval_id = stable_id("FAPR", [resolved_case_id, finding_id, approver, approver_role, severity_final, now_utc()])
    pending_conditions: list[str] = []
    if finding is not None and not errors:
        decisions = [
            item for item in (finding.get("approval_decisions") or [])
            if not (
                str(item.get("approved_by") or "").strip().lower() == approver.lower()
                and normalize_approver_role(item.get("approver_role")) == approver_role
            )
        ]
        decisions.append({
            "approval_id": approval_id,
            "decision": decision,
            "approved_by": approver,
            "approver_role": approver_role,
            "severity_final": severity_final,
            "actor_context": actor_context,
            "approved_at": now_utc(),
        })
        finding["approval_decisions"] = decisions
        roles, actors, severity_aligned = approved_finding_roles(finding, severity_final)
        if not severity_aligned:
            errors.append("severity_approvals_must_match")
        if not FINDING_SEVERITY_APPROVER_ROLES.issubset(roles):
            pending_conditions.append("red_team_lead_and_business_owner_required")
        if len(actors) < 2:
            pending_conditions.append("distinct_finding_severity_approvers_required")
        if not errors and not pending_conditions:
            finding["status"] = "approved"
            finding["approval_status"] = "approved"
            finding["severity_final"] = severity_final
            finding["human_reviewer"] = approver
            finding["approved_at"] = now_utc()
        finding["errors"] = errors
        finding["pending_conditions"] = pending_conditions
        append_artifact_metadata(finding, "findings", finding_id)

    result = {
        "kind": "redteam_ax_v2_finding_severity_approval",
        "approval_id": approval_id,
        "finding_id": finding_id,
        "case_id": resolved_case_id,
        "status": "approved" if finding is not None and not errors and not pending_conditions and finding.get("approval_status") == "approved" else "pending" if finding is not None and not errors else "invalid",
        "decision": decision,
        "approved_by": approver,
        "approver_role": approver_role,
        "severity_final": severity_final,
        "actor_context": actor_context,
        "identity_binding": "bound" if not binding_errors else "invalid",
        "required_approver_roles": sorted(FINDING_SEVERITY_APPROVER_ROLES),
        "finding": finding,
        "evidence_issues": evidence_issues,
        "pending_conditions": pending_conditions,
        "errors": errors,
        "approved_at": now_utc() if finding is not None and not errors and not pending_conditions and finding.get("approval_status") == "approved" else None,
    }
    return append_artifact_metadata(result, "finding-approvals", approval_id)


def finding_approval_issues(case_id: str, findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    for item in findings:
        finding_id = str(item.get("finding_id") or item.get("id") or "").strip()
        if not finding_id:
            issues.append({"type": "missing_finding", "id": "unknown"})
            continue
        if not item.get("evidence_ids"):
            continue
        finding = load_json_record(finding_id, "findings", case_id)
        if finding is None:
            issues.append({"type": "missing_finding", "id": finding_id})
            continue
        if finding.get("approval_status") != "approved" or finding.get("status") != "approved":
            issues.append({"type": "unapproved_finding", "id": finding_id, "approval_status": finding.get("approval_status") or "unknown"})
        stored_final = str(finding.get("severity_final") or "").strip().lower()
        requested_final = str(item.get("severity_final") or stored_final).strip().lower()
        if stored_final not in FINDING_SEVERITIES:
            issues.append({"type": "unapproved_final_severity", "id": finding_id})
        elif requested_final and requested_final != stored_final:
            issues.append({"type": "final_severity_mismatch", "id": finding_id, "expected": stored_final, "actual": requested_final})
    return issues


def _normalize_agentic_rag_report_context(payload: dict[str, Any]) -> dict[str, Any]:
    raw = payload.get("agentic_rag_context") or payload.get("agentic_rag") or {}
    if not isinstance(raw, dict):
        raw = {}
    sca_report = raw.get("sca_report") if isinstance(raw.get("sca_report"), dict) else {}
    citation_verification = raw.get("citation_verification") if isinstance(raw.get("citation_verification"), dict) else {}
    matrix_candidate = raw.get("matrix_candidate") if isinstance(raw.get("matrix_candidate"), dict) else {}
    citations = raw.get("citations") if isinstance(raw.get("citations"), list) else []
    held_claims = raw.get("held_claims") if isinstance(raw.get("held_claims"), list) else []
    selected_corpora = raw.get("selected_corpora") if isinstance(raw.get("selected_corpora"), list) else []
    unsupported_count = int(citation_verification.get("unsupported_claim_count") or 0)
    candidate_status = str(matrix_candidate.get("status") or "").strip()
    report_usable = bool(
        raw
        and sca_report.get("decision") == "sufficient"
        and sca_report.get("answerable") is True
        and unsupported_count == 0
        and citation_verification.get("all_material_claims_supported") is True
        and candidate_status in {"", "ready_for_report_claim"}
    )
    return {
        "present": bool(raw),
        "result_id": raw.get("result_id") or raw.get("artifact_id") or raw.get("id"),
        "query": raw.get("query"),
        "selected_corpora": selected_corpora,
        "sca_report": sca_report,
        "citation_verification": citation_verification,
        "citations": citations,
        "matrix_candidate": matrix_candidate,
        "held_claims": held_claims,
        "unsupported_claim_count": unsupported_count,
        "held_claim_count": len(held_claims) + (1 if candidate_status == "hold_unsupported_claim" else 0),
        "report_usable": report_usable,
        "source": raw.get("source") or "agentic_rag_sca_citation_verifier",
    }


def _agentic_rag_blocking_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    if not context.get("present"):
        return []
    items: list[dict[str, Any]] = []
    result_id = context.get("result_id") or "agentic-rag-result"
    if context.get("unsupported_claim_count", 0) > 0:
        items.append({"type": "agentic_rag_citation_verifier_failed", "id": result_id})
    matrix_candidate = context.get("matrix_candidate") or {}
    if matrix_candidate.get("status") == "hold_unsupported_claim":
        items.append({
            "type": "agentic_rag_unsupported_claim_hold",
            "id": matrix_candidate.get("claim_id") or result_id,
            "hold_reason": matrix_candidate.get("hold_reason") or "citation verifier did not approve all material claims",
        })
    sca_report = context.get("sca_report") or {}
    if sca_report and sca_report.get("decision") != "sufficient":
        items.append({"type": "agentic_rag_sca_not_sufficient", "id": result_id, "decision": sca_report.get("decision")})
    return items


def validate_report(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    claims = payload.get("claims") or []
    findings = payload.get("findings") or []
    tool_actions = payload.get("tool_actions") or []
    agentic_rag_context = _normalize_agentic_rag_report_context(payload)
    referenced_evidence_ids = [
        evidence_id
        for item in [*claims, *findings]
        for evidence_id in (item.get("evidence_ids") or [])
    ]
    evidence_issues = evidence_approval_issues(case_id, referenced_evidence_ids)
    unsupported_claims = [
        claim for claim in claims
        if not claim.get("evidence_ids") or str(claim.get("support_level") or "supported").lower() in {"unsupported", "none"}
    ]
    findings_without_evidence = [
        finding for finding in findings
        if not finding.get("evidence_ids")
    ]
    finding_issues = finding_approval_issues(case_id, findings)
    unapproved_high_risk = [
        action for action in tool_actions
        if normalize_risk_class(action.get("risk_class")) in HIGH_RISK_CLASSES
        and action.get("approval_required") is not False
        and str(action.get("status") or "") not in TERMINAL_APPROVED_STATUSES
    ]
    blocking_items = []
    blocking_items.extend({"type": "unsupported_claim", "id": item.get("claim_id") or item.get("id")} for item in unsupported_claims)
    blocking_items.extend({"type": "finding_without_evidence", "id": item.get("finding_id") or item.get("id")} for item in findings_without_evidence)
    blocking_items.extend({"type": "unapproved_high_risk_action", "id": item.get("action_id") or item.get("id")} for item in unapproved_high_risk)
    blocking_items.extend(evidence_issues)
    blocking_items.extend(finding_issues)
    blocking_items.extend(_agentic_rag_blocking_items(agentic_rag_context))
    gate_status = "pass" if not blocking_items else "blocked"
    result = {
        "kind": "redteam_ax_v2_report_validation",
        "case_id": case_id,
        "gate_status": gate_status,
        "unsupported_claim_count": len(unsupported_claims),
        "unapproved_high_risk_count": len(unapproved_high_risk),
        "finding_without_evidence_count": len(findings_without_evidence),
        "unapproved_evidence_count": len([item for item in evidence_issues if item["type"] == "unapproved_evidence"]),
        "missing_evidence_count": len([item for item in evidence_issues if item["type"] == "missing_evidence"]),
        "unverified_evidence_count": len([item for item in evidence_issues if item["type"] == "unverified_evidence"]),
        "missing_finding_count": len([item for item in finding_issues if item["type"] == "missing_finding"]),
        "unapproved_finding_count": len([item for item in finding_issues if item["type"] == "unapproved_finding"]),
        "unapproved_final_severity_count": len([item for item in finding_issues if item["type"] in {"unapproved_final_severity", "final_severity_mismatch"}]),
        "agentic_rag_context": agentic_rag_context,
        "agentic_rag_report_usable": agentic_rag_context["report_usable"],
        "agentic_rag_unsupported_claim_count": agentic_rag_context["unsupported_claim_count"],
        "agentic_rag_held_claim_count": agentic_rag_context["held_claim_count"],
        "blocking_items": blocking_items,
        "validated_at": now_utc(),
    }
    return append_artifact_metadata(result, "report-validations", stable_id("RV", [result["case_id"], gate_status, blocking_items]))


def render_korean_report_markdown(payload: dict[str, Any], validation: dict[str, Any]) -> str:
    title = payload.get("title") or "Red Team Report v2"
    case_id = str(payload.get("case_id") or validation.get("case_id") or "CASE-UNSPECIFIED")
    claims = payload.get("claims") or []
    findings = payload.get("findings") or []
    tool_actions = payload.get("tool_actions") or []
    lines = [
        f"# {title}",
        "",
        "## 문서 통제",
        "",
        f"- Case ID: `{case_id}`",
        f"- 생성 시각: `{now_utc()}`",
        "- 문서 유형: Korean Red Team Report v2",
        "- 통제 원칙: ROE/HITL/가드레일 통과 결과와 Evidence Card만 보고서 주장에 사용",
        "",
        "## Campaign Walkthrough",
        "",
        "- 승인된 범위의 ToolActionCard 기반 수행 과정을 기록한다.",
        "- 고위험 실행은 사람이 승인, 수행, 검토한 ManualRunRecord만 반영한다.",
        "",
        "## Evidence Card Index",
        "",
    ]
    evidence_ids = sorted({evidence_id for claim in claims for evidence_id in claim.get("evidence_ids", [])})
    if evidence_ids:
        lines.extend(f"- `{evidence_id}`" for evidence_id in evidence_ids)
    else:
        lines.append("- 승인된 Evidence Card 없음")
    lines.extend([
        "",
        "## Claim-Evidence Matrix",
        "",
        "| Claim | Support | Evidence | Source |",
        "|---|---|---|---|",
    ])
    for claim in claims:
        lines.append(f"| `{claim.get('claim_id') or claim.get('id')}` | {claim.get('support_level') or 'supported'} | {', '.join(claim.get('evidence_ids') or [])} | {claim.get('source') or 'manual_report_studio'} |")
    agentic_rag_context = validation.get("agentic_rag_context") or {}
    if agentic_rag_context.get("present"):
        sca_report = agentic_rag_context.get("sca_report") or {}
        citation_verification = agentic_rag_context.get("citation_verification") or {}
        matrix_candidate = agentic_rag_context.get("matrix_candidate") or {}
        citations = agentic_rag_context.get("citations") or []
        citation_ids = [str(item.get("citation_id") or item.get("evidence_id") or "") for item in citations if isinstance(item, dict)]
        citation_ids = [item for item in citation_ids if item]
        lines.extend([
            "",
            "## Agentic RAG Citation Verifier",
            "",
            f"- Result ID: `{agentic_rag_context.get('result_id') or 'not-recorded'}`",
            f"- Query: {agentic_rag_context.get('query') or 'not-recorded'}",
            f"- SCA decision: `{sca_report.get('decision') or 'unknown'}`",
            f"- SCA answerable: `{sca_report.get('answerable')}`",
            f"- Sufficient context score: `{sca_report.get('sufficient_context_score')}`",
            f"- Unsupported material claims: `{citation_verification.get('unsupported_claim_count', 0)}`",
            f"- All material claims supported: `{citation_verification.get('all_material_claims_supported')}`",
            f"- Report usable: `{agentic_rag_context.get('report_usable')}`",
            f"- Selected corpora: {', '.join(agentic_rag_context.get('selected_corpora') or []) or 'not-recorded'}",
            f"- Citations: {', '.join(citation_ids) or 'not-recorded'}",
            f"- Matrix candidate: `{matrix_candidate.get('status') or 'not-recorded'}` / claim `{matrix_candidate.get('claim_id') or 'not-recorded'}`",
        ])
        if agentic_rag_context.get("held_claims"):
            lines.append("- Held claims:")
            for held in agentic_rag_context.get("held_claims") or []:
                if isinstance(held, dict):
                    lines.append(f"  - `{held.get('claim_id') or held.get('id') or 'unknown'}` {held.get('reason') or held.get('hold_reason') or 'unsupported'}")
    lines.extend([
        "",
        "## Findings",
        "",
    ])
    for finding in findings:
        severity = finding.get("severity_final") or finding.get("severity_draft") or "pending"
        lines.append(f"- `{finding.get('finding_id') or finding.get('id')}` {finding.get('title') or 'Finding'} / Severity: {severity} / Evidence: {', '.join(finding.get('evidence_ids') or [])}")
    lines.extend([
        "",
        "## ToolAction / HITL Summary",
        "",
    ])
    for action in tool_actions:
        lines.append(f"- `{action.get('action_id') or action.get('id')}` risk={normalize_risk_class(action.get('risk_class'))} status={action.get('status')} approval_required={action.get('approval_required')}")
    lines.extend([
        "",
        "## Report Gate",
        "",
        f"- Gate status: `{validation['gate_status']}`",
        f"- Unsupported claims: `{validation['unsupported_claim_count']}`",
        f"- Unapproved high-risk actions: `{validation['unapproved_high_risk_count']}`",
        f"- Findings without evidence: `{validation['finding_without_evidence_count']}`",
        f"- Missing evidence: `{validation.get('missing_evidence_count', 0)}`",
        f"- Unapproved evidence: `{validation.get('unapproved_evidence_count', 0)}`",
        f"- Unverified evidence: `{validation.get('unverified_evidence_count', 0)}`",
        f"- Missing findings: `{validation.get('missing_finding_count', 0)}`",
        f"- Unapproved findings: `{validation.get('unapproved_finding_count', 0)}`",
        f"- Unapproved final severities: `{validation.get('unapproved_final_severity_count', 0)}`",
        f"- Agentic RAG report usable: `{validation.get('agentic_rag_report_usable')}`",
        f"- Agentic RAG unsupported claims: `{validation.get('agentic_rag_unsupported_claim_count', 0)}`",
        f"- Agentic RAG held claims: `{validation.get('agentic_rag_held_claim_count', 0)}`",
        "",
        "## 재시험 계획",
        "",
        "- Evidence-linked finding별 remediation owner와 retest window를 지정한다.",
        "- 재시험 결과도 Evidence Card로 승격한 뒤 Claim-Evidence Matrix에 연결한다.",
        "",
    ])
    return "\n".join(lines)


def write_report_artifact(case_id: str, report_id: str, markdown: str) -> str:
    path = case_dir(case_id) / "reports"
    path.mkdir(parents=True, exist_ok=True)
    report_path = path / f"{safe_name(report_id)}.md"
    report_path.write_text(markdown, encoding="utf-8", newline="\n")
    return report_path.as_posix()


def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    validation = validate_report(payload)
    case_id = str(payload.get("case_id") or validation.get("case_id") or "CASE-UNSPECIFIED")
    report_id = stable_id("RTRPT", [case_id, payload.get("title"), validation["validated_at"]])
    report = None
    artifact_path = None
    hold_audit_path = None
    if validation.get("agentic_rag_held_claim_count", 0) or validation.get("agentic_rag_unsupported_claim_count", 0):
        hold_audit_path = write_case_event(case_id, {
            "event": "agentic_rag_claim_hold",
            "record_id": report_id,
            "agentic_rag_result_id": (validation.get("agentic_rag_context") or {}).get("result_id"),
            "agentic_rag_held_claim_count": validation.get("agentic_rag_held_claim_count", 0),
            "agentic_rag_unsupported_claim_count": validation.get("agentic_rag_unsupported_claim_count", 0),
            "blocking_items": [
                item for item in validation.get("blocking_items", [])
                if str(item.get("type") or "").startswith("agentic_rag_")
            ],
        })
    if validation["gate_status"] == "pass":
        markdown = render_korean_report_markdown({**payload, "case_id": case_id}, validation)
        artifact_path = write_report_artifact(case_id, report_id, markdown)
        sections = [
            "문서 통제",
            "캠페인 Walkthrough",
            "Evidence Card Index",
            "Claim-Evidence Matrix",
            "Findings",
            "재시험 계획",
        ]
        if (validation.get("agentic_rag_context") or {}).get("present"):
            sections.insert(4, "Agentic RAG Citation Verifier")
        report = {
            "report_id": report_id,
            "title": payload.get("title") or "Red Team Report v2",
            "language": "ko",
            "artifact_path": artifact_path,
            "sections": sections,
            "agentic_rag_context": validation.get("agentic_rag_context"),
        }
        write_case_event(case_id, {
            "event": "korean_report_v2_generated",
            "record_id": report_id,
            "artifact_path": artifact_path,
            "agentic_rag_result_id": (validation.get("agentic_rag_context") or {}).get("result_id"),
            "agentic_rag_report_usable": validation.get("agentic_rag_report_usable"),
            "agentic_rag_held_claim_count": validation.get("agentic_rag_held_claim_count", 0),
        })
    result = {
        "kind": "redteam_ax_v2_korean_report_draft",
        "case_id": case_id,
        "report_id": report_id,
        "gate_status": validation["gate_status"],
        "validation": validation,
        "report": report,
        "agentic_rag_context": validation.get("agentic_rag_context"),
        "agentic_rag_hold_audit_log_path": hold_audit_path,
    }
    return append_artifact_metadata(result, "reports", report_id)


def report_gate_snapshot(report: dict[str, Any]) -> dict[str, Any]:
    validation = report.get("validation") or {}
    blocking_items = validation.get("blocking_items") or []
    return {
        "gate_status": report.get("gate_status") or validation.get("gate_status") or "blocked",
        "unsupported_claim_count": int(validation.get("unsupported_claim_count") or 0),
        "unapproved_high_risk_count": int(validation.get("unapproved_high_risk_count") or 0),
        "finding_without_evidence_count": int(validation.get("finding_without_evidence_count") or 0),
        "missing_evidence_count": int(validation.get("missing_evidence_count") or 0),
        "unapproved_evidence_count": int(validation.get("unapproved_evidence_count") or 0),
        "unverified_evidence_count": int(validation.get("unverified_evidence_count") or 0),
        "missing_finding_count": int(validation.get("missing_finding_count") or 0),
        "unapproved_finding_count": int(validation.get("unapproved_finding_count") or 0),
        "unapproved_final_severity_count": int(validation.get("unapproved_final_severity_count") or 0),
        "blocking_items": blocking_items,
    }


def report_export_gate_errors(report: dict[str, Any] | None) -> list[str]:
    if report is None:
        return ["report_not_found"]
    snapshot = report_gate_snapshot(report)
    errors: list[str] = []
    if snapshot["gate_status"] != "pass":
        errors.append("report_validation_gate_not_passed")
    if snapshot["unsupported_claim_count"] != 0:
        errors.append("unsupported_claims_present")
    if snapshot["unapproved_high_risk_count"] != 0:
        errors.append("unapproved_high_risk_actions_present")
    if snapshot["finding_without_evidence_count"] != 0:
        errors.append("findings_without_evidence_present")
    if snapshot["missing_evidence_count"] != 0:
        errors.append("missing_evidence_present")
    if snapshot["unapproved_evidence_count"] != 0:
        errors.append("unapproved_evidence_present")
    if snapshot["unverified_evidence_count"] != 0:
        errors.append("unverified_evidence_present")
    if snapshot["missing_finding_count"] != 0:
        errors.append("missing_finding_present")
    if snapshot["unapproved_finding_count"] != 0:
        errors.append("unapproved_finding_present")
    if snapshot["unapproved_final_severity_count"] != 0:
        errors.append("unapproved_final_severity_present")
    if snapshot["blocking_items"]:
        errors.append("report_validation_blocking_items_present")
    if not (report.get("report") or {}).get("artifact_path"):
        errors.append("report_artifact_required")
    return errors


def approve_report_export(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    report = load_json_record(report_id, "reports", case_id=case_id)
    errors = report_export_gate_errors(report)
    approver = str(payload.get("approved_by") or payload.get("approver") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role"))
    actor_context, binding_errors = approval_actor_binding_errors(payload, approver, approver_role)
    decision = str(payload.get("decision") or "approve").strip().lower()

    if not approver:
        errors.append("approved_by_required")
    errors.extend(binding_errors)
    if approver_role not in REPORT_EXPORT_APPROVER_ROLES:
        errors.append("executive_sponsor_approval_required")
    if decision != "approve":
        errors.append("approval_decision_must_be_approve")

    resolved_case_id = str((report or {}).get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    approval_id = stable_id("RTA", [resolved_case_id, report_id, approver, approver_role, now_utc()])
    result = {
        "kind": "redteam_ax_v2_report_export_approval",
        "approval_id": approval_id,
        "report_id": report_id,
        "case_id": resolved_case_id,
        "status": "ExportApproved" if not errors else "invalid",
        "decision": decision,
        "approved_by": approver,
        "approver_role": approver_role,
        "actor_context": actor_context,
        "identity_binding": "bound" if not binding_errors else "invalid",
        "required_approver_roles": sorted(REPORT_EXPORT_APPROVER_ROLES),
        "gate_snapshot": report_gate_snapshot(report) if report else None,
        "approved_at": now_utc() if not errors else None,
        "errors": errors,
    }
    category = "report-export-approvals"
    return append_artifact_metadata(result, category, approval_id)


def export_report(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    report = load_json_record(report_id, "reports", case_id=case_id)
    errors = report_export_gate_errors(report)
    approval_id = str(payload.get("approval_id") or "").strip()
    approval = load_json_record(approval_id, "report-export-approvals", case_id=case_id) if approval_id else None

    if not approval_id:
        errors.append("report_export_approval_required")
    elif approval is None:
        errors.append("report_export_approval_not_found")
    else:
        if approval.get("report_id") != report_id:
            errors.append("report_export_approval_report_mismatch")
        if approval.get("status") != "ExportApproved":
            errors.append("report_export_approval_not_approved")
        if normalize_approver_role(approval.get("approver_role")) not in REPORT_EXPORT_APPROVER_ROLES:
            errors.append("executive_sponsor_approval_required")

    resolved_case_id = str((report or {}).get("case_id") or (approval or {}).get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    export_id = stable_id("RTEXP", [resolved_case_id, report_id, approval_id or "unapproved", now_utc()])
    report_artifact_path = ((report or {}).get("report") or {}).get("artifact_path")
    result = {
        "kind": "redteam_ax_v2_report_export",
        "export_id": export_id,
        "report_id": report_id,
        "case_id": resolved_case_id,
        "status": "Exported" if not errors else "blocked",
        "approval_id": approval_id or None,
        "approved_by": (approval or {}).get("approved_by"),
        "approver_role": (approval or {}).get("approver_role"),
        "actor_context": (approval or {}).get("actor_context"),
        "identity_binding": (approval or {}).get("identity_binding"),
        "report_artifact_path": report_artifact_path,
        "gate_snapshot": report_gate_snapshot(report) if report else None,
        "exported_at": now_utc() if not errors else None,
        "errors": errors,
    }
    return append_artifact_metadata(result, "exports", export_id)
