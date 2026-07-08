from __future__ import annotations

import importlib
import sys
import unittest
from pathlib import Path

try:
    from fastapi.testclient import TestClient
except ModuleNotFoundError:  # pragma: no cover - local dev image may omit FastAPI
    TestClient = None  # type: ignore[assignment]


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class MalaxV2WorkflowModelTests(unittest.TestCase):
    def test_model_blocks_sample_execution_boundary_violation(self) -> None:
        from runtime import malax_v2_workflow

        job = malax_v2_workflow.plan_job({"case_id": "CASE-MALAX2-BOUNDARY", "report_id": "MAR-2026-0004"})

        def unsafe_executor(_job: dict, _step: dict, _payload: dict) -> dict:
            return {"ok": True, "state": "unsafe", "safety": {"sample_executed": True}}

        result = malax_v2_workflow.advance_job(job["job_id"], {}, section_executor=unsafe_executor)
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["job"]["workflow_status"], "blocked")
        self.assertEqual(result["executor_result"]["policy_violation"], "sample_execution_not_allowed_in_malax2_agent_boundary")


@unittest.skipIf(TestClient is None, "fastapi is not installed in the current Python environment")
class MalaxV2WorkflowApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        module = importlib.import_module("runtime.malware_upload_api")
        cls.client = TestClient(module.app)

    def test_health_advertises_langgraph_compatible_job_buttons(self) -> None:
        response = self.client.get("/api/reports/malax/v2/health")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "malax2_workflow_health")
        self.assertEqual(body["workflow_runtime"], "langgraph_compatible_state_machine")
        self.assertIn("plan_job", body["buttons"])
        self.assertIn("dynamic_preflight", body["human_approval_points"])

    def test_plan_job_creates_traceable_graph_and_ready_first_step(self) -> None:
        response = self.client.post("/api/reports/malax/v2/jobs/plan", json={
            "case_id": "CASE-MALAX2-001",
            "report_id": "MAR-2026-0001",
            "objective": "Adversarial workflow validation",
            "requested_by": "analyst@example.com",
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "malax2_workflow_job")
        self.assertEqual(body["workflow_status"], "planned")
        self.assertEqual(body["current_step_id"], "intake")
        self.assertGreaterEqual(len(body["graph"]["nodes"]), 6)
        self.assertTrue(body["safety_boundary"]["dynamic_execution_requires_human_approval"])
        self.assertEqual(body["steps"][0]["status"], "ready")

    def test_advance_pauses_at_dynamic_preflight_until_human_approval(self) -> None:
        job = self.client.post("/api/reports/malax/v2/jobs/plan", json={
            "case_id": "MAR-REPORT-ONLY",
            "report_id": "MAR-2026-0002",
            "objective": "Approval gate test",
        }).json()
        job_id = job["job_id"]

        for _ in range(4):
            response = self.client.post(f"/api/reports/malax/v2/jobs/{job_id}/advance", json={
                "execute_existing_malax_section": False,
                "operator": "agent",
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn(response.json()["status"], {"completed", "awaiting_human_approval"})

        response = self.client.post(f"/api/reports/malax/v2/jobs/{job_id}/advance", json={
            "execute_existing_malax_section": False,
            "operator": "agent",
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "awaiting_human_approval")
        self.assertEqual(body["step"]["step_id"], "dynamic_preflight")
        self.assertEqual(body["job"]["summary"]["awaiting_approval_count"], 1)

    def test_human_approval_allows_dynamic_preflight_to_advance(self) -> None:
        job = self.client.post("/api/reports/malax/v2/jobs/plan", json={
            "case_id": "MAR-REPORT-ONLY",
            "report_id": "MAR-2026-0003",
        }).json()
        job_id = job["job_id"]
        for _ in range(5):
            self.client.post(f"/api/reports/malax/v2/jobs/{job_id}/advance", json={"execute_existing_malax_section": False})

        approval = self.client.post(f"/api/reports/malax/v2/jobs/{job_id}/approval", json={
            "step_id": "dynamic_preflight",
            "approved_by": "lead@example.com",
            "role": "lead_analyst",
        })
        self.assertEqual(approval.status_code, 200)
        self.assertEqual(approval.json()["status"], "approved")

        advanced = self.client.post(f"/api/reports/malax/v2/jobs/{job_id}/advance", json={
            "execute_existing_malax_section": False,
            "operator": "agent",
        }).json()
        self.assertEqual(advanced["status"], "completed")
        self.assertEqual(advanced["step"]["step_id"], "dynamic_preflight")
        self.assertGreaterEqual(advanced["job"]["summary"]["trace_count"], 6)

if __name__ == "__main__":
    unittest.main()
