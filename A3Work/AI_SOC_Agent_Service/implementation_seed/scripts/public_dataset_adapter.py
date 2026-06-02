"""Metadata-only public dataset adapter stubs.

These adapters intentionally do not download, crawl, or parse public datasets.
They convert manifest metadata into planned case specs that can guide the next
approved ingestion implementation.
"""

from __future__ import annotations

from typing import Any


class PublicDatasetAdapter:
    """Convert one public dataset manifest source into replay case specs."""

    def __init__(self, source: dict[str, Any]) -> None:
        if source["source_type"] != "public":
            raise ValueError("PublicDatasetAdapter requires a public source")
        self.source = source

    def to_case_specs(self) -> list[dict[str, Any]]:
        """Return metadata-only case specs for future public dataset ingestion."""
        return [self._template_to_spec(template) for template in self.source["case_templates"]]

    def _template_to_spec(self, template: dict[str, Any]) -> dict[str, Any]:
        return {
            "source_id": self.source["source_id"],
            "adapter": self.source["adapter"],
            "adapter_mode": "metadata_stub",
            "requires_manual_ingestion": True,
            "download_allowed": self.source["download_allowed"],
            "template_id": template["template_id"],
            "scenario": template["scenario"],
            "expected_evidence": template["expected_evidence"],
            "expected_guardrails": template["expected_guardrails"],
            "candidate_tasks": self.source["candidate_tasks"],
            "limitations": self.source["limitations"],
        }
