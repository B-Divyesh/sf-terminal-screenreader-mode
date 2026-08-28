# Independent product verification

## Verdict: FAIL

- Candidate: `e51402111095ccb0488a1fa0dff462734e7b0345`
- Live URL: <https://terminal-screenreader-mode.sociobot.in>
- Verified: 28 August 2026 UTC
- Work order: `terminal-screenreader-mode-verify-1`

The deployed files match the candidate, the build and automated suites pass, and the CLI works in a clean consumer. Release is nevertheless blocked by the mandatory first-screen gate and by product/accessibility defects listed below.

## First-read test

Cold-read interpretation: Terminal Screenreader Mode is a local CLI wrapper for screen-reader users. It changes volatile terminal output into stable lines. The intended first action is **Try it with sample data**, which opens a realistic six-line demo in one click.

Result: **FAIL on desktop; pass at 390 px mobile.** At 1440×900, the h1 occupies `y=182.2–786.9`, the audience sentence ends at `y=918.6`, and the primary action begins at `y=946.6`. The action and most of the explanation are below the first viewport. At 390×844, the h1, audience sentence, action, and three facts all fit (`facts bottom=795.1`). The acceptance contract says failure at this gate fails the candidate.

Evidence: [desktop cold-load screenshot](qa-evidence/live-first-read-desktop.png) and [browser measurements](qa-evidence/live-browser-qa.json).

## Release-blocking findings

### High — QA-01: Desktop first screen hides the required action

The first screen does not show what to click first at a common 1440×900 desktop viewport. The action is 46.6 px below the fold. This directly fails the mandatory plain-words/demo gate.

### High — QA-02: Complete lines are not emitted as they arrive

The wrapper always holds the newest newline-terminated record until another byte arrives or the process ends. A child that prints `phase one`, waits two seconds, then prints `phase two` produced both records at `2.019 s`; no first record was available during the wait. A long-running command can therefore appear silent for an unbounded period, which undermines the core streaming-output job.

Evidence: [stream latency](qa-evidence/stream-latency.txt).

### High — QA-03: Interactive link targets violate the 44 px minimum

Independent desktop and 390 px measurements found five visible interactive targets under 44 px high: the 32 px home wordmark, the 19–20 px source link, and three 22.4 px footer links. Keyboard focus is visible and axe reports no serious/critical issues, but the product-specific accessibility contract requires every interactive target to be at least 44×44 CSS px.

Evidence: `touchTargetsBelow44` in [browser measurements](qa-evidence/live-browser-qa.json).

### High — QA-04: Privacy/isolation claim tests do not prove their stated outcomes

All listed claim commands return zero, but two tests do not meet the claims contract:

- `local-default` says the CLI makes no network request, yet its CLI assertion observes only files in the temporary working directory. It does not observe network calls or writes elsewhere.
- `demo-sandbox` confirms the reported transcript is under the system temp directory and matches stdout, but does not assert that this is the only file written.

There are also public claim-like statements without direct observable tests, including “It reads no personal files,” “no telemetry,” “no background service,” and “Build with Rust 1.85 or newer.” The code/dependency review found no CLI network implementation, but the required claim tests themselves do not establish the promises.

### High — QA-05: The service worker does not precache a complete offline shell

The `tsrm-site-v1` cache contains HTML routes, the favicon, and the mobile hero, but not the hashed JavaScript or CSS. An ordinary first-visit offline reload happened to pass through browser HTTP cache. After clearing only HTTP cache while retaining service-worker Cache Storage, `/demo` reloaded blank: h1 count 0, CSS was returned as `text/html`, and the module script failed MIME checking. The current claim test masks this by performing an additional online reload before going offline.

Evidence: [service-worker cache contents](qa-evidence/service-worker-live.json), [first-visit result](qa-evidence/offline-first-visit-live.json), and [Cache Storage-only failure](qa-evidence/offline-cache-storage-only-live.json).

## Other findings

### Medium — QA-06: Unknown routes return HTTP 200

`/does-not-exist` renders the designed not-found page but responds `200`, not `404`. This is a soft 404 and does not meet the real-404 route requirement.

### Medium — QA-07: Hashed assets are not cached immutably

The HTML, hashed JS/CSS, images, and service worker all return `Cache-Control: public, must-revalidate, max-age=30`. Hashed assets should receive long-lived immutable caching; the current policy discards that performance benefit.

Evidence: [header matrix](qa-evidence/header-matrix.txt).

### Low — QA-08: The publishable crate contains `node_modules` documentation

`cargo package` succeeds, but 37 of its 48 entries are nested `node_modules` README/LICENSE files. The crate still installs and is only 67.6 KiB compressed, but the `include` patterns are not scoped tightly enough for a clean release artifact.

Evidence: [crate contents](qa-evidence/crate-contents.txt).

## Claims gate

The first attempt before dependency installation stopped in the first command because `vite` was absent. After the documented `npm ci` prerequisite, every exact command from `.factory/claims.json` was run separately from the clean candidate checkout. Each passed in both configured browser projects:

| Claim | Exact command | Result |
| --- | --- | --- |
| `stable-rewrites` | `npm test -- --grep @claim:stable-rewrites` | PASS, 2 tests |
| `local-default` | `npm test -- --grep @claim:local-default` | PASS, 2 tests; adequacy finding QA-04 |
| `ansi-links` | `npm test -- --grep @claim:ansi-links` | PASS, 2 tests |
| `json-lines` | `npm test -- --grep @claim:json-lines` | PASS, 2 tests |
| `exit-code` | `npm test -- --grep @claim:exit-code` | PASS, 2 tests |
| `unicode-safe` | `npm test -- --grep @claim:unicode-safe` | PASS, 2 tests |
| `semantic-labels` | `npm test -- --grep @claim:semantic-labels` | PASS, 2 tests |
| `output-file` | `npm test -- --grep @claim:output-file` | PASS, 2 tests |
| `earcons-off` | `npm test -- --grep @claim:earcons-off` | PASS, 2 tests |
| `timestamped` | `npm test -- --grep @claim:timestamped` | PASS, 2 tests |
| `demo-sandbox` | `npm test -- --grep @claim:demo-sandbox` | PASS, 2 tests; adequacy finding QA-04 |
| `mit-free` | `npm test -- --grep @claim:mit-free` | PASS, 2 tests |
| `offline-docs` | `npm test -- --grep @claim:offline-docs` | PASS, 2 tests; robustness finding QA-05 |
| `keyboard-recording` | `npm test -- --grep @claim:keyboard-recording` | PASS, 2 tests |

The exact commands rebuild and rerun the common Rust suite each time. The consolidated output is also present in [npm test evidence](qa-evidence/npm-test.txt).

## Build and package verification

- `npm ci`: PASS, 23 packages, zero vulnerabilities.
- `npm test`: PASS, 11 Rust tests plus 47 Playwright tests; 1 expected desktop-project skip.
- `npm run build`: PASS; produced `dist/site` and `target/release/tsrm`.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- Independent TypeScript check with ES2022, DOM, and DOM.Iterable libs: PASS.
- `npm audit --audit-level=high`: PASS, zero vulnerabilities.
- `cargo package --allow-dirty`: PASS and compiled the packaged crate.
- Clean consumer install from the packaged crate: PASS. `--help`, `--version`, demo, ANSI/CR normalization, Unicode, invalid UTF-8, empty input, 1 MiB input, JSON Lines, explicit output errors and recovery, missing command, option conflict, stdout/stderr, and exit status 7 behaved correctly.
- Concurrency: 20 parallel demo runs created 20 unique transcript paths; every output matched its transcript.

Evidence: [installed CLI](qa-evidence/installed-cli.txt), [concurrency](qa-evidence/cli-concurrency.txt), and [package output](qa-evidence/cargo-package.txt).

## Live deployment, accessibility, privacy, and performance

- Deployment identity: PASS. `index.html`, hashed JS/CSS, service worker, 404, robots, sitemap, favicon, images, and touch icon are byte-for-byte matches to the candidate build. `staticwebapp.config.json` correctly returns 404 because it is deployment configuration, not a public asset.
- Desktop and 390 px mobile: no horizontal overflow; responsive layout otherwise works.
- Keyboard: logical tab order, working skip link and controls, no trap, and a visible 3 px mint focus outline with 3 px offset.
- Reduced motion: all six demo lines appear immediately; computed animation duration is `0.00001 s`.
- Axe 4.10.2: zero serious/critical findings on live home and demo in both viewports. Local route suite also covers home, demo, privacy, terms, and not-found pages.
- Semantics: `lang=en`, one h1, one main landmark, titled routes, labelled buttons, useful image alt, and route focus behavior pass.
- Console/page errors: none during normal online route and demo flows.
- Privacy: fresh demo contexts had zero local/session storage entries and cookies. All observed runtime requests were same-origin. Source/dependency review found no CLI networking, analytics, sign-in, payment, or product-unlock calls.
- Security headers: HTTPS, HSTS, CSP, `nosniff`, Referrer-Policy, and Permissions-Policy are present. CSP produced no normal-flow violations.
- Performance: independent live mobile Lighthouse 13 scored Performance 96, Accessibility 100, Best Practices 100, SEO 100. FCP 0.8 s, LCP 1.1 s, TBT 230 ms, CLS 0, total transfer 51,227 bytes. Initial JS is 4,750 bytes gzip and CSS is 2,971 bytes gzip.
- Links: every internal and external HTTP link crawled returned 200.
- Offline: normal first-visit reload passed, but QA-05 blocks the offline guarantee.
- No server-side product API exists, so endpoint rate limiting and health/concurrency checks are not applicable. There is no sign-in flow, so Entra authority checks are not applicable.
- This deterministic local normalizer does not benefit from adding an AI step; no missed AI leverage finding.
- Manual NVDA, JAWS, and VoiceOver pilots remain unperformed in this Linux container and remain a documented release gate.

Evidence: [deployment hashes](qa-evidence/deployment-hashes.txt), [live browser QA](qa-evidence/live-browser-qa.json), [headers](qa-evidence/header-matrix.txt), [Lighthouse summary](qa-evidence/lighthouse-live-summary.json), and [verify-url result](qa-evidence/verify-url/verify.json).

## Required fixes before re-verification

1. Keep the audience sentence, primary demo action, and three facts within the desktop first viewport.
2. Add a bounded stabilization strategy so completed lines stream without waiting indefinitely for later output.
3. Expand every interactive target to at least 44×44 CSS px.
4. Make claim tests observe the full promised network and filesystem boundaries; add missing public claims or remove the copy.
5. Precache the hashed JS/CSS and test offline after one visit without an online warm-up.
6. Return HTTP 404 for unknown routes, add immutable caching for hashed assets, and tighten crate include globs.
