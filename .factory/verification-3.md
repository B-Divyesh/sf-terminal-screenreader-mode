# Independent verification 3 — FAIL

**Candidate:** `fae29ef96040aae5dead9c07d59a6aa0035aac56`  
**Live URL:** https://terminal-screenreader-mode.sociobot.in  
**Verified:** 28 August 2026 UTC

## Release decision

**FAIL.** The candidate has a serious live accessibility violation during the
primary demo interaction, and the required NVDA, JAWS, and VoiceOver pilot has
not been performed. Either issue blocks acceptance under the work order and
brief.

## Defects

### High — QA-01: The running sample has a serious contrast failure

On live `/demo` at 1440 x 900, activate **Play recording** and immediately run
axe. While a transcript line is entering, its `text` type label is rendered at
intermediate animation opacity. Axe 4.10.2 reports `color-contrast` with
foreground `#3c855f`, background `#080b0e`, and a 4.42:1 ratio, below the
required 4.5:1. The violation is **serious**. This is reproducible after
keyboard activation of the main demo control; it is not present after the
220 ms animation has finished.

This fails the acceptance requirement for contrast >= 4.5:1 and for zero axe
serious/critical findings. Do not animate text opacity through an
insufficient-contrast state; use an opaque transform-only entrance or adjust
the starting treatment.

### High — QA-02: Required named screen-reader validation is absent

The researched brief requires testing with NVDA, JAWS, and VoiceOver.
`.factory/compatibility.md` explicitly says no user pilot was performed and
lists the still-pending Windows/macOS protocol. Linux automated shell tests
are useful contract coverage but do not demonstrate that the intended blind
and low-vision users can read the transcript in the three named readers.

Run the documented pilot against the packed release binary, record terminal,
shell, reader, OS, operator, and results, and resolve any findings before
release.

## Required claims — PASS

`.factory/claims.json` exists with 16 entries. After a clean `npm ci`, I ran
every listed command sequentially, exactly as declared. The sequence reached
and completed all 16 commands without a failing command:

| Claim IDs passed |
| --- |
| `stable-rewrites`, `local-default`, `ansi-links`, `json-lines` |
| `exit-code`, `ordered-streams`, `unicode-safe`, `semantic-labels` |
| `output-file`, `earcons-off`, `timestamped`, `demo-sandbox` |
| `mit-free`, `offline-docs`, `keyboard-recording`, `rust-version` |

Each command invokes the release build and its tagged Playwright test from the
shipped demo fixture. The subsequent ungated `npm test` also completed the 8
library tests, 6 CLI integration tests, and 60 Playwright tests (56 pass, 4
intentional project skips).

## First read and demo — PASS

Cold live root page, no prior storage: it says the product reads streaming
commands without losing the user's place; it names screen-reader users and
says changing terminal output becomes stable lines; the visible first action
is **Try it with sample data**, with “See a noisy build become six stable
lines.” The action reaches `/demo` in one activation. The demo immediately
shows the bundled six-record transcript and has the persistent “Demo — sample
data, nothing is saved” banner, Reset demo, and Start for real.

At 1440 x 900 the audience sentence, action, and three facts were in the first
viewport. At 390 x 844 they were likewise visible, with no horizontal overflow.

## Local build, package, and CLI exercise — PASS

- `npm ci`: passed; 23 packages installed, zero audit vulnerabilities.
- `npm run lint`: passed (`cargo fmt --check`, Clippy with warnings denied,
  and `tsc --noEmit`).
- `npm run build`: passed; generated `dist/site` and `target/release/tsrm`.
  Entry JS is 12,980 bytes / 4,710 bytes gzip; CSS is 10,370 bytes / 3,028
  bytes gzip; mobile hero is 41,742 bytes. All are inside the stated budgets.
- `npm test`: passed as above.
- `npm run package`: passed. Cargo packaged 11 intended files, 45.7 KiB
  (14.2 KiB compressed), and verified the archive.
- A fresh temporary consumer unpacked that `.crate`, installed it with Cargo,
  and exercised `tsrm --version`, `--help`, `demo --no-timestamps`, JSON
  normalization with ANSI and Unicode, and a wrapped child exit 7. The demo
  emitted all six stable records. Invalid `--earcons --json` and unwritable
  `--output` both returned exit 2 with actionable errors.
- A quiet wrapped child printed its first completed line at 104 ms and its
  second at 506 ms, confirming the 100 ms stabilization recovery path.

## Live deployment, privacy, offline, and browser QA

- **Deployment identity: PASS.** Freshly generated `dist/site/index.html`,
  `assets/index-BlDX-v48.js`, and `assets/index-z6GVZR04.css` were each
  SHA-256-identical to their live counterparts. The live home hash is
  `3799dae6899b7f559247b658bc65ce0afb7bd4f2375c3adb0338a7a34fe8fdb4`.
- **Routes/links: PASS.** `/`, `/demo`, `/privacy`, and `/terms` returned 200;
  an unknown route returned the designed HTTP 404. Every discovered non-mailto
  landing-page link returned 200.
- **Privacy: PASS.** Fresh desktop and 390 px contexts made only same-origin
  requests (HTML, first-party JS/CSS, favicon, and first-party hero). They had
  zero cookies and zero local/session storage entries. No analytics, sign-in,
  payment, unlock, or product API was observed. There is consequently no
  server-side endpoint for the requested 429/`Retry-After` test, and no Entra
  sign-in flow to validate.
- **Headers/caching: PASS.** Live HTML has CSP restricted to `'self'`,
  `X-Content-Type-Options: nosniff`, strict referrer policy, restrictive
  permissions policy, and HSTS. Hashed JS has one-year immutable caching;
  `sw.js` is `no-cache`.
- **Offline/PWA: PASS for reload.** A fresh live `/demo` registered
  `tsrm-site-v3`; its Cache Storage contained the documents and exact hashed
  JS/CSS. With the context offline, `/demo` reloaded and navigated to Privacy
  with no errors. The deployed worker uses `skipWaiting`, `clients.claim`, and
  activation-time deletion of older cache names. A genuine newer live worker
  was not available to install, so this verifies the candidate's update
  mechanism rather than a cross-version production rollout.
- **Keyboard/mobile/motion: PASS except QA-01.** Tab reached the skip link;
  Enter moved focus to `#main`; focus was a visible 3 px `#6fffb0` outline with
  3 px offset. Clear and Play worked through keyboard activation. All tested
  visible links/buttons met 44 px; 390 px and 200% text had no overflow.
  Reduced motion showed all six records immediately. Normal route/demo flows
  produced no console or page errors.
- **Axe:** no serious/critical findings on cold home or cold demo in desktop
  and mobile. QA-01 is the reproducible serious finding after the user starts
  the recording.

## Scope notes

This is a static docs site plus local CLI. It has no backend persistence,
health endpoint, product-unlock API, account system, or rate-limited endpoint;
those backend/sign-in checks are not applicable. No product source was changed
by this verification.

## Next steps

1. Fix QA-01 and add a regression that runs axe while each recording line is
   entering, not only after the static page load.
2. Complete and record the NVDA, JAWS, and VoiceOver pilot specified in
   `.factory/compatibility.md`.
3. Re-run all declared claims, the full suite, package/consumer test, and
   live browser QA against the repaired deployment.
