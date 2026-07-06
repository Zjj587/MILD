# MILD.github.io

MILD: A Manipulation Interface Localization Dataset for UMI-Style Robot Teaching

This repository hosts the static GitHub Pages website for the MILD benchmark.

## Local preview

Open `index.html` directly in a browser, or serve the repository root with any
static file server:

```bash
python3 -m http.server 8000
```

## Content to replace before release

- Replace `static/images/hero-mild-concept.png` with an approved project image if
  a real dataset photo is available.
- Replace the illustrative task images under `static/images/tasks/` with the
  corresponding real task photos when available.
- Replace each `Dataset pending` link with a stable public dataset URL.
- Add a public sequence manifest for each task entry, including original data,
  ArUco layouts, AprilTag family layouts, marker count, appearance variant, and
  sequence identifiers.
- Update citation metadata after the paper and release URL are finalized.
