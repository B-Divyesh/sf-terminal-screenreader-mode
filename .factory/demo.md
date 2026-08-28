# Demo sandbox

## Entry points

- Site: `https://terminal-screenreader-mode.sociobot.in/demo`
- Local site: `http://localhost:5173/demo`
- CLI: `tsrm demo` or `cargo run -- demo`

## Sample

`examples/noisy-build.events` represents a six-second build. It contains three carriage-return progress frames, two ANSI-colored lines, one heading, a result, and one web link. The browser recording is the verified output of this same fixture.

## Isolation and reset

The CLI embeds the sample at compile time. Each run creates a new `tsrm-demo-<process>-<nonce>` directory under the operating system's temporary directory and writes only `transcript.txt` there. It prints the exact path to standard error.

The web demo has no persistence. It does not use localStorage, sessionStorage, IndexedDB, cookies, or a backend. Its isolated namespace is in-memory page state. “Reset demo” clears that state, and “Start for real” opens local install instructions.

## Verification

Run `npm test -- --grep @claim:demo-sandbox`. The test starts the release binary, verifies the path is under the system temporary directory, and checks that the saved transcript matches standard output.
