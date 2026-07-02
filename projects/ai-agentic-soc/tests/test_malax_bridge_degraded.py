from __future__ import annotations

import importlib
import sqlite3
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class FailingMalaxCore:
    def latest_case_summary(self) -> dict | None:
        raise sqlite3.OperationalError("disk I/O error")

    def list_cases(self, limit: int = 100) -> list[dict]:
        raise sqlite3.OperationalError("disk I/O error")


class MalaxBridgeDegradedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.module = importlib.import_module("runtime.malware_upload_api")
        cls.client = TestClient(cls.module.app)

    def test_latest_returns_degraded_payload_when_core_store_fails(self) -> None:
        with (
            patch.object(self.module, "_malax_core", return_value=FailingMalaxCore()),
            patch.object(self.module, "malax_latest", return_value=None),
        ):
            response = self.client.get("/api/malax/latest")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["ok"])
        self.assertTrue(body["degraded"])
        self.assertEqual(body["reason"], "malax_core_unavailable")
        self.assertEqual(body["core_bridge_error_type"], "OperationalError")

    def test_runs_returns_legacy_fallback_when_core_store_fails(self) -> None:
        fallback_runs = [{"case_id": "MALAX-LEGACY-001", "title": "legacy run"}]
        with (
            patch.object(self.module, "_malax_core", return_value=FailingMalaxCore()),
            patch.object(self.module, "malax_list_runs", return_value=fallback_runs),
        ):
            response = self.client.get("/api/malax/runs?limit=8")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), fallback_runs)


if __name__ == "__main__":
    unittest.main()
