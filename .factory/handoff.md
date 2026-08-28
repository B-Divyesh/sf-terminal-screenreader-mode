# Repair 3 handoff — Terminal Screenreader Mode v0.1.0

## Status

Work order `terminal-screenreader-mode-repair-3` addresses verifier report
commit `a51efae6183f4290c5f01482b5ad7297b10fe60c` for candidate
`fae29ef96040aae5dead9c07d59a6aa0035aac56`.

The transient demo contrast defect is fixed and has exact regression coverage.
One externally operated release gate remains: the required NVDA, JAWS, and
VoiceOver user pilot cannot be run in this Linux-only worker. The package must
not be published as accepted until that pilot is completed. This limitation is
recorded in `.factory/compatibility.md`; no screen-reader result is fabricated.

The artifact remains a Rust CLI. Its deployment remains a static Vite docs and
demo site in `dist/site`.

## Repairs

- Transcript rows now enter with a transform-only animation. Text stays fully
  opaque, so the mint `text` label no longer passes through the verifier's
  failing effective color `#3c855f` at 4.42:1.
- The regression starts playback, waits for each of the six rows, freezes its
  animation at 110 ms, asserts opacity 1, and runs axe at every intermediate
  state in desktop and 390 px browser projects.
- The offline cache is now `tsrm-site-v4`, ensuring returning visitors receive
  the corrected hashed stylesheet.
- A broader route audit found that the demo banner's “Start for real” link was
  under 44 px. It now meets the touch-target baseline, and the regression checks
  every visible interactive target on home, demo, privacy, terms, and 404.
- `.factory/design.md` now records the opaque, transform-only motion policy.

Functional commits:

- `f0b9dcc6489cdc56b60e66c24501392b09ed66ea` — preserve contrast during
  transcript playback.
- `a6047bb4712a6a894990c9a54015f66f05f01eaf` — enforce touch targets on every
  route.

## Verification evidence — 28 August 2026 UTC

From a clean `npm ci` (23 packages, 0 vulnerabilities):

```sh
npm test
npm run lint
npm audit --audit-level=high
npm run package
cargo check --target x86_64-pc-windows-gnu
cargo check --target x86_64-apple-darwin
```

- Final `npm test`: 8 library tests and 6 CLI integration tests passed;
  Playwright reported 58 passed and 4 intentional viewport-project skips.
- Every one of the 16 commands in `.factory/claims.json` passed separately.
- Rust format, Clippy with warnings denied, strict TypeScript, and both
  cross-target checks passed.
- Production output: JS 12,980 bytes, CSS 10,405 bytes, and mobile hero 41,742
  bytes. `dist/site` and `target/release/tsrm` were produced.
- `cargo package`: 11 intended files, 45.7 KiB uncompressed and 14.2 KiB
  compressed; package verification passed.
- A fresh consumer installed the packed crate and exercised version, help, the
  six-record demo, Unicode JSON, wrapped exit 7, and 100 alternating
  stdout/stderr runs. All passed.
- Chromium 145 browser QA passed at 1440×900 and 390×844: keyboard skip-link
  routing, playback, no horizontal overflow, 44 px targets, zero serious or
  critical axe findings during the animation midpoint, no console errors, no
  cookies or web storage, and no cross-origin requests.
- Offline reload and in-app navigation passed from cache `tsrm-site-v4`.
- `/opt/fleet/lib/verify-url.sh` passed locally: title, `lang=en`, one h1, main
  landmark, alt text, button names, and console checks.
- Three Lighthouse 13.4.1 mobile-default runs scored 100 Performance, 100
  Accessibility, 100 Best Practices, and 100 SEO. LCP was 1,281 ms, 1,478 ms,
  and 1,485 ms; TBT was 31 ms, 53 ms, and 42 ms; CLS was 0 in all runs.
- Static response policy is covered by the production-config test: explicit
  routes, real 404 rewrite, CSP, immutable hashed assets, no-cache service
  worker, and versioned old-cache deletion.

Evidence is in `.factory/qa-evidence/repair-3/`.

## Build and package identity

The final local build hashes before deployment are:

```text
index.html                       be891b0368ebcb86bf5f90ac5b3f067e69a0d2364f48b8848d6ac658eb78febb
assets/index-DcRRykEU.js         1d13d3c4cd727c3395b4a80130c6b75624588833ac1a845482c3e15cc71bd908
assets/index-CQwj0BrN.css        92ce53ba91af09df19f376ed181a35c9b2f132d29413fee462c356e4e972c542
sw.js                            63f36089d7e528a4cfffe0eba9c99236daa998af6fc3d3a15a8a6402864a5c02
```

## Deployment

Target: Azure Static Web Apps resource `sf-terminal-screenreader-mode` in
resource group `sociobot`, using `dist/site`. Deployment and live identity
evidence are appended below after upload.

## Required external pilot

The Linux worker has no NVDA, JAWS, VoiceOver, Windows, macOS, Wine, or human
assistive-technology operator. Automated shell, packed-consumer, browser
accessibility-tree, and cross-target checks do not satisfy the verifier's named
user-pilot requirement. Follow `.factory/compatibility.md`, record reader,
terminal, shell, OS, operator, and results, resolve any findings, and only then
publish the crate.
