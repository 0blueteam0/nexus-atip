# Scope

project: AI_SOC_Agent_Service
task: Continue public dataset metadata spec #2 and AI security monitoring agent execution plan #2

in_scope:
- Extend public dataset manifest metadata contract without downloading public data.
- Add tests for metadata spec #2 access/raw/normalization/evaluation fields.
- Generate metadata spec v2 report.
- Generate AI security monitoring agent execution plan #2 markdown/docx/summary artifacts.
- Verify with unit tests, py_compile, report/docx structural checks.

out_of_scope:
- Public dataset download, crawl, or raw parser implementation.
- Production SIEM/EDR/SOAR/IAM/CMDB connection.
- Autonomous response actions such as account lockout, host isolation, firewall block, or customer notification.
