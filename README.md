# Tomography, step by step

A local educational journey from line measurements to filtered backprojection.
Six chapters combine introductory explanations, build-time LaTeX/MathML, and
actual reproducible calculations in a browser Web Worker.

[Live explorer](https://kevinveleze.github.io/tomography-explorer/) ·
[Source](https://github.com/KevinVelezE/tomography-explorer)

## Run locally

Use Node 24+ (verified with Node 26.12.1) and npm:

```sh
npm ci
npm run dev
```

Open the loopback URL printed by Astro. For the production preview:

```sh
npm run build
npm run preview -- --port 4324
```

No account, credentials, payment or backend is required. Installation downloads
public npm dependencies; running the app makes no third-party requests and sends
no measurements elsewhere. Astro telemetry and its dev toolbar are disabled.
The public GitHub repository and GitHub Pages deployment were authorized on
2026-10-28. This is an independent project; the personal website is unchanged.

## Verify

```sh
npm test
npm run check
npm run build
npm run test:e2e
BASE_PATH=/preview/ SITE_URL=https://example.org npm run test:e2e
```

The browser tests build production assets and start an exclusive loopback server
on port 4324. Stop a manual server on that port first. They use Chromium through
Playwright. If it is not installed, install the matching headless browser with
`npx playwright install chromium --only-shell` (a public browser download).
`check` performs Astro/TypeScript diagnostics; no separate lint tool is configured.
Restore a root build with `npm run build` after testing a subpath.

## Explore

- Select the synthetic object and number of projection views.
- Follow the chapter sequence, or return using the chapter index.
- Change angle/detector to relate the object, sinogram and individual profile.
- Compare unfiltered BP, ramp FBP and Hann-windowed FBP.
- In the final chapter, vary Gaussian noise, uint32 seed and Hann cutoff.
- Open “A little mathematics” for typeset equations and stated conventions.
- Controls sit directly next to the primary comparison; supporting figures and
  mathematics follow. While dragging cutoff/noise, completed previews update
  with their own displayed parameters and an “Updating” label. The engine's
  precision is unchanged; these are real calculations, not a cosmetic preview.
- Export JSON for the confirmed configuration, selected view, metrics and
  numerical conventions. Export is disabled during pending/invalid calculations.
  This v1 does not import JSON or synchronize state to a shareable URL.

Reference/ramp/Hann use the same [0,max(reference)] intensity scale. BP uses its
own stated scale. Clipping counts describe display only; metrics use raw data in
the disk of radius 0.9. Navigation/filter/angle selection do not relaunch FBP.

## Scope and documentation

- [Approved design](docs/design.md)
- [Numerical conventions and measured errors](docs/numerics.md)
- [Verification evidence and limitations](VERIFICATION.md)

128×128 grid; analytic projections of original disk scenes, radix-2 FFT with
centered 4× padding, ramp/Hann multipliers, linear-interpolation BP, deterministic
Mulberry32/Box–Muller noise. The radial Fourier diagram alone is conceptual and
is labeled as such. All reconstructed images and plotted spectra are calculated.

This is **not clinical software**. No patient data, diagnostic claims, dose
simulation or universal filter ranking. Finite sampling and detector extent
introduce numerical error. Firefox, WebKit, physical mobile devices and an
independent code review remain unverified. The author's self-review is weaker
than independent review. The personal website and research repositories remain
unchanged. Linking this explorer from that website is a separate decision.

## Publication and reuse

The initial public repository, commit/push and GitHub Pages deployment are
authorized. The deployment workflow runs unit, type and production browser
checks before uploading `dist/`, using the `/tomography-explorer/` base path.
It needs a GitHub account and GitHub Actions/Pages for publishing; visitors do
not need an account. See [publication notes](docs/publication.md).

No open-source license has been selected. Public availability alone does not
grant a general reuse license; GitHub's applicable terms still apply. Third-party
dependencies retain their own licenses. The bundled KaTeX CSS/fonts retain their
[MIT notice](public/licenses/katex.txt), also included in the deployed site.
