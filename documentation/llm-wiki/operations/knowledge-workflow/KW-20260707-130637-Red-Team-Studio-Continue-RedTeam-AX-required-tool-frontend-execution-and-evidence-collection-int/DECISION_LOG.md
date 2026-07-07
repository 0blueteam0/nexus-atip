# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Use official release binary for Nuclei | Go was unavailable; official release binary is practical and traceable | Nuclei installed under project portable tools path |
| Do not commit Nuclei binary | Binary is an environment artifact and could bloat/source-control risk | Code searches for it, but repository stores only source contracts |
| Pin Nuclei expected SHA-256 in ToolProfile | Enables wrapper manifest hash_match without relying on mutable PATH | Future Nuclei updates require explicit hash rotation |
| Keep Nuclei `requires_human_approval=true` | T3 web validation can affect real targets | Frontend remains `승인 요청`, not direct scan execution |
| Add portable tool discovery | Required tools may be installed under project-local folders on Windows | `command_availability` can find `고도화/tools/<tool>/<tool>.exe` |
