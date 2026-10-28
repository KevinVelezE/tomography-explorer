# Local verification

## Authorized GitHub publication preflight — 2026-10-28

The public repository, initial commit/push and Pages deployment were subsequently
authorized; earlier local-only restrictions below are historical. Current
publication details are in `docs/publication.md`.

Fresh checks before the initial commit:
- `npm ci`: successful, zero audit vulnerabilities.
- `npm test`: 67/67 passed.
- `npm run check`: zero errors/warnings/hints (no standalone lint configured).
- `BASE_PATH=/tomography-explorer/ SITE_URL=https://kevinveleze.github.io npm run test:e2e`:
  22/22 passed, including production build, worker, export, accessibility and
  no-third-party-origin requests at the actual deployment base path.
- Workflow YAML parsed; main branch, base path, least-privilege permissions and
  immutable official-action pins checked. GitHub execution remains a separate
  deployment gate before claiming a successful publication.
- Explicit staged-file review and secret/local-path pattern scan: no matches;
  dependencies, environment files, scratch ledgers, build and test artifacts
  are excluded. The commit uses the account's GitHub noreply email.
- No open-source license chosen for original application code; bundled KaTeX
  license notice retained. No independent review or new browser/device testing
  beyond the previously described scope is implied by publication.

## Adjacent controls update — 2026-10-28

- `npm test`: 67/67 passed; `npm run check`: zero diagnostics.
- `npm run test:e2e`: 22/22 passed in the root production build.
- `BASE_PATH=/preview/ SITE_URL=https://example.org npm run test:e2e`: 22/22 passed.
  The final local preview uses a restored root build, not the subpath build.
- No numerical-engine or dependency changes. Same grid, precision and oracle
  tolerances; reconstruction previews are completed worker calculations.
- Numeric controls now submit a leading value and at most one request per
  150 ms, not only after a quiet interval. One active/one latest pending request
  remains bounded. Intermediate snapshots use their own config/images/metrics
  and cannot be exported as the latest requested experiment.
- New tests observed RED before scheduler/preview implementation, before visual
  grouping, before the near-figure pending label, and before relocating the final
  chapter's filter selector next to the error map it actually changes.
- Real-worker sustained input (40 changes at 40 ms intervals) produces intermediate
  snapshots during movement and converges to the final exportable config. Invalid
  input, crash/retry after a displayed snapshot and 180→12 view-count transitions
  are covered. A test-only DOM observer records transient snapshots atomically,
  rather than asserting transient states through separate round trips.
- At 320/390/1440 px, controls and at least 32 px of their primary figure can be
  seen together; control-group/figure separation is ≤96 px. Controls retain their
  values across all chapters, with no duplicate IDs. Existing axe, keyboard,
  open-math, 200%-text and reduced-motion checks also pass.
- Geometry/filter/noise screenshots generated and visually inspected at desktop
  and mobile widths. On narrow screens, the primary image pair is compact;
  auxiliary figures and detailed captions remain available below.
- Author self-review found the final chapter's Displayed filter selector was
  still detached from its real target (selected error map, not the fixed ramp/Hann
  pair). Regression observed RED, then moved the same control beside that error
  map; full suite GREEN. No delegated/independent review, as agreed.
- Original minor CSS-formatting/figure-heading findings remain deferred. No
  Firefox/WebKit, screen-reader session or physical-device validation added.
- Last root five-run compute median 221.2 ms, maximum 276.6 ms; navigation→ready
  median 365.3 ms, maximum 407.5 ms. Development-host measurements, not a promise
  of instant reconstruction or of performance on physical phones.

The sections below preserve the original 2026-10-27 baseline evidence.

## Environment and scope

Node 26.12.1, npm; Astro 7.4.2, TypeScript 6.0.3, Vitest 5.0.5,
fast-check 4.10.2, Playwright 1.64.1, axe-core Playwright 4.14.0, KaTeX 0.19.1.
Chromium headless shell already available at the matching Playwright revision.
No account, payment, credential or remote computation is required. Public npm
registry access was used to install dependencies. Runtime uses only local assets.

## Final evidence

- `npm test`: 64/64 passed, 11 files. Includes generated forward/FFT properties,
  independent line-integration/DFT oracles, analytic inverse fixtures, noise,
  metrics, worker transfers, queue/recovery/disposal, export and display scales.
- `npm run check`: 0 errors/warnings/hints (Astro/TypeScript); no standalone lint.
- Production build run by browser harness succeeds.
- `npm run test:e2e`: 15/15 passed after final fixes.
- `BASE_PATH=/preview/ SITE_URL=https://example.org npm run test:e2e`: 15/15 passed after final fixes.
- Axe WCAG 2 A/AA + 2.1 AA tags: no violations across six chapters at 320/390/1440
  with open mathematics. Actual keyboard focus/scroll, 200% text and reduced
  motion tested. This is not a certification or screen-reader usability study.
- Root/subpath real worker, actual download, no third-party requests, successful
  assets and no uncaught page errors checked by production browser tests.
- Six desktop chapter screenshots and mobile 320px chapter 1/6 screenshots
  generated in `test-results/` and opened for visual inspection. Output is local,
  excluded from future version selection; rerunning Playwright replaces it.

## Test-first evidence and fixes

Observed behavior failures before implementation for forward operator, FFT,
filtering, BP, metrics, noise, pipeline, coordinator, export, worker transfers,
image scale and missing UI contracts. Rejection tests that already threw in
stubs are not counted as independent RED evidence.

Browser regressions reproduced a late result clearing a newer invalid-input
error; guarded publication on valid/latest intent, including debounce. Axe at
320px found a non-focusable horizontal table region; it now has a keyboard stop,
region name and visible focus. Test selector/focus issues were corrected using
actual accessible roles and keyboard modality. Node/Chromium metrics differ
around 3e-17: integration comparisons use 12 decimal places, not bitwise equality;
the independent numerical acceptance tolerances remain unchanged.

Initial KaTeX 0.16 range had advisory GHSA-238p-pmpm-9mq7; selected 0.19.1 and
removed redundant old types. Installation audit then reported zero vulnerabilities.

## Observed development-machine timings

Five actual Chromium experiments, initial 128²/asymmetric/180 views/no noise,
separate from screenshot/axe work:

| Production route | Compute median | Compute max | Navigation→ready median | Max |
|---|---:|---:|---:|---:|
| `/` | 192.4 ms | 201.1 ms | 334.2 ms | 353.3 ms |
| `/preview/` | 275.4 ms | 289.2 ms | 427.6 ms | 477.2 ms |

These are development host observations, not mobile-device promises. Navigation
and focus were exercised before awaiting ready. See `docs/numerics.md` for actual
engine errors; visually smooth reconstruction is not scientific validation.

## Final gate and author review

Clean `npm ci` succeeded (zero audit vulnerabilities), final unit/check and both
production browser suites passed. Root build restored. Selected source/docs/output
scan found no private paths or secret patterns, excluding node_modules, scratch
ledger and test traces. This pattern scan is not a guarantee against all secrets.

Separate author self-review used the code-reviewer checklist and five plan review
foci. No Critical finding. Two Important findings were reproduced RED→GREEN:
persisted pagehide must not permanently dispose the coordinator; and the normal
label must have a dark backing over a bright disk. Final whole suites passed
after both fixes. The lifecycle regression dispatches persisted browser events
against a real running application; it does not prove actual BFCache admission.

Deferred minor findings: dense CSS formatting and skipped h2 level before figure
h3 headings. These do not change calculations; WCAG-tagged axe checks still pass.
Decisions: standalone local directory instead of Git/worktrees; author review
instead of an unauthorized agent; narrow analytic `projectAt` test interface;
approved Node Playwright harness instead of a duplicate Python runner; 12-decimal
cross-runtime metric comparison while preserving all original oracle tolerances.
The local ledger retains the complete decision/testing history (not published).

## Remaining limitations

Firefox/WebKit not installed, so not run; no physical mobile tests, screen-reader
session or independent review. No Git or publication authorized or performed.
