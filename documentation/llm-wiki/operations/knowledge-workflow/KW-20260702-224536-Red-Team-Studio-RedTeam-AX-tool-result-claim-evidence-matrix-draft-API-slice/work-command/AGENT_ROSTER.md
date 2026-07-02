# Agent Roster

## Active Agent

- Codex: implementation, test execution, documentation update, git push preparation.

## Referenced Skill

- ChatShare Artifact Lab: used because the user explicitly named it and the RedTeam AX LLM Wiki already links the extracted ChatGPT share package.

## System Actors In Product Flow

- Analyst: requests promotion and reviews Matrix draft rows.
- Red team lead: approves Evidence and Finding severity.
- Business owner: second Finding severity approver.
- Report agent: may draft report only after report validation payload is ready.

## Handoff Target

Next Claude/Codex worker should continue from the Matrix draft API and not repeat ChatShare extraction unless the source share changes.
