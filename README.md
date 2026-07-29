# San Emilio Forest Dynamic Plot Website

Starter project for a standalone San Emilio FDP website.

## Structure

- `index.html` - Homepage sections for overview, map, species, data, and contact.
- `assets/css/styles.css` - Site styles.
- `assets/js/main.js` - Lightweight interactions.
- `assets/img/` - Images, figures, logos.
- `data/` - Small project data files (CSV/JSON) used by the site.

## Quick start

Open `index.html` directly in a browser for local preview.

## GitHub-based website setup

This project is configured for GitHub Pages using a workflow at `.github/workflows/deploy-pages.yml`.

1. Create the repository named `SanEmilioForestDynamicsPlot_Website` on GitHub.
2. Push this folder to the repository and set the default branch to `main`.
3. In GitHub, go to Settings -> Pages and set Source to `GitHub Actions`.
4. Push changes to `main`; the workflow will deploy the site automatically.

The live site URL will be:

`https://<your-github-username>.github.io/SanEmilioForestDynamicsPlot_Website/`

## Suggested next steps

1. Add plot coordinates, map assets, and census summaries.
2. Add partner logos and team contact information.
3. Connect project data summaries from the `data/` folder to the page.
