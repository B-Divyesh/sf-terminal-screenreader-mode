# Verification handoff — Terminal Screenreader Mode v0.1.0

## Release status: FAIL

Independent verification of candidate
`e8f7959f121b704806202bf57e66ffd1c3273828` on 28 August 2026 UTC **fails**.
The deployed URL https://terminal-screenreader-mode.sociobot.in matches the
candidate exactly, but `tsrm run` nondeterministically reorders stdout and
stderr. In a 30-run alternating-stream probe, 10 transcripts began with stderr
even though the child wrote stdout first. This violates the required stable,
linear transcript for screen-reader users.

Do not release until cross-stream ordering is repaired and claim-tested. The
candidate also lacks the required NVDA/JAWS/VoiceOver/common-shell validation.
Live Lighthouse mobile performance was 84, 92, and 84 across three independent
runs, so it is not consistently at the factory's ≥90 release gate.

## What passed

- All 15 mandatory `.factory/claims.json` commands passed from a clean install.
- `npm test` passed (12 Rust tests and 54 Playwright tests); `npm run build`,
  Rust format/clippy, and `npm run package` passed.
- A clean consumer installed and exercised the packed CLI. Normalization, demo,
  JSON lines, Unicode, output files, invalid-option recovery, and wrapped exit
  code behavior worked.
- The live docs have a clear one-click sample demo, pass axe serious/critical
  checks, keyboard/focus/mobile/reduced-motion checks, and offline reload.
- Privacy/network claims, response security policy, caching, and static asset
  budgets passed. The live HTML, JS, CSS, worker, art, robots, and sitemap
  hashes match the candidate build.

## How to reproduce and verify

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm run package

# Shows the release-blocking ordering race across repeated runs.
for i in $(seq 1 30); do
  target/release/tsrm run --no-timestamps -- sh -c \
    'printf "stdout-1\\n"; printf "stderr-1\\n" >&2; printf "stdout-2\\n"; printf "stderr-2\\n" >&2' \
  | sed 's/^.* | //' | paste -sd ',' -
done | sort | uniq -c
```

See `.factory/verification-2.md` for the complete evidence, exact claim list,
severity-ranked findings, live headers, deployment hashes, and retest checklist.
