# Scope

- project: insurance-fds-model-training-data
- task: Revise four-case insurance FDS taxonomy into user-defined five-case taxonomy.
- updated_at: 2026-06-07T22:17:33

## User requirements reflected

1. Base: FDS must know what insurance claim documents/photos are submitted and how to distinguish normal vs abnormal/tampered submissions.
2. Case 1: collect normal Korean insurance claim documents/photos and define scope.
3. Case 2: research traditional editing tools and real tamper case-study patterns, then build editor-style tamper cases.
4. Case 3: use AI/coding tools to locally tamper Case 1 collected documents.
5. Case 4: keep real/official grounded GenAI tamper bundle generation.
6. Case 5: use LLM/coding tools to generate new documents from fields/layouts learned from Case 1 only.
7. Visible document fields must be Korean.
8. Directory and filenames must show case identity explicitly.
9. Avoid LLM-only strategy and image shortcut artifacts.
