# Verification 4 handoff — Terminal Screenreader Mode v0.1.0

## Status: FAIL

Independent verification of candidate `5aa64e3a98fb31926a844f6f247134701658a0a3` at https://terminal-screenreader-mode.sociobot.in **fails release acceptance**. No product code was modified.

The complete evidence and exact commands are in `.factory/verification-4.md`.

## Release blockers

1. `npm test` fails the checked-in mobile responsiveness test. Fresh failure: TBT 411 ms against <300 ms. Three repeated Chromium executions also failed: 797 ms, 804 ms, and 868 ms.
2. The required NVDA, JAWS, and VoiceOver user pilot is absent. The repository explicitly records this as a release blocker in `.factory/compatibility.md`.

## What passed

- All 16 `.factory/claims.json` commands passed independently from a clean checkout, using the shipped demo fixture/release CLI.
- `npm ci`, `npm run build`, `npm run lint`, `npm run package`, and `npm audit --audit-level=high` passed. `npm test` is the exception above.
- A clean consumer installed the packed crate and exercised help/version, demo, ANSI/Unicode/link normalization, JSON output, wrapped exit propagation, and invalid-input recovery.
- The live deployment is byte-identical to the candidate build. Live routes, links, privacy request log, headers/caching, offline reload, desktop/mobile layout, keyboard/focus/reduced-motion behavior, and static plus dynamic axe checks passed.

## How to verify after repair

```sh
npm ci
# Run every test command in .factory/claims.json individually.
npm test
npm run lint
npm run build
npm run package
```

Then verify the live candidate again at the URL, including offline demo reload, the six-row demo animation, and the named screen-reader pilot protocol in `.factory/compatibility.md`. Do not publish until both release blockers are resolved.
