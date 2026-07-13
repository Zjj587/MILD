# https://zjj587.github.io/MILD/

MILD: A Manipulation Interface Localization Dataset for UMI-Style Robot Teaching

This repository hosts the static GitHub Pages website for the MILD benchmark.

## Current website content

- Static HTML/CSS/JS only; no build step is required.
- The overview and `v0 Snapshot` section summarize the current pre-release
  collected data inventory: 15 task folders, 6 organized scene settings per task,
  2 sensors, and 88 usable sensor sequences.
- The task explorer mirrors the current 15 collected v0 task folders.
- Curated website previews are stored under `static/images/pic/` with
  `task/`, `scenes/`, and `sensor/` subfolders derived from the approved v0
  `pic` assets. Axis-free motion-pattern trajectory shapes are stored under
  `static/images/pic/trajectories/` and generated from Teleoperation TUM files.
- Large raw data, rosbag files, frame dumps, and calibration artifacts are not
  stored in this website repository. They should be published as GitHub Release
  assets or external dataset downloads with a manifest.

## Local preview

Open `index.html` directly in a browser, or serve the repository root with any
static file server:

```bash
python3 -m http.server 8000
```

## Content to replace before release

- Refresh `static/images/pic/` only when newer approved v0 preview photos are
  available.
- Regenerate `static/images/pic/trajectories/` if the Analemma, Circular, or
  Zigzag Teleoperation TUM files change.
- Upload the planned calibration release assets for Insta360 X5 and Insight9,
  including intrinsics, extrinsics, and manifest files.
- Add public sequence manifests for each collected scene folder, including
  original data, ArUco layouts, AprilTag Custom48h12 layouts, marker count,
  appearance variant, sensor availability, and sequence identifiers.
- Keep scene-level release assets aligned with the finalized v0 manifest.
- Update citation metadata after the paper and release URL are finalized.
