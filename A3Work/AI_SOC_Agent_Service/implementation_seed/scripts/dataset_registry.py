"""Dataset manifest registry for AI SOC Agent Service evaluation seed.

The registry is intentionally metadata-only. It validates dataset planning data and
builds a safe replay plan without downloading public data or connecting to SOC tools.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from public_dataset_adapter import PublicDatasetAdapter

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "schemas"
DEFAULT_MANIFEST = ROOT / "datasets" / "dataset_manifest.json"


def utc_now() -> str:
    """Return an ISO-8601 UTC timestamp without microseconds."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    """Load a UTF-8 JSON object from disk."""
    with path.open("r", encoding="utf-8") as fp:
        payload = json.load(fp)
    if not isinstance(payload, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return payload


def load_dataset_manifest(path: Path = DEFAULT_MANIFEST) -> dict[str, Any]:
    """Load and validate the dataset manifest."""
    manifest = load_json(path)
    validate_dataset_manifest(manifest)
    return manifest


def validate_dataset_manifest(manifest: dict[str, Any]) -> None:
    """Validate a dataset manifest against the PoC JSON schema."""
    schema = load_json(SCHEMA_DIR / "dataset_manifest.schema.json")
    Draft202012Validator(schema).validate(manifest)


class DatasetRegistry:
    """Read dataset source metadata and produce safe replay planning artifacts."""

    def __init__(self, manifest_path: Path = DEFAULT_MANIFEST) -> None:
        self.manifest_path = manifest_path
        self.manifest = load_dataset_manifest(manifest_path)

    def list_sources(self) -> list[dict[str, Any]]:
        """Return every source declared in the manifest."""
        return list(self.manifest["sources"])

    def list_enabled_sources(self) -> list[dict[str, Any]]:
        """Return sources enabled for metadata-only replay planning."""
        return [source for source in self.list_sources() if source["enabled"]]

    def get_source(self, source_id: str) -> dict[str, Any]:
        """Return one source by id."""
        for source in self.list_sources():
            if source["source_id"] == source_id:
                return source
        raise KeyError(f"dataset source not found: {source_id}")

    def build_replay_plan(self) -> dict[str, Any]:
        """Build a deterministic metadata-only replay plan.

        Public datasets remain download-blocked until a user explicitly approves
        acquisition and license review.
        """
        sources = [self._source_to_plan_item(source) for source in self.list_enabled_sources()]
        public_sources = [source for source in sources if source["source_type"] == "public"]
        synthetic_sources = [source for source in sources if source["source_type"] == "synthetic"]
        return {
            "schema_version": "1.0",
            "generated_at": utc_now(),
            "manifest_id": self.manifest["manifest_id"],
            "manifest_path": str(self.manifest_path),
            "execution_mode": "metadata_only_no_download",
            "summary": {
                "total_sources": len(self.manifest["sources"]),
                "enabled_sources": len(sources),
                "public_sources": len(public_sources),
                "synthetic_sources": len(synthetic_sources),
                "dataset_readiness": self._dataset_readiness(),
            },
            "sources": sources,
        }

    def write_replay_plan(self, out_path: Path) -> dict[str, Any]:
        """Write the metadata-only replay plan to JSON and return it."""
        plan = self.build_replay_plan()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as fp:
            json.dump(plan, fp, ensure_ascii=False, indent=2)
            fp.write("\n")
        return plan

    def build_case_spec_plan(self) -> dict[str, Any]:
        """Build metadata-only public dataset case specs for future adapters."""
        enabled_public_sources = [
            source for source in self.list_enabled_sources() if source["source_type"] == "public"
        ]
        case_specs = [
            spec
            for source in enabled_public_sources
            for spec in PublicDatasetAdapter(source).to_case_specs()
        ]
        return {
            "schema_version": "1.0",
            "generated_at": utc_now(),
            "manifest_id": self.manifest["manifest_id"],
            "manifest_path": str(self.manifest_path),
            "execution_mode": "metadata_only_no_download",
            "summary": {
                "enabled_public_sources": len(enabled_public_sources),
                "case_specs": len(case_specs),
                "download_blocked_case_specs": sum(1 for spec in case_specs if spec["download_allowed"] is False),
            },
            "case_specs": case_specs,
        }

    def write_case_spec_plan(self, out_path: Path) -> dict[str, Any]:
        """Write metadata-only public dataset case specs to JSON and return them."""
        plan = self.build_case_spec_plan()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as fp:
            json.dump(plan, fp, ensure_ascii=False, indent=2)
            fp.write("\n")
        return plan

    @staticmethod
    def _source_to_plan_item(source: dict[str, Any]) -> dict[str, Any]:
        return {
            "source_id": source["source_id"],
            "display_name": source["display_name"],
            "source_type": source["source_type"],
            "adapter": source["adapter"],
            "ingestion_status": source["ingestion_status"],
            "download_allowed": source["download_allowed"],
            "candidate_tasks": source["candidate_tasks"],
            "case_template_count": len(source["case_templates"]),
            "limitations": source["limitations"],
        }

    def _dataset_readiness(self) -> dict[str, int]:
        readiness: dict[str, int] = {}
        for source in self.manifest["sources"]:
            status = source["ingestion_status"]
            readiness[status] = readiness.get(status, 0) + 1
        return readiness


def main() -> int:
    registry = DatasetRegistry()
    replay_out_path = ROOT / "reports" / "dataset_replay_plan_v0.json"
    case_spec_out_path = ROOT / "reports" / "dataset_case_spec_plan_v0.json"
    replay_plan = registry.write_replay_plan(replay_out_path)
    case_spec_plan = registry.write_case_spec_plan(case_spec_out_path)
    print(json.dumps({"replay_plan": replay_plan, "case_spec_plan": case_spec_plan}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
