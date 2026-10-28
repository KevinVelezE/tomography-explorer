# GitHub publication — 2026-10-28

The user explicitly authorized a public `KevinVelezE/tomography-explorer`
repository, initial commit/push and deployment through GitHub Pages. This
supersedes the earlier local-only delivery boundary, not the other design or
review constraints. The personal website and research repositories are not
changed, and no link from that website is added automatically.

## Files and privacy

Include only source, tests, dependency lockfile, project configuration,
documentation and the Pages workflow. Exclude `.superpowers/` scratch ledgers,
`.env*`, installed dependencies, `.astro/`, `dist/`, browser traces/screenshots and
test reports. No private research code, figures or datasets are included. A
pattern scan and explicit staged-file inspection precede publication; those
checks do not guarantee the absence of every possible secret.

Commit author uses the authenticated account's GitHub noreply address rather
than the locally configured personal email. No credentials are written into
project files or Git remotes. The package remains `private: true` to prevent
accidental npm publication; this does not make the GitHub repository private.

## Deployment

Production URL: `https://kevinveleze.github.io/tomography-explorer/`.
Static Astro build with `SITE_URL=https://kevinveleze.github.io` and
`BASE_PATH=/tomography-explorer/`. The module worker, styles and local KaTeX
fonts resolve through the built asset paths; no backend is deployed.

The workflow runs `npm ci`, `npm test`, `npm run check` and the complete
Playwright production suite at that base path before uploading the Pages
artifact. Official GitHub actions are pinned to resolved commit SHAs. Build
permissions are read-only; only deployment receives Pages write and OIDC token
permissions. Checkout does not persist credentials.

Publishing uses GitHub authentication, GitHub Actions and Pages, which receive
the selected public source and static build. Visitors only fetch static assets
from the site origin; computations remain in their browsers with no analytics
or external numerical service. No paid service is configured.

Before claiming success, verify workflow completion, the live HTTP response and
a real browser calculation/export at the published URL. See `VERIFICATION.md`
for numerical tests, author-review limitations and pending browser/device checks.

## Licensing

The user has not selected an open-source license. None is chosen on their behalf.
Public source is subject to GitHub's terms and applicable default copyright;
third-party dependencies keep their own licenses.
The KaTeX MIT notice is retained in `public/licenses/katex.txt`, which Astro copies
to the published static site with the bundled CSS/font assets.
