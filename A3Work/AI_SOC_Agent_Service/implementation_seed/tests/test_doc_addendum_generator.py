import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from doc_addendum_generator import (
    build_test_matrix_rows,
    build_technical_design_sections,
    write_addendum_markdown,
    write_docx_from_markdown,
)


class DocAddendumGeneratorTest(unittest.TestCase):
    def setUp(self):
        self.case_spec_plan = json.loads((ROOT / 'reports' / 'dataset_case_spec_plan_v0.json').read_text(encoding='utf-8'))
        self.replay_metrics = json.loads((ROOT / 'reports' / 'replay_metrics_v1.json').read_text(encoding='utf-8'))

    def test_should_build_test_matrix_rows_from_case_spec_plan(self):
        rows = build_test_matrix_rows(self.case_spec_plan, self.replay_metrics)

        self.assertGreaterEqual(len(rows), 8)
        self.assertTrue(all('test_id' in row for row in rows))
        self.assertTrue(any(row['source_id'] == 'otrf-security-datasets' for row in rows))
        self.assertTrue(any(row['test_category'] == 'download_guardrail' for row in rows))
        self.assertTrue(all(row['automation_level'] in {'unit', 'replay', 'manual_review'} for row in rows))

    def test_should_build_technical_design_sections(self):
        sections = build_technical_design_sections(self.case_spec_plan, self.replay_metrics)

        self.assertIn('components', sections)
        self.assertIn('data_flow', sections)
        self.assertIn('api_contracts', sections)
        self.assertTrue(any(component['name'] == 'DatasetRegistry' for component in sections['components']))
        self.assertTrue(any(flow['from'] == 'Dataset Manifest' for flow in sections['data_flow']))

    def test_should_write_markdown_addendum_files(self):
        rows = build_test_matrix_rows(self.case_spec_plan, self.replay_metrics)
        sections = build_technical_design_sections(self.case_spec_plan, self.replay_metrics)
        with tempfile.TemporaryDirectory() as temp_dir:
            out_dir = Path(temp_dir)
            paths = write_addendum_markdown(rows, sections, out_dir)
            test_md = paths['test_matrix']
            tech_md = paths['technical_design']

            self.assertTrue(test_md.exists())
            self.assertTrue(tech_md.exists())
            self.assertIn('14. 테스트 케이스 보강 매트릭스', test_md.read_text(encoding='utf-8'))
            self.assertIn('20. 기술스택 및 상세설계 보강', tech_md.read_text(encoding='utf-8'))

    def test_should_write_docx_from_markdown(self):
        rows = build_test_matrix_rows(self.case_spec_plan, self.replay_metrics)
        sections = build_technical_design_sections(self.case_spec_plan, self.replay_metrics)
        with tempfile.TemporaryDirectory() as temp_dir:
            out_dir = Path(temp_dir)
            paths = write_addendum_markdown(rows, sections, out_dir)
            docx_path = out_dir / 'test_matrix.docx'
            write_docx_from_markdown(paths['test_matrix'], docx_path)

            self.assertTrue(docx_path.exists())
            self.assertGreater(docx_path.stat().st_size, 1000)


if __name__ == '__main__':
    unittest.main()
