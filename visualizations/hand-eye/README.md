# Interactive X5 and Insight9 Hand-Eye Viewer

This static Three.js page visualizes the existing X5 and Insight9 sensor poses in robot end-effector coordinates. It does not run or refine calibration.

## Run

From the parent `pic` directory:

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/interactive/`.

The page uses only relative URLs. It can be hosted as a static directory or embedded by linking to `interactive/index.html`.

## Rebuild viewer data

```bash
python3 tools/build_interactive_handeye_data.py \
  --manifest metadata/website_handeye_figures_manifest.json \
  --x5-cam002-audit metadata/x5_cam002_kalibr_imu_candidate.json \
  --output interactive/data/handeye_devices.json
```

## Geometry scope

- X5 Cam001 uses the direct p015326 hand-eye result.
- X5 Cam002 is derived from Cam001 through the MC-Calib `T_Cam002_Cam001` camera-rig extrinsic.
- X5 physical IMU is derived from Cam001 through the Kalibr `T_Cam001_Imu` extrinsic; independent Cam002-IMU Kalibr remains audit-only.
- The separate `X5 Cam002 audit` mode composes `T_EE_Cam002_MC-Calib * T_Cam002_Imu_Kalibr`. It is excluded from the default Compare and X5 views and does not replace the frozen public chain.
- Insight9 left gray uses the optimized direct hand-eye result.
- Insight9 right gray, RGB, and physical IMU are chained from left gray through the captured factory static extrinsics.
- Sensors use axes-only rendering: camera cubes and IMU cuboids are not drawn.
- Each visible coordinate axis is a real cylinder shaft plus cone arrowhead (`26 mm` total length, `0.8 mm` shaft radius, `1.6 mm` head radius), so thickness is consistent across WebGL implementations.
- Labels use `11 px` text and are staggered near selected local-axis endpoints (`+Z`, `+X`, or `+Y`) with a `6 mm` tip gap. Their positions follow each sensor quaternion while the sprites remain camera-facing.
- The invisible `9 mm` hit sphere and the coordinate arrows remain selectable even though no body marker is visible.
- Robot EE also uses axes-only rendering: its flange cylinder and center sphere are omitted, and its label sits just beyond the `+Z` axis tip.
- X5 scene labels are `cam01`, `cam02`, and `imu`; the robot end-effector scene label is `End Effector`. The inspector keeps full calibrated sensor names and source chains. Insight9 scene labels remain descriptive so left gray, right gray, RGB, and IMU are distinguishable.

Runtime dependencies are vendored under `interactive/vendor/`. The local verification environment did not contain Playwright, so the checked-in verifier drives the system Chrome directly and records that limitation:

```bash
python3 tools/verify_interactive_handeye_viewer.py
```
