# Independent verification 2 — FAIL

**Candidate:** `e8f7959f121b704806202bf57e66ffd1c3273828`
**Verified:** 28 August 2026 UTC
**Live URL:** https://terminal-screenreader-mode.sociobot.in

## Verdict

**FAIL — do not release.** The live static documentation deployment now matches
the candidate, but the CLI can reorder stdout and stderr records. A stable
linear transcript that reports events in the wrong order is unsafe for the
brief's screen-reader workflow.

## First-read result — PASS

Cold-loading the live home page at 1440 × 900 produced:

- **What it does:** “Read streaming commands without losing your place”; it turns changing terminal output into stable lines.
- **For whom:** “For screen-reader users”.
- **What to click first:** the visible **Try it with sample data** link, with the adjacent explanation “See a noisy build become six stable lines.”

The link reaches `/demo` in one activation. That page has the required “Demo —
sample data, nothing is saved” banner, **Reset demo**, and **Start for real**.

## Release-blocking findings

### High — `tsrm run` does not preserve combined stdout/stderr event order

The product's job is to make a command's changing output into a **linear**
transcript. `run_command` starts a reader thread for each output pipe and emits
records in the order those threads reach the channel (`src/main.rs`), not in the
child process's write order. The scheduling race is observable.

Fresh release-binary probe (30 runs):

```text
child writes: stdout-1, stderr-1, stdout-2, stderr-2

20  stdout-1,stderr-1,stdout-2,stderr-2
10  stderr-1,stdout-1,stdout-2,stderr-2
```

The child writes `stdout-1` first, yet one third of transcripts announced
`stderr-1` first. This can make errors, progress, and results misleading to a
screen-reader user. There is no claim test that exercises cross-stream ordering.

**Required repair:** capture the child output as a single ordered stream (or
state and implement a documented deterministic merge policy) and add a tagged
demo-entry claim test for alternating stdout/stderr writes.

### High — required assistive-technology compatibility testing is absent

The acceptance contract requires testing with NVDA, JAWS, VoiceOver, and common
shells. There is no pilot record or test evidence for any of them. The live page
states that compatibility pilots are the “next release gate,” confirming this
requirement remains open. Automated semantic and keyboard checks do not replace
real assistive-technology validation.

### Medium — live mobile Lighthouse performance is not consistently at 90

Three independent Lighthouse 13.4.1 mobile-default runs against the deployed
home page measured performance **84, 92, and 84** (mean 86.7), while
Accessibility/Best Practices/SEO were 100 each time. The two 84 runs measured
620 ms total blocking time; FCP was 0.8–1.0 s, LCP 1.1–1.2 s, and CLS 0.
The factory performance gate is ≥90, so this needs a reproducible performance
investigation before release despite the small static bundle.

## Required claims gate — PASS

`.factory/claims.json` exists with 15 entries. From the clean candidate after
`npm ci`, I ran every declared command exactly as written:

| Claim ID | Result |
| --- | --- |
| `stable-rewrites` | PASS |
| `local-default` | PASS |
| `ansi-links` | PASS |
| `json-lines` | PASS |
| `exit-code` | PASS |
| `unicode-safe` | PASS |
| `semantic-labels` | PASS |
| `output-file` | PASS |
| `earcons-off` | PASS |
| `timestamped` | PASS |
| `demo-sandbox` | PASS |
| `mit-free` | PASS |
| `offline-docs` | PASS |
| `keyboard-recording` | PASS |
| `rust-version` | PASS |

Each command runs `cargo test`, the release production build, and its tagged
Playwright assertion. The final test artifact reported `{"status":"passed",
"failedTests":[]}`. This gate does not cover the high-severity cross-stream
ordering defect above.

## Local build, package, and CLI exercise

- `npm ci`: passed; 23 packages audited, 0 vulnerabilities.
- `npm test`: passed: 8 Rust unit tests, 4 Rust CLI integration tests, and 54 Playwright tests (desktop and 390 px projects).
- `npm run build`: passed. `dist/site` entry JS is 12.82 kB / 4.67 kB gzip; CSS is 10.29 kB / 3.00 kB gzip; responsive hero is 41.7 kB. All are within the stated static asset budgets.
- `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings`: passed. No repository lint/type-check script is defined beyond these and the Vite build.
- `npm run package`: passed. Cargo verified the 11-file, 13.7 kB compressed `terminal-screenreader-mode-0.1.0.crate` archive.
- Clean consumer: installed the packed crate into a new temporary Cargo root. `tsrm --help`, `tsrm demo --no-timestamps` (six records), JSON normalization, ANSI/link/heading/error output, a 20,000-line Unicode boundary stream, and a wrapped exit 7 all worked. Empty input returned 0 with no output. Missing commands, incompatible `--earcons --json`, and an unwritable `--output` returned exit 2 with actionable errors. The stdout/stderr ordering probe failed as described above.

## Live site and deployment verification

- The generated candidate `index.html` SHA-256 is `aee1bcd4621b249aa6fdb61ff8cb1902db0f480b8b345e2103a9db97d0290d7e`; the live home document has the identical hash.
- Candidate and live hashes also match for the hashed JS/CSS, service worker, favicon, hero/OG art, `robots.txt`, and `sitemap.xml`. The deployment is not stale.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200; an unknown route returned real HTTP 404 with the designed 404 page. All live first-party and external links discovered on the landing page returned 200 (or are `mailto:` links).
- The live root and core routes have exactly one `h1`, one `main`, `lang=en`, correct route titles, no page errors, and no axe serious/critical violations. The expected browser console report for the deliberately requested unknown 404 URL is the HTTP 404 itself; normal product routes have no console errors.
- Keyboard check: the skip link received focus and moved focus to `main`; the demo link activated with Enter and moved focus to the new `h1`; the visible focus ring is a 3 px `#6fffb0` outline with a 3 px offset. Recording controls and reset work with keyboard activation.
- At 390 × 844 CSS px the document width was exactly 390 px and no visible focusable target was under 44 px. With reduced motion, Play immediately made all six lines visible and CSS reduced animation duration to 0.01 ms.
- Service worker `tsrm-site-v2` precached routes and versioned assets; after activation, `/demo` reloaded offline with no errors. The worker uses `skipWaiting`, `clients.claim`, and deletes prior cache names on activation; its update code was inspected, though no newer production worker was available to install during this verification.

## Privacy, network, and response policy

- The `local-default` claim isolated HOME, TMPDIR, and the working directory and used an `LD_PRELOAD` monitor for `socket`, `connect`, and `sendto`; it passed with no default writes or network calls.
- A fresh live browser context made only same-origin requests for the site, local assets, and service worker. It created no cookies, localStorage, or sessionStorage and found no forms or third-party scripts.
- The live CSP is self-only (`default-src`, `script-src`, `style-src`, `connect-src`, and `font-src`), with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`. HSTS, nosniff, Referrer-Policy, and Permissions-Policy are present. Hashed assets have `Cache-Control: public, max-age=31536000, immutable`; `sw.js` is `no-cache`.
- This is a static site/CLI with no server-side API endpoint, sign-in, billing, or product-unlock call. Rate-limit probing and Entra validation are therefore not applicable.

## Retest checklist

1. Fix and claim-test ordered stdout/stderr normalization.
2. Complete and record NVDA, JAWS, VoiceOver, and representative-shell pilots.
3. Investigate the live Lighthouse total-blocking-time variance and demonstrate repeatable mobile performance ≥90.
4. Re-run every claim command, `npm test`, build/package/consumer checks, and live deployment comparison.
