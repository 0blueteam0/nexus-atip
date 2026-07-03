from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = PROJECT_ROOT / "Red Team Studio" / "고도화" / "sanity" / "redteam_ax_wsl_runtime_readiness.py"


def load_module():
    spec = importlib.util.spec_from_file_location("redteam_ax_wsl_runtime_readiness", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("failed to load redteam_ax_wsl_runtime_readiness")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RedTeamAxWslRuntimeReadinessTests(TestCase):
    def test_should_fallback_to_alternate_distro_when_default_vhdx_mount_fails(self) -> None:
        module = load_module()
        wsl_list = (
            "  NAME                          STATE           VERSION\n"
            "* Ubuntu-22.04                  Stopped         2\n"
            "  Ubuntu-22.04-AISOC-Rebuild    Stopped         2\n"
            "  docker-desktop                Running         2\n"
        )

        def fake_run_command(argv: list[str], timeout: int = 20) -> dict:
            if argv[1:3] == ["-l", "-v"]:
                return {"argv": argv, "exit_code": 0, "stdout": wsl_list, "stderr": ""}
            distro = argv[argv.index("-d") + 1]
            if distro == "Ubuntu-22.04":
                return {
                    "argv": argv,
                    "exit_code": 4294967295,
                    "stdout": "Wsl/Service/CreateInstance/MountDisk/HCS/0x80070570",
                    "stderr": "",
                }
            if distro == "Ubuntu-22.04-AISOC-Rebuild":
                return {
                    "argv": argv,
                    "exit_code": 0,
                    "stdout": "Linux aisoc\n/mnt/c/Users/alice/AppData/Local/hermes/node/npm\n/mnt/c/Program Files/Docker/Docker/resources/bin/docker\n",
                    "stderr": "",
                }
            raise AssertionError(f"unexpected distro probe: {argv}")

        args = argparse.Namespace(allow_start=True, require_ready=True, distro=None, timeout=20)
        with patch.object(module.shutil, "which", return_value="C:/Windows/System32/wsl.exe"):
            with patch.object(module, "run_command", side_effect=fake_run_command):
                result, exit_code = module.build_readiness(args)

        self.assertEqual(exit_code, 0)
        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["selected_distro"], "Ubuntu-22.04-AISOC-Rebuild")
        self.assertEqual(result["failed_probe_count_before_selection"], 1)
        self.assertEqual(result["wsl_tool_probe_results"][0]["blockers"], [
            "wsl_distribution_start_failed",
            "wsl_ext4_vhdx_corrupt_or_unreadable",
            "wsl_mount_disk_failed",
        ])
        self.assertIn("/mnt/c/Program Files/Docker/Docker/resources/bin/docker", result["available_tool_paths"])
