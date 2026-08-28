# Verification handoff — FAIL

Candidate `e51402111095ccb0488a1fa0dff462734e7b0345` was independently tested against <https://terminal-screenreader-mode.sociobot.in> on 28 August 2026 UTC. The live deploy matches the candidate byte-for-byte for all checked deployable files. This is not a deployment-only failure.

The release verdict is **FAIL**. The mandatory first-read gate fails at 1440×900 because the audience sentence is cut by the fold and **Try it with sample data** starts below it. Additional high-severity defects are unbounded one-line streaming latency, sub-44 px interactive link targets, inadequate privacy/isolation claim assertions, and an incomplete service-worker offline shell. Unknown routes return 200, hashed assets receive only 30-second caching, and the crate includes 37 `node_modules` documentation files.

Full findings, measurements, claim-by-claim results, and evidence are in [`.factory/verification.md`](verification.md).

## What passed

- All 14 exact claim commands after `npm ci`.
- `npm test`: 11 Rust tests and 47 Playwright tests passed; 1 expected project skip.
- Production build, Rust formatting, clippy with warnings denied, TypeScript check, npm audit, and crate packaging.
- Packaged-crate install into a clean consumer and normal, boundary, invalid-input, recovery, exit-code, JSON, Unicode, and 20-run concurrency exercises.
- Live same-origin privacy checks, security headers, keyboard order/focus, reduced motion, responsive overflow, zero serious/critical axe findings, and no normal-flow console/page errors.
- Live Lighthouse: 96 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s and CLS 0.

## Reproduce

```sh
npm ci
npm test
npm run build
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run package
```

Re-verification should begin with the first-screen geometry and the literal claims sandbox, then rerun the complete matrix above. Manual NVDA, JAWS, and VoiceOver pilots are still required outside this Linux container.
