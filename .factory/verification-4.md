# Independent verification 4 — FAIL

**Candidate:** `5aa64e3a98fb31926a844f6f247134701658a0a3`  
**Live URL:** https://terminal-screenreader-mode.sociobot.in  
**Verified:** 28 August 2026 UTC  
**Scope:** clean-checkout CLI/package and deployed docs/demo verification. No product source was changed.

## Release decision

**FAIL.** Two release-blocking acceptance requirements remain unmet:

1. The exact full test command, `npm test`, fails its checked-in mobile responsiveness quality gate. A three-repeat reproduction failed all three Chromium executions: total blocking time was **797 ms, 804 ms, and 868 ms** against the test's required **<300 ms**. A prior fresh `npm test` also failed the same case at **411 ms**. The failing test is `site/tests/site.spec.ts:106`, “mobile rendering stays inside Lighthouse-class responsiveness budgets.” This violates the factory requirement that quality gates pass locally; it is not safe to treat the performance check as passing.
2. The required named assistive-technology pilot has not been done. `.factory/compatibility.md` records that no NVDA, JAWS, or VoiceOver user pilot was performed and explicitly calls this a release blocker. The brief requires testing with all three. Linux browser accessibility automation and shell tests are useful but cannot establish speech-reader compatibility.

## Blocking defects

### High — QA-01: Full test suite fails the mobile performance gate

Fresh `npm test` ran the Rust tests, release build, and Playwright suite but ended failed. `npx playwright test --last-failed` reproduced the sole failed test with TBT **411 ms**. A further independent command:

```sh
npx playwright test site/tests/site.spec.ts \
  -g 'mobile rendering stays inside Lighthouse-class responsiveness budgets' \
  --repeat-each=3
```

failed all three Chromium executions at 797 ms, 804 ms, and 868 ms (the mobile project legitimately skips this Chromium-only test). The test applies 4x CPU throttling at 390 x 844 and requires LCP <2,500 ms, TBT <300 ms, and CLS <0.1; the reported failure in every case is TBT. Preserve a stable, calibrated performance measurement and make the production path meet its stated budget before release.

### High — QA-02: NVDA, JAWS, and VoiceOver acceptance pilot is missing

The repository's compatibility record says the only available environment is Linux and that no pilot was performed. It gives the required protocol: run the packed binary in the named terminal/shell combinations; verify six records once and in order, 30 alternating-stream runs, and a delayed second line; then record reader, terminal, shell, OS, operator, and result. Complete that protocol on the supported systems and add the evidence. Do not fabricate a screen-reader result.

## Required claims — PASS

`.factory/claims.json` exists and declares 16 claims. From this clean checkout I ran every command in it, individually and in order, before any product inspection. Each command uses the release build and the shipped demo/fixture path and completed successfully:

| Passed claim IDs |
| --- |
| `stable-rewrites`, `local-default`, `ansi-links`, `json-lines` |
| `exit-code`, `ordered-streams`, `unicode-safe`, `semantic-labels` |
| `output-file`, `earcons-off`, `timestamped`, `demo-sandbox` |
| `mit-free`, `offline-docs`, `keyboard-recording`, `rust-version` |

There is no missing claim file and no failed claim test. The later ungated suite failure is QA-01, not a claim-test failure.

## First read and demo — PASS

In a fresh browser context, cold live `/` says: “Read streaming commands without losing your place.” It identifies “screen-reader users,” says `tsrm` turns changing terminal output into stable lines, and presents the first action **Try it with sample data** with the outcome “See a noisy build become six stable lines.” One activation reaches `/demo`, which immediately shows six realistic transcript records and the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real. This meets the plain-word first-screen and one-click demo contract.

## Local build, package, and CLI — PASS except QA-01

- `npm ci` installed 23 packages; `npm audit --audit-level=high` reported zero vulnerabilities.
- `npm run build` passed and produced `target/release/tsrm` and `dist/site`. The entry JavaScript is 12,980 bytes (4,690 gzip), CSS 10,405 bytes (3,010 gzip), all well within the static bundle budgets.
- `npm run lint` passed: Rust formatting, Clippy with warnings denied, and `tsc --noEmit`.
- `npm run package` passed: Cargo packaged and verified 11 files, 45.7 KiB uncompressed / 14.2 KiB compressed.
- `npm test` **failed solely on QA-01**. Before that failure, its 8 library tests and 6 CLI integration tests passed; all tagged claims had already passed independently.
- I unpacked `terminal-screenreader-mode-0.1.0.crate` into a new temporary consumer, installed it using an isolated `CARGO_HOME`, and used the public `tsrm` binary. `--help` and `--version` worked; `demo --no-timestamps` emitted the expected six records; ANSI plus Unicode input normalized safely; a URL became a separate link record; `--json` emitted a parseable heading; a wrapped command returned exit 7; conflicting `--json --earcons` and an output path that names a directory returned exit 2 with actionable errors.

## Live deployment, accessibility, privacy, and resilience — PASS

- **Candidate identity:** freshly built `index.html`, JS, CSS, and `sw.js` SHA-256 values exactly match the live bytes:

  ```text
  index.html                  be891b0368ebcb86bf5f90ac5b3f067e69a0d2364f48b8848d6ac658eb78febb
  assets/index-DcRRykEU.js    1d13d3c4cd727c3395b4a80130c6b75624588833ac1a845482c3e15cc71bd908
  assets/index-CQwj0BrN.css   92ce53ba91af09df19f376ed181a35c9b2f132d29413fee462c356e4e972c542
  sw.js                       63f36089d7e528a4cfffe0eba9c99236daa998af6fc3d3a15a8a6402864a5c02
  ```

- **Routes and links:** `/`, `/demo`, `/privacy`, and `/terms` returned 200; an unknown URL returned the designed 404 with HTTP 404. Every discovered non-mailto link, including the GitHub and factory links, returned 200.
- **Axe and page errors:** fresh desktop (1440 x 900) and mobile (390 x 844) contexts had one `h1`, one `main`, correct route titles, and zero axe serious or critical violations on home, demo, privacy, terms, and 404. After keyboard starting the demo, I froze each of the six entering rows at the 110 ms animation midpoint; every row remained opacity 1 and had zero serious or critical violations. No console or page errors occurred.
- **Keyboard/mobile/motion:** visible controls were at least 44 px; neither viewport had horizontal overflow. Focus had a designed 3 px `#6fffb0` outline with 3 px offset. Keyboard activation operated Play/Clear. With reduced motion, Play made all six records visible immediately.
- **Privacy:** the full live demo flow made only same-origin requests. Fresh desktop and mobile contexts had zero cookies, localStorage entries, and sessionStorage entries. There are no forms, analytics, third-party scripts, account, payment, unlock, or product API calls. Consequently there is no server-side endpoint or documented request allowance on which a 429 / `Retry-After` test applies, and no sign-in/Entra flow to test.
- **Headers and cache:** live HTML supplies restrictive self-only CSP, HSTS, `X-Content-Type-Options: nosniff`, strict referrer policy, and restrictive permissions policy. Hashed assets are one-year immutable; `sw.js` is `no-cache`. The installed worker is `tsrm-site-v4`; it uses `skipWaiting`, `clients.claim`, and deletes old named caches on activation. After activation I set the context offline, reloaded `/demo`, then navigated to `/privacy`; the privacy page rendered successfully without failed requests. This verifies offline reload and the candidate's update mechanism; a distinct newer production worker was not available to test a cross-release update.

## Required remediation

1. Fix or replace the flaky/over-budget checked-in performance test so the exact `npm test` quality gate passes reliably while still measuring a meaningful production performance budget; then re-run it cleanly.
2. Perform and document the named NVDA, JAWS, and VoiceOver pilot against the packed release binary.
3. Re-run all claim commands, the complete test/lint/build/package sequence, fresh-consumer CLI exercise, and deployed browser QA against the repaired commit.
