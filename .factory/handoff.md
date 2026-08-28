# Repair handoff — Terminal Screenreader Mode v0.1.0

## Release repair

This repair addresses every finding in independent verification `b9ffe8116c68d449cfcb3935e537df659ec648e9` for candidate `e51402111095ccb0488a1fa0dff462734e7b0345` while retaining the Rust `tsrm` CLI and static Vite documentation site.

- **QA-01:** The desktop hero now uses an even two-column grid, a smaller 72 px maximum heading, and tighter vertical rhythm. A Chromium 1440×900 regression asserts that the audience sentence, demo action, and facts all end within the viewport.
- **QA-02:** `tsrm run` now releases a completed record after a 100 ms stabilization window instead of waiting indefinitely for more child output. Immediate carriage-return and cursor rewrites remain suppressed. A Rust integration test reads the first line from a child that sleeps for one second and requires it within 700 ms.
- **QA-03:** The wordmark, text links, and footer links now have 44×44 px minimum targets. The browser suite measures every visible link, button, and focusable target at both desktop and 390 px.
- **QA-04:** The privacy claim test runs the CLI with isolated HOME, TMPDIR, and working directories and an `LD_PRELOAD` monitor for `socket`, `connect`, and `sendto`; it asserts no writes or network calls. The demo claim asserts the only sandbox output is `transcript.txt` in a fresh TMPDIR. Unsupported privacy wording was removed, and the Rust-minimum claim now has a tagged test.
- **QA-05:** The build generates a versioned service worker containing the exact hashed JavaScript and CSS paths, all routes, and shell art. Cache matching ignores response `Vary` headers so a service-worker cache works even when a static preview adds `Vary: Origin`. The claim reloads offline after one visit without an online reload and asserts both hashed assets exist in Cache Storage.
- **QA-06 / QA-07:** The static build emits real `/demo`, `/privacy`, and `/terms` documents. Static Web Apps rewrites only these known routes, sends unknown paths through the designed 404 response override, and gives `/assets/*` immutable one-year caching.
- **QA-08:** Anchored Cargo include paths now produce a crate with 11 intended files; `node_modules` documentation is excluded.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run package
```

The production site is written to `dist/site`; the release CLI is `target/release/tsrm`. The publishable crate is intentionally not uploaded by this repository.

## Verification evidence (28 August 2026 UTC)

- Clean `npm ci`: 23 audited packages, zero vulnerabilities.
- `npm test`: passed — 12 Rust tests (8 unit + 4 CLI integration) and 52 Playwright tests, with 2 expected desktop/mobile-only skips. This includes all 15 exact claim commands, keyboard controls, route focus, console checks, axe serious/critical checks, desktop first-read geometry, 390 px overflow, target size, privacy isolation, and Cache Storage-only offline reload.
- `npm run build`: passed; final entry JavaScript is 4.67 KiB gzip and CSS is 3.00 KiB gzip.
- `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, TypeScript source check, and `npm audit --audit-level=high`: passed.
- `cargo package --allow-dirty`: passed and verified. The archive contains 11 files (source, tests, fixture, manifest, README, CHANGELOG, and MIT license), not `node_modules`.
- Clean consumer install from `target/package/terminal-screenreader-mode-0.1.0`: passed. `tsrm --version` printed `0.1.0`; `tsrm demo --no-timestamps` printed the six expected stable records.
- `verify-url.sh` against the local production preview: HTTP 200, 547 ms load, no console errors, `lang=en`, one `h1`, `main`, zero missing image alt text, and zero unlabelled buttons. Evidence: `.factory/verify-repair/verify.json`.
- Local Lighthouse 13.4.1 mobile run: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 987 ms, LCP 1365 ms, CLS 0. The report is `.factory/lighthouse-repair.json`. Chrome reported a tab crash during final screenshot teardown after writing the scored JSON report.

## Deployment

Static deployment remains the original class. Repair commit `ac06c79` was pushed to `origin/main` on 28 August 2026 UTC, which is the available static deployment trigger. At the final worker check, `https://terminal-screenreader-mode.sociobot.in` still served the former index hash `2ae4302a54e4734fa92f23ae74fbb87284fde1b9730b3294642233efae465131` (including the prior 200 soft-404); the new local index hash is `aee1bcd4621b249aa6fdb61ff8cb1902db0f480b8b345e2103a9db97d0290d7e`. The source repair is committed and pushed; the external static deployment has not propagated within this worker's verification window.

The deployment configuration in `dist/site/staticwebapp.config.json` supplies known-route rewrites, the 404 response override, security policy, and immutable asset caching when the static host picks up the pushed commit.

## Known gap

Automated semantics, keyboard behavior, axe, Unicode, and volatile-output coverage pass. NVDA, JAWS, and VoiceOver pilot sessions still require real assistive-technology users outside this Linux worker.
