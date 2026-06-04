# Tooling

Tools used:
- skill_view for Hermes/writing-plans/subagent-driven-development context.
- read_file/search_files for repository inspection.
- write_file/patch/execute_code for scoped edits.
- terminal for unittest, py_compile, artifact generation, git inspection, and knowledge workflow close.

Commands verified:
- python -m unittest implementation_seed.tests.test_agent_module_catalog -v
- python -m unittest implementation_seed.tests.test_langgraph_agent_composition -v
- python implementation_seed/scripts/agent_module_catalog.py > implementation_seed/reports/agent_module_catalog.stdout.json
- python implementation_seed/scripts/langgraph_agent_composition.py > implementation_seed/reports/langgraph_agent_composition.stdout.json
- python -m py_compile implementation_seed/scripts/*.py implementation_seed/tests/*.py
- python -m unittest discover -s implementation_seed/tests -v
