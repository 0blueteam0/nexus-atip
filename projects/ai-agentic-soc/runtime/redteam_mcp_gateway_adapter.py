from __future__ import annotations

import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any

REDTEAM_AX_ROOT = Path('J:/Red Team Studio/v1.2/redteam_ax_starter_pack_v1_2_mcp/redteam-ax-starter')
REDTEAM_AX_SRC = REDTEAM_AX_ROOT / 'src'
POLICY_PATH = REDTEAM_AX_ROOT / 'config' / 'mcp_policy.yaml'
REGISTRY_PATH = REDTEAM_AX_ROOT / 'config' / 'mcp_server_registry.yaml'
if REDTEAM_AX_SRC.exists() and str(REDTEAM_AX_SRC) not in sys.path:
    sys.path.insert(0, str(REDTEAM_AX_SRC))

LEGACY_SERVER_ALIASES = {
    'mcp_mitre_attack_read': 'mitre_attack_community',
    'mcp_caldera_metadata': 'caldera_mcp_plugin',
}
LEGACY_CLASS_MAP = {
    'emulation_execute': 'mcp_emulation_execute',
    'browser_unsafe_code': 'mcp_shell_or_code_exec',
    'admin_action': 'mcp_privileged_write',
    'external_write': 'mcp_external_write',
    'confidential_browser': 'mcp_sensitive_browser_capture',
}


def _load_v12_policy() -> tuple[dict[str, Any], dict[str, Any], str]:
    from redteam_ax.mcp_policy import load_mcp_registry, load_yaml
    policy = load_yaml(str(POLICY_PATH))
    registry = load_mcp_registry(str(REGISTRY_PATH))
    return policy, registry, 'redteam_ax.mcp_policy.evaluate_mcp_invocation'


def _normalize_tool_class(tool_class: str) -> str:
    return LEGACY_CLASS_MAP.get(tool_class, tool_class)


def _normalize_server_id(server_id: str) -> str:
    return LEGACY_SERVER_ALIASES.get(server_id, server_id)


def _fallback_decision(server_id: str, tool_name: str, tool_class: str, classification: str, arguments: dict[str, Any]) -> dict[str, Any]:
    arguments_hash = hashlib.sha256(json.dumps(arguments, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()
    blocked = {'mcp_emulation_execute', 'mcp_shell_or_code_exec', 'mcp_privileged_write', 'emulation_execute', 'browser_unsafe_code', 'admin_action'}
    approval = {'mcp_sensitive_read', 'mcp_external_write', 'mcp_report_export', 'mcp_sensitive_browser_capture', 'external_write', 'confidential_browser'}
    if tool_class in blocked:
        decision = 'deny'
        reason = f'{tool_class} is denied by fallback redteam MCP guard'
    elif tool_class in approval or classification in {'confidential', 'restricted'}:
        decision = 'approval_required'
        reason = 'human approval required by fallback redteam MCP guard'
    else:
        decision = 'allow'
        reason = f'{tool_class} allowed with audit by fallback redteam MCP guard'
    return {
        'kind': 'redteam_mcp_policy_decision',
        'engine': 'fallback_redteam_mcp_policy',
        'decision': decision,
        'reason': reason,
        'server_id': server_id,
        'tool_name': tool_name,
        'tool_class': tool_class,
        'classification': classification,
        'risk_flags': [],
        'audit': {'created_at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'arguments_hash': arguments_hash, 'store_output': decision != 'deny'},
    }


def evaluate_mcp_request(
    server_id: str,
    tool_name: str,
    tool_class: str,
    classification: str = 'internal',
    arguments: dict[str, Any] | None = None,
    case_id: str = 'RTA-MCP-CASE',
    requested_by: str = 'system',
    purpose: str = 'redteam backend MCP policy evaluation',
    tool_description: str = '',
) -> dict[str, Any]:
    """Evaluate an MCP request through Red Team Studio v1.2 policy where available.

    실행은 하지 않는다. v1.2의 `evaluate_mcp_invocation`으로 allow/deny/approval만
    산출하고, tool output은 untrusted data로 취급하도록 audit/evidence policy를 반환한다.
    """
    arguments = arguments or {}
    normalized_server = _normalize_server_id(server_id)
    normalized_class = _normalize_tool_class(tool_class)
    try:
        from redteam_ax.mcp_policy import MCPInvocationRequest, evaluate_mcp_invocation
        policy, registry, engine = _load_v12_policy()
        request = MCPInvocationRequest(
            case_id=case_id,
            server_id=normalized_server,
            tool_name=tool_name,
            tool_class=normalized_class,
            arguments=arguments,
            requested_by=requested_by,
            purpose=purpose,
            classification=classification,
        )
        decision = evaluate_mcp_invocation(policy, registry, request, tool_description=tool_description)
        payload = decision.to_dict()
        payload.update({
            'kind': 'redteam_mcp_policy_decision',
            'engine': engine,
            'server_id': normalized_server,
            'original_server_id': server_id,
            'tool_name': tool_name,
            'tool_class': normalized_class,
            'original_tool_class': tool_class,
            'classification': classification,
        })
        audit = payload.setdefault('audit', {})
        audit.setdefault('created_at', time.strftime('%Y-%m-%dT%H:%M:%S%z'))
        audit.setdefault('arguments_hash', hashlib.sha256(json.dumps(arguments, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest())
        audit['store_output'] = payload.get('decision') != 'deny'
        return payload
    except Exception as exc:
        fallback = _fallback_decision(normalized_server, tool_name, normalized_class, classification, arguments)
        fallback['fallback_reason'] = str(exc)
        fallback['original_server_id'] = server_id
        fallback['original_tool_class'] = tool_class
        return fallback


def deny_direct_mcp_invocation(payload: dict[str, Any]) -> dict[str, Any]:
    """Return a non-executing denial record for direct agent-to-MCP calls."""
    arguments = payload.get('arguments') if isinstance(payload.get('arguments'), dict) else {}
    server_id = str(payload.get('server_id') or 'unknown_mcp_server')
    tool_name = str(payload.get('tool_name') or 'unknown_tool')
    tool_class = str(payload.get('tool_class') or 'mcp_unknown')
    classification = str(payload.get('classification') or 'internal')
    case_id = str(payload.get('case_id') or 'RTA-MCP-DIRECT-DENY')
    policy_decision = evaluate_mcp_request(
        server_id=server_id,
        tool_name=tool_name,
        tool_class=tool_class,
        classification=classification,
        arguments=arguments,
        case_id=case_id,
        requested_by=str(payload.get('requested_by') or 'direct-agent-call'),
        purpose=str(payload.get('purpose') or 'direct MCP invocation guard evaluation'),
        tool_description=str(payload.get('tool_description') or ''),
    )
    arguments_hash = hashlib.sha256(json.dumps(arguments, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()
    return {
        'kind': 'redteam_mcp_direct_invocation_guard',
        'status': 'denied',
        'decision': 'deny',
        'errors': ['direct_agent_to_mcp_invocation_denied', 'tool_action_card_required'],
        'reason': 'MCP direct invocation is denied; create a ToolActionCard and pass ROE/HITL/guardrails first.',
        'case_id': case_id,
        'server_id': server_id,
        'tool_name': tool_name,
        'tool_class': tool_class,
        'classification': classification,
        'policy_decision': policy_decision,
        'commands_executed_by_api': False,
        'mcp_server_invoked': False,
        'trusted_as_instruction': False,
        'requires_human_validation': True,
        'required_path': 'ToolActionCard -> ROE -> HITL -> MCP Gateway -> MCP Tool Guard -> Evidence Card',
        'audit': {
            'created_at': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
            'arguments_hash': arguments_hash,
            'store_output': True,
        },
    }
