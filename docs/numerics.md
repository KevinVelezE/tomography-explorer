# Numerical conventions — engine 0.1.0

This is an educational discretization, not clinical validation. No patient data,
dose model or claim of universally superior reconstruction is involved.

## Geometry and transforms

Images are row-major: x[col]=(col−N/2)h, y[row]=(N/2−row)h, h=2/N.
Profiles are angle-major, θ_j=jπ/M, with t_k=(k−N/2)h. Original disk scenes
are sampled pointwise; projections are exact continuous chord sums. Independent
midpoint line integration (8192 steps) checks the forward operator.

The forward Fourier exponential is exp(−2πitσ). A centered zero padding to 4N
precedes the original radix-2 FFT. Native frequencies use negative Nyquist.
The inverse FFT divides by 4N exactly once. The ramp is |σ|; Hann multiplies
it by (1+cos(πσ/f_c))/2 below f_c=α/(2h), and is zero above that cutoff.
Filtered profiles are centrally cropped. Backprojection uses linear detector
interpolation with zero extension and weight π/M, without empirical fitting.
Displayed spectra are h|DFT(g)| before filtering.

## Noise and metrics

Engine 0.1.0 uses Mulberry32 (uint32 seed), paired Box–Muller normals, radius
sqrt(−2log(1−u)), angle 2πv. Noise standard deviation is level·max|g_clean|.
Both filters consume exactly the same realization. Zero noise copies clean data.
Normal samples are reproducible, not justified merely by their empirical mean.

Metrics use unmodified Float64 arrays within x²+y²≤0.9². RMSE divides by the
ROI sample count; relative L2 divides by the reference norm and is null for a
zero reference. Image clipping affects display only, never these metrics.

## Frozen tolerances and observed results

Observed on 2026-10-27 with `npm test -- --disableConsoleIntercept`:

| Analytic fixture | N | M | Whole-grid relative L2 | Required |
|---|---:|---:|---:|---:|
| Uniform disk, r=0.65 | 128 | 180 | 0.08628819748 | <0.15 |
| Gaussian s=0.15, center=(0.1,−0.1) | 64 | 360 | 0.01974850119 | <0.04 |
| Same Gaussian | 128 | 360 | 0.01945800684 | <0.04 |
| Same Gaussian | 256 | 360 | 0.01960759198 | <0.04 |

These are results from the product engine, not the disposable feasibility spike.
Monotonic convergence across these grids is neither required nor observed.
The finite detector, zero padding, quadrature and interpolation leave residual
error even for smooth objects. Discontinuous disk boundaries add sampling error.
Tests also check disk interior amplitude (0.92–1.08), asymmetric inclusion
orientation, DFT values, Parseval, inverse/linearity and known ROI reductions.
