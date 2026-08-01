# San Emilio Forest Dynamics Plot Website

Single-page research website for the San Emilio Forest Dynamics Plot (SEFDP), designed as a GitHub Pages site.

## Structure

- `index.html` - Photo-led editorial site with plot story, census chronicle, presentation, findings, publications, maps, archive, and access links.
- `assets/css/styles.css` - Enquist Lab-inspired visual system, responsive layouts, and slideshow components.
- `assets/js/main.js` - Navigation, slide viewer, autoplay controls, active section highlighting, findings, and publication rendering.
- `assets/img/photos/` - Local San Emilio field and site photos used directly by the page.
- `assets/img/figures/` - Local San Emilio figure assets used by media and dashboard sections.
- `assets/presentation/` - Original PowerPoint deck plus 46 optimized slide images and thumbnails.
- `data/slides.json` - Extracted slide titles, transcripts, chapter labels, and image paths.
- `data/publications.json` - Structured publication metadata used to render the publications section.
- `data/findings.json` - Dashboard findings entries with census-period tags and figure references.
- `scripts/export_presentation.py` - Reproducible PDF-to-WebP slide renderer and PowerPoint text extractor.

## Quick start

Run a local server so JSON-backed sections load correctly:

```bash
python3 -m http.server 8088
```

Then open `http://127.0.0.1:8088/SanEmilioForestDynamicsPlot_Website/` when serving from the workspace root.

## Presentation workflow

The website uses static WebP renders for fast, reliable slide viewing and keeps the original PowerPoint as a download.
To regenerate slides after editing the deck:

1. Export the PowerPoint to PDF at `/tmp/SanEmilio_Presentation_ForestGeo4.pdf`.
2. Install `pypdfium2` and Pillow for the configured Python environment.
3. Run:

```bash
python3 scripts/export_presentation.py \
	--pptx assets/presentation/SanEmilio_Presentation_ForestGeo4.pptx \
	--pdf /tmp/SanEmilio_Presentation_ForestGeo4.pdf \
	--output assets/presentation
```

The script validates that the PowerPoint slide count matches the PDF page count, renders full slides and thumbnails, and rewrites `data/slides.json`.

## GitHub-based website setup

This project is configured for GitHub Pages using a workflow at `.github/workflows/deploy-pages.yml`.

1. Create the repository named `SanEmilioForestDynamicsPlot_Website` on GitHub.
2. Push this folder to the repository.
3. In GitHub, go to Settings -> Pages and set Source to `GitHub Actions`.
4. Push changes to `main` or `master`; the workflow will deploy automatically.

The live site URL will be:

`https://<your-github-username>.github.io/SanEmilioForestDynamicsPlot_Website/`

## Interaction notes

- Slideshow autoplay is off by default and stops on manual navigation, pointer interaction, keyboard focus, or page visibility changes.
- Slides support horizontal touch/trackpad scrolling and `ArrowLeft`, `ArrowRight`, `Home`, `End`, and `Space` keyboard controls.
- Every slide remains available through the thumbnail panel and extracted text transcript.
- Reduced-motion preferences disable nonessential transitions and autoplay.

## Core source grounding used in current copy

- ForestGEO San Emilio site: https://forestgeo.si.edu/sites/san-emilio
- Enquist and Enquist 2011 (Global Change Biology): https://doi.org/10.1111/j.1365-2486.2010.02326.x
- Swenson et al. 2020 (Ecological Monographs): https://doi.org/10.1002/ecm.1408
- Huang et al. 2021 (Ecosphere): https://doi.org/10.1002/ecs2.3824
