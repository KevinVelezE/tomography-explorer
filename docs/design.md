# Approved product design

Approved on 2026-10-27, including the five-task local implementation plan.
This self-contained record preserves the decisions and acceptance criteria.

## Purpose and audience

Explain projections/sinograms, why BP is not inversion, Fourier's role in the
ramp, and the detail/noise tradeoff. Readers know introductory analysis and an
operator conceptually, not advanced functional analysis. Inspired by the sequence
of the author's thesis defense; no private code, figures or extensive text are
copied or published. Synthetic scenes only; no medical/clinical claims.

## Approved experience

English guided experimental notebook, six navigable chapters:
1. What does a detector actually measure? Object, ray and projection.
2. How do many projections become a sinogram? Column/profile relationship.
3. Why is backprojection not the inverse? Actual reference/BP comparison.
4. Where does the missing detail go? Calculated 1D spectrum, conceptual radial line.
5. What changes when we filter first? Reference/BP/FBP/error and actual multiplier.
6. Why can sharper also mean noisier? Same noisy data, ramp/Hann and ROI metrics.

Each chapter has a question, concise explanation, comparison, contextual
controls, observation, optional mathematics, and previous/next navigation.
The 2026-10-28 adjustment places unique contextual controls immediately beside
the primary figures, with a compact displayed-parameter/update label. Supporting
panels, observations and mathematics follow, never separating a slider from its
primary comparison. At narrow widths, compact paired images keep the effect in
view without a fixed overlay. In chapter 5 the primary pair is FBP/error; in
chapter 6 it is ramp/Hann; reference and supporting panels remain available below.
In chapter 6, Displayed filter sits beside its actual target, the auxiliary
selected error map; it does not imply that choosing a filter changes either of
the fixed ramp/Hann comparison panels.
LaTeX is built with KaTeX HTML+MathML, local CSS/fonts, trust disabled and errors
fatal at build time. Long equations scroll locally with keyboard access.

Cool paper #f8fafc, ink #172b4d, blue #3156a4, teal #147d78, dividers #dce4ef,
violet #7256a8. Georgia questions and system sans explanations. A left chapter
index becomes two columns on narrow screens. Dark image fields distinguish
calculated images from light geometric/frequency diagrams. No automatic motion.

## Architecture and state

Static Astro, TypeScript and Canvas; pure numerical engine in a module Web Worker.
No React/backend/external computation. One active job and at most the latest
pending job; monotonic IDs ignore stale replies. Failed workers terminate;
retry creates a new one. Dispose removes listeners and releases references.
Transfer each result buffer once, without reusing transferred arrays.

Acquisition config and selected view are separate. Numeric controls send the first
request immediately and later requests at most once per 150 ms, always retaining
the latest value. This does not promise an image every 150 ms. Completed snapshots
can be displayed as previews while newer work remains pending; their images,
metrics and displayed parameters always come from the same result. Navigation,
filter and angle selection reuse these snapshots. Export stays disabled until
the latest valid intended configuration is fully confirmed.
Invalid runtime input cannot be authorized by TypeScript or a slider alone.

JSON schema 1/engine 0.1.0 contains confirmed config/view/metrics, ROI and
normalizations, not image arrays, private paths or nondeterministic timestamps.
View indices are checked, and angle index is clamped when views decrease.

## Numerical contract

- Product N=128, h=2/N. Primitive test grids N=32/64/128/256; views 2..720.
- Product views 12/30/60/90/180/360; initial 180. Angles jπ/M, excluding π.
- Detector t[k]=(k−N/2)h; x[col]=(col−N/2)h; y[row]=(N/2−row)h.
- Images row-major; projections angle-major. Float64 until display.
- Disk scene: center (0,0), radius .65, value 1. Asymmetric scene: base disk
  (−.04,0), radius .66, value .8; inclusion (.25,.2), radius .12, added value 1.3.
- Reference point sampling; exact continuous chord-sum projections. No spike
  pixel-splat projector or invented image output is reused.
- Fourier exp(−2πitσ), cycles/unit, centered 4N padding, native signed frequencies
  with negative Nyquist, inverse normalization once. Ramp |σ|. No fitted factor.
- Hann: |σ|(1+cos(πσ/f_c))/2 for |σ|≤f_c, otherwise 0; f_c=α/(2h).
  α in [.1,1], initially .65. Not a thesis C/E filter.
- BP: linear detector interpolation, zero extension and π/M angular weight.
- Additive Gaussian noise, standard deviation level·max|clean|, level in [0,.05],
  initially 0. Seed uint32, initially 42. Both filters share one realization.
- Metrics on x²+y²≤.9², no clipping or per-image normalization. Relative L2 null
  for zero reference; RMSE uses actual ROI sample count.
- Reference/ramp/Hann share [0,max(reference)]; BP own declared scale; absolute
  error is computed from raw arrays. Show display clipping counts and ranges.

## Acceptance evidence required

- Known disk chords, independent line quadrature, generated symmetry/linearity.
- FFT vs independent DFT, generated inverse/Parseval/linearity, explicit padding.
- Disk whole-grid relative L2 <.15, interior mean .92..1.08, inclusion stays in
  its quadrant; smooth Gaussian at N64/128/256 and M360 has relative error <.04.
  No universal monotonic convergence assertion or tolerances adapted to a bug.
- Reproducible noise, shared input to both filters, explicit ROI and finite data.
- A/B/C rapid requests execute A/C only; stale results do not become ready;
  crashes/retry/disposal and deterministic export are tested.
- Real browser calculations, download, worker recovery, no-JS/Worker fallback;
  six chapters at 320/390/1440px, keyboard, 200% text, open math and reduced motion.
- Axe A/AA checks; root and /preview/ production builds load worker/styles/fonts
  with no third-party requests. Wait for explicit ready state, not network idle.
- Five-run development Chromium compute median <1000ms, with separate end-to-end
  timing and navigation available while computing; no physical-device guarantee.

## Delivery boundaries

Independent local folder only. No Git initialization, commits, remote, push,
merge or deployment authorized. Personal website and research folders unchanged.
No agents delegated; agreed final review is explicitly an author self-review,
not independent review. Keep documentation and local evidence, exclude generated
dependencies/build/test artifacts and secrets from any future selected delivery.

Publication amendment (2026-10-28): the user subsequently authorized the public
`KevinVelezE/tomography-explorer` repository, initial commit/push and GitHub Pages.
See `publication.md`. This replaces the earlier Git/publication restriction only;
the personal website/research exclusions, review limits and file-selection rules
remain in force. The superseded boundary above records the original agreement.
