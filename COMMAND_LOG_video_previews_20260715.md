# MILD sequence video preview command log

Timestamp: 2026-07-15, Asia/Shanghai
Member: nova
Working directory: `/media/zjj/Elements/CQU_ZJJ/MILD`

## Scope

Build reproducible website-preview videos for the current MILD v0 usable sensor
sequences. Source data is read from `/media/zjj/Elements/CQU_ZJJ/UMID/data/v0`.
Generated videos are written outside the website git repository under
`/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0`.

Rule 16 visual boundary: no `view_image`, no screenshots or video frames loaded
into chat context. Validation used file metadata, manifests, counts, dimensions,
and `ffprobe` only.

## Commands And Evidence

### 1. Repository and media inspection

```bash
git status --short
sed -n '1,220p' README.md
sed -n '1,220p' COMMAND_LOG_update_site_from_umid_v0_20260712.md
sed -n '1,620p' static/js/site.js
find /media/zjj/Elements/CQU_ZJJ/UMID/data/v0 -maxdepth 7 -type d \( -name 'instan360x5' -o -name 'insight9' \) | sort
ffmpeg -version | sed -n '1,6p'
ffprobe -version | sed -n '1,3p'
```

Status: success.

Key findings:

- The website inventory source is `static/js/site.js` with 67 usable
  `insta360_x5` sequences and 21 usable `insight9` sequences.
- Raw scan found 67 X5 `stream_0.h264` directories and 39 Insight9 gray-frame
  directories, so the converter intentionally follows the website usable list
  and does not publish every raw Insight9 directory.
- X5 sample metadata reports `resolution: 3840x1920p30`, `view_mode: dual`.
- Insight9 sample layout contains `gray_left/*.pgm` and `gray_right/*.pgm`.
- `ffmpeg` and `ffprobe` are available.

### 2. Converter script

Tool: `apply_patch`

Created:

```text
scripts/build_sequence_videos.py
```

Status: success.

Behavior:

- Dry-run by default; `--convert` runs `ffmpeg`.
- Uses the current website usable sequence inventory: 88 sensor sequences.
- X5 output: `insta360_x5_front_fisheye.mp4` and
  `insta360_x5_back_fisheye.mp4`, cropped from the two halves of the dual
  3840x1920 stream and scaled to 960x960 H.264/yuv420p.
- Insight9 output: `insight9_left_gray.mp4` and `insight9_right_gray.mp4`,
  encoded from `gray_left` and `gray_right` PGM sequences with FPS estimated
  from filename timestamps.
- Default output root:
  `/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0`.

### 3. Dry run and sample conversion

```bash
python3 -m py_compile scripts/build_sequence_videos.py
python3 scripts/build_sequence_videos.py --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0/dry_run_manifest.json
python3 scripts/build_sequence_videos.py --output-root /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/x5_sample_manifest.json --task "Box 02" --sensor insta360_x5 --limit 1 --convert --force --max-seconds 3
python3 scripts/build_sequence_videos.py --output-root /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/i9_sample_manifest.json --task "Box 02" --sensor insight9 --limit 1 --convert --force --max-seconds 3
```

Status: success.

Evidence:

```text
dry run: sequences=88 views=176 sensors={'insta360_x5': 67, 'insight9': 21}
dry run: missing_inputs=0 existing_outputs=0
X5 sample: converted=2, 960x960, 3.003s, 90 frames each
Insight9 sample: converted=2, 544x640, 3.001s, 60 frames each
```

Sample files:

```text
/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/box02/table/insta360_x5_front_fisheye.mp4
/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/box02/table/insta360_x5_back_fisheye.mp4
/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/box02/table/insight9_left_gray.mp4
/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sample/box02/table/insight9_right_gray.mp4
```

### 4. Full conversion

```bash
python3 scripts/build_sequence_videos.py --convert --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0/sequence_video_manifest.json
```

Status: success.

Final script output:

```text
manifest=/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0/sequence_video_manifest.json
sequences=88 views=176 sensors={'insta360_x5': 67, 'insight9': 21}
missing_inputs=0 existing_outputs=176
conversion_status_counts={'converted': 176}
```

Observed warning class during conversion:

```text
Error while decoding stream #0:0: Invalid data found when processing input
cabac decode of qscale diff failed ...
overflow in decode_cabac_mb_mvd ...
```

The warning-producing source streams did not stop conversion; all resulting MP4
files were validated with `ffprobe` in step 5. These warnings should still be
kept in mind when visually reviewing or release-checking the affected source
streams later.

### 5. Output validation

```bash
python3 - <<'PY'
import json
from collections import Counter
from pathlib import Path
p=Path('/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0/sequence_video_manifest.json')
data=json.loads(p.read_text())
print(data['sequence_count'], data['view_count'], data['missing_input_count'], data['existing_output_count'])
print(Counter(seq['sensor'] for seq in data['sequences']))
PY

python3 - <<'PY'
from pathlib import Path
root=Path('/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0')
files=sorted(root.rglob('*.mp4'))
print(len(files), sum(p.stat().st_size for p in files), sum(1 for p in files if p.stat().st_size == 0))
PY

python3 - <<'PY'
import json, subprocess
from pathlib import Path
root=Path('/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0')
fail=[]
invalid=[]
summary={}
for path in sorted(root.rglob('*.mp4')):
    out=subprocess.check_output([
        'ffprobe','-v','error','-select_streams','v:0',
        '-show_entries','stream=codec_name,width,height,pix_fmt,duration,nb_frames',
        '-show_entries','format=duration,size','-of','json',str(path)
    ], stderr=subprocess.STDOUT, text=True)
    data=json.loads(out)
    stream=(data.get('streams') or [{}])[0]
    fmt=data.get('format') or {}
    width=int(stream.get('width') or 0)
    height=int(stream.get('height') or 0)
    duration=float((stream.get('duration') or fmt.get('duration') or 0) or 0)
    frames=int(stream.get('nb_frames') or 0)
    codec=stream.get('codec_name')
    pix_fmt=stream.get('pix_fmt')
    if codec != 'h264' or pix_fmt != 'yuv420p' or width <= 0 or height <= 0 or duration <= 0 or frames <= 0:
        invalid.append(str(path.relative_to(root)))
    key=(width,height)
    info=summary.setdefault(key, {'count':0, 'min_duration':duration, 'max_duration':duration})
    info['count']+=1
    info['min_duration']=min(info['min_duration'], duration)
    info['max_duration']=max(info['max_duration'], duration)
print('invalid_streams', len(invalid))
print(summary)
PY
```

Status: success.

Evidence:

```text
manifest: sequence_count=88, view_count=176, missing_input_count=0, existing_output_count=176
sensor_counts: {'insta360_x5': 67, 'insight9': 21}
mp4_count=176
total_size_bytes=817496238
total_size_mb=779.63
zero_size_count=0
ffprobe_failures=0
invalid_streams=0
dimension_summary:
  (544, 640): count=42, min_duration=5.900221, max_duration=133.455338
  (960, 960): count=134, min_duration=49.015633, max_duration=288.655033
```

Task-level output counts:

```text
analemma_2_t 18
bookshelf01_2 14
bookshelf02_2 16
box01 8
box02 10
circular_2_t 18
grab_place01_t 10
grab_place02_t 8
grab_place03_t 8
grab_place04 6
grab_place05 6
grab_place06_t 8
wiping01 6
wiping02_1 18
zigzag_2_t 22
```

### 6. Repository status

```bash
git status --short
```

Status: success.

Current tracked change from this task:

```text
?? scripts/
?? COMMAND_LOG_video_previews_20260715.md
```

Generated MP4 files and generated manifests are outside the git repository.

### 7. Correction: switch combined videos to rosbag-sync logic

User correction: preview videos must use the same time synchronization logic as
the rosbag conversion, not an independently inferred raw-file crop.

Status: corrected approach implemented in `scripts/build_sequence_videos.py`
`--mode combined-sync`.

Rosbag-sync sources inspected:

```text
/media/zjj/Elements/CQU_ZJJ/UMID/scripts/prepare_replay_bag.py
/media/zjj/Elements/CQU_ZJJ/insight9/tool/insight9_sync_rosbag/prepare_insight9_replay_bag.py
```

Key sync rules now mirrored:

- X5: use `video_packets.csv` SDK timestamps plus median SDK-host offset, then
  select `frame_start_idx..frame_end_idx` within
  `max(replay_start_ns, tum_start_ns)..min(replay_end_ns, tum_end_ns)`.
- Insight9: use `device_timestamp + device_host_offset_ns` with the same
  robot/TUM window, selecting gray-left and gray-right frames only when they
  overlap the robot replay window.
- X5 front/back are hstacked into one `1920x960` MP4; Insight9 left/right are
  hstacked into one `1088x640` MP4 when valid frames exist.

Commands:

```bash
python3 -S -m py_compile /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --task 'Box 02' --sensor insta360_x5 \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/box02_x5_rosbag_sync_dry_run_manifest.json

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --task 'Box 02' --sensor insight9 \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/box02_insight9_rosbag_sync_dry_run_manifest.json

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --task 'Box 02' --sensor insta360_x5 --limit 1 \
  --output-root /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined_sample \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined_sample/box02_x5_rosbag_sync_sample_manifest.json \
  --convert --force --max-seconds 5

ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,pix_fmt,duration,nb_frames \
  -show_entries format=duration,size -of json \
  /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined_sample/box02/table/insta360_x5_front_back_sync.mp4
```

Evidence:

```text
Box02 X5 dry-run:
  sequences=3
  positive_overlap=3
  table: selected=6021, frame=322..6342, duration=200.898395136s
  aruco_4: selected=6034, frame=490..6523, duration=201.341445120s
  apriltag_4: selected=5960, frame=581..6540, duration=198.857059072s

Box02 Insight9 dry-run:
  sequences=2
  positive_overlap=0
  table: left=0, right=0, selected=0
  aruco_4: left=0, right=0, selected=0

Box02 X5 5s rosbag-sync sample:
  selected=150
  frame=322..471
  output_exists=True
  output_size_bytes=825080
  ffprobe: h264, 1920x960, yuv420p, duration=5.005000s, nb_frames=150
```

Notes:

- The earlier split-view videos under
  `/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0` are not final website
  sync videos.
- A prior output-side/input-side `-ss` sample produced an empty MP4 when used
  against raw H.264; that route was abandoned.
- No `view_image` was used.

### 8. Full rosbag-sync combined conversion

Optimization before full conversion:

- X5 conversion now reuses the existing split MP4 intermediates under
  `/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0` as frame-ordered sources,
  then applies the rosbag `frame_start_idx..frame_end_idx` selection and hstacks
  front/back. This avoids re-decoding/cropping the 3840x1920 raw H.264 stream.
- When an existing X5 aligned summary exists, the converter parses
  `*_x5_camera_imu_tum_aligned_summary.txt` directly for frame indices and
  timing. Otherwise it computes the same indices from `video_packets.csv`.

Commands:

```bash
python3 -S -m py_compile /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --sensor insta360_x5 \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/x5_rosbag_sync_dry_run_manifest.json

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --sensor insight9 \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/insight9_rosbag_sync_dry_run_manifest.json

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --sensor insta360_x5 --convert \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/x5_rosbag_sync_manifest.json

python3 -S /media/zjj/Elements/CQU_ZJJ/MILD/scripts/build_sequence_videos.py \
  --mode combined-sync --sensor insight9 --convert \
  --manifest /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/insight9_rosbag_sync_manifest.json
```

Dry-run evidence:

```text
X5:
  sequences=67
  positive_overlap=67
  summary_reused=15
  selected_min_max=975..6034
  duration_min_max=32.534872576..201.341445120

Insight9:
  sequences=21
  positive_overlap=19
  selected_min_max=0..2195
  skipped zero-selected sequences:
    box02__table__insight9
    box02__aruco_4__insight9
```

Conversion evidence:

```text
X5:
  manifest=/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/x5_rosbag_sync_manifest.json
  sequences=67
  positive_overlap=67
  existing_outputs=67
  status_counts={'converted': 67}

Insight9:
  manifest=/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined/insight9_rosbag_sync_manifest.json
  sequences=21
  positive_overlap=19
  existing_outputs=19
  status_counts={'converted': 19, 'skipped_no_overlap': 2}
```

Output validation:

```bash
python3 -S - <<'PY'
# ffprobe every MP4 under /media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined
PY
```

Result:

```text
mp4_count=86
total_size_bytes=700874885
total_size_mb=668.41
ffprobe_failures=0
invalid_streams=0
(1088, 640): count=19, min_duration=17.4, max_duration=109.84, min_frames=348, max_frames=2196
(1920, 960): count=67, min_duration=32.2322, max_duration=199.165633, min_frames=966, max_frames=5969
```

Final output root:

```text
/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined
```
