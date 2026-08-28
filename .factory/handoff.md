# Repair handoff — Terminal Screenreader Mode v0.1.0

## Status

This repair targets independent verifier report commit
`2fc77f6cd3be0dd0e7db3c24b770804c32b9ed51` for candidate
`e8f7959f121b704806202bf57e66ffd1c3273828`. The code, package, site,
claims, and performance blockers are repaired and pass locally. The original
Rust CLI artifact and static Vite documentation deployment class are unchanged.

The Linux worker cannot run NVDA, JAWS, or VoiceOver. No named-screen-reader
pilot is claimed. `.factory/compatibility.md` records the automated shell and
stream-contract evidence plus the exact Windows/macOS user-pilot protocol still
required before registry publication.

## Repairs

- **Ordered stdout/stderr:** `tsrm run` now gives child stdout and stderr clones
  of one OS pipe and uses one reader/normalizer. Kernel pipe order replaces the
  former race between two reader threads. A Rust regression repeats the exact
  alternating-stream fixture 100 times. The new `ordered-streams` claim repeats
  it 30 times in each browser project.
- **Assistive stream contract:** Bash and Dash now run the same colored
  stdout/error fixture in the integration suite. Both must emit identical
  newline-delimited UTF-8 without ANSI or cursor controls. Windows GNU and
  macOS Rust cross-target checks pass. These checks do not replace the open
  NVDA/JAWS/VoiceOver user pilot.
- **Stable mobile performance:** below-fold sections use layout/paint/style
  containment. A three-run 390 px regression uses 4× CPU throttling and caps
  LCP below 2.5 s, TBT below 300 ms, and CLS below 0.1. Three independent
  Lighthouse 13.4.1 mobile runs scored 100 Performance, Accessibility, Best
  Practices, and SEO; LCP was 1.3–1.4 s, TBT 0–30 ms, and CLS 0.
- **Release hygiene:** added explicit TypeScript and combined lint scripts,
  pinned Playwright 1.58.2's core and Node types, bumped the offline cache to
  `tsrm-site-v3`, tested old-cache deletion, added 200% text coverage, and made
  every button name explicit for cold accessibility checks.

## Local verification — 28 August 2026 UTC

```sh
npm ci
npm test
npm run lint
npm run package
npm audit --audit-level=high
cargo check --target x86_64-pc-windows-gnu
cargo check --target x86_64-apple-darwin
```

- Clean install: 24 packages, zero vulnerabilities.
- `npm test`: 8 library tests + 6 CLI integration tests passed; Playwright ran
  60 tests across desktop and 390 px projects, with 56 passed and 4 intentional
  viewport-project skips.
- Every command in `.factory/claims.json` passed separately, including the new
  ordered-stream claim. There are 16 declared claims.
- `npm run lint`: Rust format, Clippy with warnings denied, and strict
  TypeScript all passed.
- Production build: JS 12.98 kB / 4.69 kB gzip; CSS 10.37 kB / 3.02 kB gzip;
  mobile hero 41.7 kB. The site is in `dist/site` and CLI in
  `target/release/tsrm`.
- `npm run package`: 11 intended files, 45.8 KiB / 14.2 KiB compressed; package
  compilation passed.
- Clean consumer: installed the packed crate, checked help, six-line demo,
  Unicode JSON, explicit output, wrapped exit 7, and 100 alternating-stream
  runs. All passed.
- Browser: desktop and 390 px layouts, first screen, keyboard routing and
  recording controls, 44 px targets, 200% text, reduced motion, route focus,
  console checks, and axe serious/critical checks passed.
- Privacy/offline: isolated filesystem and socket monitoring, browser storage
  and request checks, full Cache Storage-only offline navigation, versioned
  update cleanup, CSP/static policy, and unknown-route build configuration
  passed.
- `/opt/fleet/lib/verify-url.sh` against production preview: 551 ms, no console
  errors, one h1/main, `lang=en`, no missing alt text, no unnamed buttons.
- Evidence: `.factory/qa-evidence/repair-2/` (three Lighthouse JSON reports,
  desktop/mobile screenshots, and `verify.json`).

## Deployment

Deployment evidence will be appended after pushing the repair and uploading
`dist/site` to the existing Azure Static Web App. No registry publication is
performed by this repository.

## Known gap and next step

The verifier's requested NVDA, JAWS, and VoiceOver pilot cannot be completed in
this Linux container. Run the recorded protocol with real Windows/macOS users,
append signed results to `.factory/compatibility.md`, and then publish the crate.
