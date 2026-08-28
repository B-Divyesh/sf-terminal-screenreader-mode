# Assistive-technology compatibility record

## Automated evidence — 28 August 2026

The release suite wraps the same ANSI-colored stdout/error fixture through GNU
Bash and Dash. Both must produce the same newline-delimited UTF-8 transcript,
with the error in source write order and no ANSI or cursor controls. A separate
latency test reads the first complete record before a quiet child writes again.
The ordering regression repeats an alternating stdout/stderr command 100 times.

Run these checks with:

```sh
cargo test --test cli
```

These tests establish the stream contract used by terminal screen readers.
They do not substitute for a user pilot with a speech engine.

## Named screen-reader pilot status

NVDA, JAWS, and VoiceOver cannot run in this Linux worker. No user pilot was
performed, and this record does not claim otherwise. Before publishing the CLI
package, run the following protocol on Windows and macOS with the release
binary from the packed crate:

1. Run `tsrm demo --no-timestamps` in PowerShell, Command Prompt, and Terminal.
2. Read continuously with NVDA, JAWS, then VoiceOver.
3. Confirm six records are spoken once, in printed order, with no spinner frames.
4. Run the alternating stdout/stderr fixture from `.factory/verification-2.md`.
5. Confirm the four records are spoken in source write order on 30 runs.
6. Run a child that pauses one second between lines and confirm the first line is
   available before the second write.
7. Record screen reader, terminal, shell, OS versions, operator, and outcome here.
