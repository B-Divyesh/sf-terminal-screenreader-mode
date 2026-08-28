# Terminal Screenreader Mode v0.1.0 handoff

## What shipped

- A Rust 2021 single-binary CLI named `tsrm`.
- `tsrm run -- <command>` wraps a child process and returns its exit code.
- `tsrm normalize` reads existing terminal bytes from standard input.
- ANSI controls, CR rewrites, CRLF, backspaces, spinner rows, and cursor-up rewrites are normalized.
- UTF-8 is preserved. Invalid UTF-8 is replaced without a crash.
- Headings, errors, and HTTP links receive plain transcript labels.
- Text output has UTC timestamps by default. `--json` provides JSON Lines.
- Earcons are opt-in with `--earcons`. They conflict with JSON mode to keep JSON valid.
- File output is opt-in with `--output`; no command or output is logged by default.
- `tsrm demo` runs the bundled fixture and writes to a new temporary directory.
- A Vite site documents install and usage at `/`, with `/demo`, `/privacy`, `/terms`, and designed 404 routes.
- The demo has in-memory sample state, reset controls, keyboard playback, and no storage.
- The site includes offline caching, metadata, a sitemap, security headers, and responsive art.
- Original `factory-image` art shows terminal noise resolving into transcript rows. Its source, prompt, WebP files, Open Graph image, and screenshots are recorded in the repository.

## Run and build

```sh
cargo run -- demo
cargo run -- run -- cargo test

npm ci
npm run dev
npm test
npm run build
```

The exact deploy build command is `npm ci && npm run build`. Static output lands at `dist/site`, with `index.html` at that root. The release CLI lands at `target/release/tsrm`.

To make the publishable crate without uploading it:

```sh
npm run package
```

The verified package is `terminal-screenreader-mode` v0.1.0, 67.6 KiB compressed.

## Verification completed

- `cargo test`: 11 tests passed across normalization and CLI integration.
- `cargo clippy --all-targets -- -D warnings`: passed.
- `npm test`: 47 Playwright checks passed and one desktop-only duplicate was skipped. The suite covers claims, desktop Chromium, 390 px mobile, routes, axe, console, offline, and budgets.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/verify`: HTTP 200, no console errors, one h1, a main landmark, `lang=en`, and no missing alt text.
- `cargo package --allow-dirty`: packaged and compiled successfully.
- Image budgets: 42 KiB mobile hero, 96 KiB desktop hero, and 95 KiB Open Graph art.
- Production entry assets: 4.72 KiB JavaScript gzip and 2.96 KiB CSS gzip.
- Lighthouse 13 mobile defaults: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: FCP 0.9 s, LCP 1.4 s, TBT 30 ms, CLS 0.
- Evidence: `.factory/lighthouse-summary.json`, `.factory/verify/verify.json`, `.factory/home-desktop.png`, and `.factory/home-mobile.png`.

Every public claim is listed in `.factory/claims.json` and has one tagged test. Copy and terminology are audited in `.factory/copy-audit.md`. Demo isolation is documented in `.factory/demo.md`.

## Known gaps

- The Linux worker cannot run NVDA, JAWS, or VoiceOver. Automated semantics, keyboard, axe, Unicode, and volatile-output tests pass, but manual screen-reader pilots remain the next release gate.
- Full-screen TUIs that use arbitrary cursor positioning may not form a useful linear transcript. This limitation is stated on the site and in the README.
- The crate and prebuilt binaries are ready but not published. The factory owns registry publishing and release signing.
- The generated site is dark-only by design, as recorded in `.factory/design.md`.

## Recommended next steps

1. Run the five-task pilot with NVDA, JAWS, and VoiceOver and record results against the 8-of-10 success measure.
2. Add signed Linux, macOS, and Windows binaries through the factory release workflow.
3. Add fixtures for cursor-control patterns found during the screen-reader pilot.
