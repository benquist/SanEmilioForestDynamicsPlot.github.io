# San Emilio Forest Dynamics Plot Website

Single-page research website for the San Emilio Forest Dynamics Plot (SEFDP), designed as a GitHub Pages site.

## Structure

- `index.html` - One-page site with hero, overview, timeline, findings, publications, media, ForestGEO links, and contact.
- `assets/css/styles.css` - Visual system, responsive layout, and section styles.
- `assets/js/main.js` - Mobile nav behavior, active section highlighting, and reveal interactions.
- `assets/img/` - Images, figures, logos.
- `data/` - Small project data files (CSV/JSON) used by the site.

## Quick start

Open `index.html` directly in a browser for local preview.

## GitHub-based website setup

This project is configured for GitHub Pages using a workflow at `.github/workflows/deploy-pages.yml`.

1. Create the repository named `SanEmilioForestDynamicsPlot_Website` on GitHub.
2. Push this folder to the repository.
3. In GitHub, go to Settings -> Pages and set Source to `GitHub Actions`.
4. Push changes to `main` or `master`; the workflow will deploy automatically.

The live site URL will be:

`https://<your-github-username>.github.io/SanEmilioForestDynamicsPlot_Website/`

## Suggested next steps

1. Add local, project-owned photos and figures under `assets/img/`.
2. Add downloadable summary graphics and structured publication metadata in `data/`.
3. Expand methods and data-access sections if public data endpoints are added.

## Core source grounding used in current copy

- ForestGEO San Emilio site: https://forestgeo.si.edu/sites/san-emilio
- Enquist and Enquist 2011 (Global Change Biology): https://doi.org/10.1111/j.1365-2486.2010.02326.x
- Swenson et al. 2020 (Ecological Monographs): https://doi.org/10.1002/ecm.1408
- Huang et al. 2021 (Ecosphere): https://doi.org/10.1002/ecs2.3824
