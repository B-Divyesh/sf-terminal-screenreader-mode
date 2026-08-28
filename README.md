# Terminal Screenreader Mode

Turn changing terminal output into a stable transcript.

`tsrm` is a local command wrapper for blind and low-vision developers. It removes ANSI control codes, replaces rewritten lines, labels headings and links, and keeps Unicode intact. It does not send or save command output unless you ask for a file.

## Try the bundled demo

```sh
cargo run -- demo
```

The demo reads [`examples/noisy-build.events`](examples/noisy-build.events), writes its transcript to a new temporary directory, and prints that path. It does not read or write your working files.

The same demo appears at <https://terminal-screenreader-mode.sociobot.in/demo>.

## Install

Build the single binary with Rust 1.85 or newer:

```sh
cargo install --path .
```

The package is ready for the registry but is not published by this repository.

## Wrap a command

```sh
tsrm run -- npm test
```

Each stable line is printed once with a UTC timestamp and a plain type label. Carriage-return updates replace the pending line instead of producing repeated speech.

```text
12:04:08Z | heading | Test results
12:04:08Z | text    | 18 passed
12:04:08Z | link    | https://example.test/report
```

The wrapper returns the command's exit code. It writes no transcript file by default.

### Useful options

```sh
# Save the same transcript that is printed.
tsrm run --output build.transcript -- cargo build

# Emit one JSON object per stable line.
tsrm run --json -- cargo test

# Play a short bell before headings and errors.
tsrm run --earcons -- cargo test

# Normalize existing piped output.
some-command 2>&1 | tsrm normalize
```

Earcons are off by default. Use `--no-timestamps` for deterministic output. Run `tsrm --help` or `tsrm run --help` for every option.

## Output rules

- ANSI styling and cursor control are removed.
- Each carriage return replaces the current pending line.
- Spinner-only lines are dropped.
- Markdown-style headings and short lines ending in a colon are labeled `heading`.
- Errors are labeled `error`.
- Web links are repeated as separate `link` records.
- Invalid UTF-8 is replaced safely instead of crashing.

This is a normalization layer, not a terminal emulator or speech engine. Full-screen interactive programs may not produce a useful linear transcript.

## Develop and verify

```sh
cargo test
npm install
npm test
npm run build
```

`npm run build` creates the static docs site in `dist/site`. `cargo build --release` creates the CLI in `target/release/tsrm`. Run `npm run package` to produce the publishable Rust crate without uploading it.

## Privacy

The CLI makes no network request and saves no transcript unless you pass `--output`. The docs use no forms or third-party scripts. See [Privacy](https://terminal-screenreader-mode.sociobot.in/privacy) and [Terms](https://terminal-screenreader-mode.sociobot.in/terms).

## License

MIT. See [LICENSE](LICENSE).
