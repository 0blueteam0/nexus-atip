# INSIGHTS

- `hermes dashboard --tui` is the intended switch for exposing the browser Chat tab at `/chat`.
- On native Windows, Hermes Agent currently documents the PTY bridge as POSIX-only; `/chat` can load as an HTTP route, but the embedded TUI may display a WSL recommendation banner until Windows ConPTY support exists.
- `hermes dashboard --status` may fail to detect an already reachable web server on 9119 in this environment, so the launcher now checks the actual `/chat` HTTP route first with `curl.exe`.
- In Git Bash/MSYS, Windows `cmd.exe` batch invocations need `cmd.exe //C "..."`; plain `/c` can be interpreted path-like and drop the command.
