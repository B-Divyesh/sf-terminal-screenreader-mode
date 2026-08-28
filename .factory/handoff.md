# Repair 5 handoff — Terminal Screenreader Mode v0.1.0

## Status

The checked-in automated release blocker from independent verification 4 is
repaired. The named NVDA, JAWS, and VoiceOver pilot remains an **external
acceptance prerequisite** and was not run in this Linux-only worker. Do not
claim the package has passed that physical assistive-technology pilot.

## What changed

- Fixed QA-01, the unstable mobile total-blocking-time quality gate.
  `playwright.config.ts` now uses one worker, so a 4x CPU-throttled renderer is
  not competing with axe scans or another throttled browser for the test host.
- The existing Lighthouse-class test now measures three independent, fresh
  390 x 844 browser contexts. Each sample is a cold production visit with its
  own service-worker/cache and performance-observer state. The thresholds are
  unchanged: LCP < 2,500 ms, TBT < 300 ms, and CLS < 0.1.
- This is exact regression coverage for the verifier finding:

  ```sh
  npx playwright test site/tests/site.spec.ts \
    -g 'mobile rendering stays inside Lighthouse-class responsiveness budgets' \
    --repeat-each=3
  ```

  It passed 3 Chromium repetitions (each contains 3 isolated cold loads); the
  mobile-project copies skip by design. A direct nine-cold-load calibration at
  the same 4x throttle recorded TBT values 64, 23, 44, 51, 19, 46, 26, 16, and
  37 ms (maximum 64 ms), LCP 180–256 ms, and CLS 0.000.

## Reproduction note

Before changing code, I ran the verifier's exact repeat command from a clean
`npm ci` install. In this worker it passed rather than reproducing the
historical 797–868 ms failures documented in `verification-4.md`; no previous
failure value is represented as newly reproduced. The root cause in the
checked-in test was nonetheless clear: it measured a CPU-throttled performance
sample while the runner allowed concurrent browser work and reused state across
its samples. The repair makes the measurement isolated and repeatable without
relaxing its budget.

## Verification performed

All commands were run in `/work/repo` after a clean `npm ci`:

```sh
npm ci
npm audit --audit-level=high                 # 0 vulnerabilities
npm test                                     # passed: 8 unit + 6 CLI tests, build, 62 browser tests
npm run lint                                 # fmt, clippy -D warnings, tsc --noEmit passed
npm run build                                # target/release/tsrm and dist/site produced
npm run package                              # cargo package verification passed (11 files, 45.7 KiB / 14.2 KiB)
npx playwright test                          # passed; test-results/.last-run.json reports "passed"
```

Every one of the 16 commands listed in `.factory/claims.json` was also run
individually and passed. The full browser run covers desktop and 390 px mobile,
keyboard recording control, route focus/title behavior, responsive text,
touch-target sizes, axe serious/critical checks on every route and animation
midpoint, local-only request/storage checks, offline demo reload and cached
privacy navigation, response-policy build checks, static route/config checks,
and production asset budgets.

The packed `terminal-screenreader-mode-0.1.0.crate` was unpacked into a fresh
temporary consumer and installed with an isolated Cargo root. Its public
`tsrm` binary passed `--version`, six-line `demo --no-timestamps`, ANSI/Unicode
normalization with JSON link output, and wrapped exit-code propagation (7).

## Deployment and live identity

This repair preserves the static deployment class. Push this commit to `main`
to use the factory's static deployment path, then repeat deployed identity,
headers, links, offline reload, and browser QA against
`https://terminal-screenreader-mode.sociobot.in`. This worker made no direct
infrastructure change.

## Remaining external prerequisite

Follow the named pilot protocol in `.factory/compatibility.md` against the
packed release binary on the required systems:

1. NVDA in PowerShell and Command Prompt.
2. JAWS in PowerShell and Command Prompt.
3. VoiceOver in macOS Terminal.

For each, confirm six records once and in order, the 30-run alternating-stream
fixture, and a delayed second line. Record reader, terminal, shell, OS,
operator, and outcome in `compatibility.md`. This Linux worker did not have
NVDA, JAWS, VoiceOver, macOS, or Windows available, and does not claim that
these checks ran.
