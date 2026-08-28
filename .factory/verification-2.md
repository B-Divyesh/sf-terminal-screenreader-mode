# Independent product verification 2

## Verdict: FAIL

- Candidate: `e8f7959f121b704806202bf57e66ffd1c3273828`
- Live URL: <https://terminal-screenreader-mode.sociobot.in>
- Verified: 28 August 2026 UTC
- Work order: `terminal-screenreader-mode-verify-2`

The repaired candidate passes the automated, packaging, live-site, claim, and
first-screen checks below. It is still not releasable under the researched
brief because there is no evidence of the required NVDA, JAWS, and VoiceOver
compatibility testing. The site itself says those pilots are the next release
gate. Automated browser accessibility checks cannot substitute for the stated
assistive-technology validation.

## Release-blocking finding

### High — V2-01: required screen-reader compatibility testing is absent

The brief requires testing with NVDA, JAWS, VoiceOver, and common shells for a
tool whose core value is stable screen-reader output. No test record, pilot
result, or compatibility matrix is shipped. `.factory/handoff.md` and the
live landing page expressly describe those pilots as still pending. This
blocks acceptance until the three screen readers are tested against the
documented sample and representative wrapped commands, with results recorded.

## First-read and demo gate — PASS

A cold live load answers all three mandatory questions in plain words:

- **What:** “Read streaming commands without losing your place.”
- **For whom:** “For screen-reader users...”
- **First click:** **Try it with sample data**, with the adjacent outcome “See
  a noisy build become six stable lines.”

At 1440×900 the summary ends at y=566 px, the action at y=634 px, and the
three facts at y=689 px. At 390×844 they end at y=534, 643, and 775 px. The
one-click `/demo` opens the bundled six-line recording and its persistent
banner reads “Demo — sample data, nothing is saved,” with Reset demo and Start
for real controls.

## Mandatory claims gate — PASS

After clean `npm ci` (23 packages, zero audit vulnerabilities), every exact
command declared in `.factory/claims.json` completed separately with status
zero. The final marker is `ALL_CLAIMS_PASS` in
`/tmp/tsrm-claim-gate-verify2.log`.

| Claim IDs (each run as `npm test -- --grep @claim:<id>`) | Result |
| --- | --- |
| stable-rewrites, local-default, ansi-links, json-lines, exit-code | PASS |
| unicode-safe, semantic-labels, output-file, earcons-off, timestamped | PASS |
| demo-sandbox, mit-free, offline-docs, keyboard-recording, rust-version | PASS |

The tests use the release binary and bundled fixture for CLI claims. The
privacy claim uses an isolated HOME/TMPDIR/work directory and an `LD_PRELOAD`
socket/connect/sendto monitor. The offline claim checks service-worker cache
contents and reloads the demo offline.

## Local build, package, and CLI — PASS

- `npm test`: Rust unit/integration suite plus the Playwright suite completed
  successfully (54 browser tests across Chromium and 390 px mobile projects;
  project-specific skips are expected).
- `npm run build`: PASS; `dist/site` and `target/release/tsrm` produced.
  Entry JavaScript is 12.82 kB (4.67 kB gzip); CSS is 10.29 kB (3.00 kB gzip).
- `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features --
  -D warnings`, a direct TypeScript no-emit check, and `npm audit
  --audit-level=high`: PASS.
- `npm run package`: PASS. The crate has 11 intended files and is 13.7 kB
  compressed.
- Clean-consumer installation from
  `target/package/terminal-screenreader-mode-0.1.0`: PASS. Installed `tsrm`
  reported 0.1.0, ran its demo, and normalized a JSON heading record.

Independent CLI exercises passed: ANSI/carriage-return normalization, heading,
error and link labels, Unicode and malformed UTF-8 recovery, JSON Lines,
opt-in earcons, wrapped exit status 7, 1 MiB input, no-output status, and
clear exit-2 recovery messages for an unwritable output parent and conflicting
`--earcons --json`. A wrapped command that writes a line, sleeps one second,
then writes another released the first record in 107 ms.

## Live deployment, privacy, accessibility, and PWA — PASS

- Deployment identity: local `dist/site` and live content hashes match for
  index, demo/privacy/terms, 404, worker, JS, CSS, images, favicon, robots,
  and sitemap. `staticwebapp.config.json` is deployment configuration and is
  not exposed as a public static asset; live behavior confirms its rules.
- `/`, `/demo`, `/privacy`, and `/terms` return 200; an unknown path returns
  a real 404. Hashed JS and CSS return `Cache-Control: public,
  max-age=31536000, immutable`; the worker returns `no-cache`.
- A fresh service-worker context cached HTML routes, 404 assets, both hero
  assets, favicon, and the exact hashed JS/CSS. `/demo` then reloaded offline
  with its h1 and no console errors. The worker uses `skipWaiting` and deletes
  prior named caches on activation.
- Live desktop and 390 px checks found no horizontal overflow and no visible
  interactive target under 44×44 px. Keyboard Tab reaches the skip link,
  Enter moves focus to `main`, route changes focus the h1, and recording
  controls work with Enter. The focus ring is visible. Reduced motion gives
  0.00001-second animation/transition durations.
- Axe 4.10.2 found zero serious or critical violations on live home and demo
  at both viewports. Each checked page has `lang=en`, one h1, one main,
  meaningful image alt, and no normal-flow console/page errors.
- Fresh demo browsing observed only same-origin requests; local/session
  storage and cookies were empty, and no form, third-party script, analytics,
  sign-in, payment, or API call exists. HTTPS supplies HSTS, CSP,
  `nosniff`, Referrer-Policy, and Permissions-Policy. This static product has
  no server-side endpoint, so rate-limit and Entra checks are not applicable.

## Required next step

Run and record NVDA, JAWS, and VoiceOver tests with the sample fixture and
common-shell wrapped commands (including rewrites, ANSI, errors, links,
Unicode, and earcons off/on). Re-submit after that evidence is added.
