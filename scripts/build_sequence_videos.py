#!/usr/bin/env python3
"""Build web preview videos for the current MILD v0 usable sequences.

The website repository stays small: generated videos are written to an external
artifact directory by default. The availability table mirrors the current
release-facing inventory in static/js/site.js.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Iterable


DEFAULT_DATA_ROOT = Path("/media/zjj/Elements/CQU_ZJJ/UMID/data/v0")
DEFAULT_OUTPUT_ROOT = Path("/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0")
DEFAULT_SYNC_OUTPUT_ROOT = Path("/media/zjj/Elements/CQU_ZJJ/MILD_video_previews/v0_sync_combined")

TASK_SLUGS = {
    "Analemma": "analemma_2_t",
    "Bookshelf 01": "bookshelf01_2",
    "Bookshelf 02": "bookshelf02_2",
    "Box 01": "box01",
    "Box 02": "box02",
    "Circular": "circular_2_t",
    "Grab Place 01": "grab_place01_t",
    "Grab Place 02": "grab_place02_t",
    "Grab Place 03": "grab_place03_t",
    "Grab Place 04": "grab_place04",
    "Grab Place 05": "grab_place05",
    "Grab Place 06": "grab_place06_t",
    "Wiping 01": "wiping01",
    "Wiping 02": "wiping02_1",
    "Zigzag": "zigzag_2_t",
}

TASK_DIRS = {
    "Analemma": "Analemma_2_t",
    "Bookshelf 01": "Bookshelf01_2",
    "Bookshelf 02": "Bookshelf02_2",
    "Box 01": "Box01",
    "Box 02": "Box02",
    "Circular": "Circular_2_t",
    "Grab Place 01": "Grab_Place01_t",
    "Grab Place 02": "Grab_Place02_t",
    "Grab Place 03": "Grab_Place03_t",
    "Grab Place 04": "Grab_Place04",
    "Grab Place 05": "Grab_Place05",
    "Grab Place 06": "Grab_Place06_t",
    "Wiping 01": "Wiping01",
    "Wiping 02": "Wiping02_1",
    "Zigzag": "Zigzag_2_t",
}

COLLECTED_SCENES = [
    {
        "name": "Analemma",
        "variants": "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
        "insight9Variants": "table, tablecloth, ArUco 4",
    },
    {
        "name": "Bookshelf 01",
        "variants": "table, ArUco 2/4, AprilTag Custom48h12 2/4",
        "insight9Variants": "table, ArUco 4",
    },
    {
        "name": "Bookshelf 02",
        "variants": "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
        "insight9Variants": "table, ArUco 4",
    },
    {
        "name": "Box 01",
        "variants": "table, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "ArUco 4",
    },
    {
        "name": "Box 02",
        "variants": "table, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "table, ArUco 4",
    },
    {
        "name": "Circular",
        "variants": "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
        "insight9Variants": "table, tablecloth, ArUco 4",
    },
    {
        "name": "Grab Place 01",
        "variants": "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "table",
    },
    {
        "name": "Grab Place 02",
        "variants": "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Grab Place 03",
        "variants": "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Grab Place 04",
        "variants": "table, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Grab Place 05",
        "variants": "table, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Grab Place 06",
        "variants": "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Wiping 01",
        "variants": "table, ArUco 4, AprilTag Custom48h12 4",
        "insight9Variants": "none",
    },
    {
        "name": "Wiping 02",
        "variants": "table, ArUco 1/2/4, AprilTag Custom48h12 1/2/4",
        "insight9Variants": "table, ArUco 4",
    },
    {
        "name": "Zigzag",
        "variants": "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
        "insight9Variants": "table, tablecloth, ArUco 2/4, AprilTag 2",
    },
]


@dataclass(frozen=True)
class ViewPlan:
    label: str
    input_kind: str
    input_path: Path
    output_path: Path
    fps: float | None = None
    ffmpeg_filter: str | None = None
    frame_count: int | None = None


@dataclass(frozen=True)
class SequencePlan:
    task_title: str
    task_slug: str
    task_dir: str
    scene_label: str
    scene_slug: str
    sensor: str
    sensor_dir: Path
    views: tuple[ViewPlan, ...]

    @property
    def sequence_id(self) -> str:
        return f"{self.task_slug}__{self.scene_slug}__{self.sensor}"


@dataclass(frozen=True)
class SyncSequencePlan:
    task_title: str
    task_slug: str
    task_dir: str
    scene_label: str
    scene_slug: str
    sensor: str
    sensor_dir: Path
    robot_tum_path: Path | None
    output_path: Path

    @property
    def sequence_id(self) -> str:
        return f"{self.task_slug}__{self.scene_slug}__{self.sensor}"


def normalize(value: str) -> str:
    return value.strip().lower()


def scene_key(value: str) -> str:
    value = normalize(value).replace("custom48h12", "")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def scene_slug(value: str) -> str:
    return scene_key(value).replace(" ", "_")


def expand_variant_list(value: str) -> list[str]:
    if not value or normalize(value) == "none":
        return []

    expanded: list[str] = []
    for item in value.split(","):
        label = item.strip().rstrip(".")
        if not label:
            continue

        match = re.match(r"^(.*?)(\d+(?:/\d+)*)$", label)
        if not match:
            expanded.append(label)
            continue

        prefix = match.group(1).strip()
        expanded.extend(f"{prefix} {count}" for count in match.group(2).split("/"))
    return expanded


def data_scene_parts(label: str) -> tuple[str, ...]:
    key = scene_key(label)
    if key == "table":
        return ("orin",)
    if key == "tablecloth":
        return ("tablecloth",)
    if key.startswith("aruco "):
        return ("aruco", key.split()[-1])
    if key.startswith("apriltag "):
        return ("apriltag", "custom48h12", key.split()[-1])
    raise ValueError(f"Unsupported scene label: {label}")


def parse_timestamp(path: Path) -> int | None:
    match = re.search(r"_ts(\d+)", path.name)
    return int(match.group(1)) if match else None


def estimate_pgm_fps(files: list[Path]) -> float:
    stamps = [ts for ts in (parse_timestamp(path) for path in files) if ts is not None]
    if len(stamps) < 2:
        return 20.0

    deltas = [b - a for a, b in zip(stamps, stamps[1:]) if b > a]
    if not deltas:
        return 20.0

    fps = 1_000_000_000 / median(deltas)
    return max(1.0, min(60.0, fps))


def collect_plans(data_root: Path, output_root: Path) -> list[SequencePlan]:
    plans: list[SequencePlan] = []
    for task in COLLECTED_SCENES:
        task_title = task["name"]
        task_slug = TASK_SLUGS[task_title]
        task_dir = TASK_DIRS[task_title]
        insight_keys = {scene_key(value) for value in expand_variant_list(task["insight9Variants"])}

        for label in expand_variant_list(task["variants"]):
            slug = scene_slug(label)
            parts = data_scene_parts(label)

            x5_dir = data_root / task_dir / Path(*parts) / "instan360x5"
            x5_input = x5_dir / "stream_0.h264"
            x5_output_dir = output_root / task_slug / slug
            plans.append(
                SequencePlan(
                    task_title=task_title,
                    task_slug=task_slug,
                    task_dir=task_dir,
                    scene_label=label,
                    scene_slug=slug,
                    sensor="insta360_x5",
                    sensor_dir=x5_dir,
                    views=(
                        ViewPlan(
                            label="front_fisheye",
                            input_kind="h264",
                            input_path=x5_input,
                            output_path=x5_output_dir / "insta360_x5_front_fisheye.mp4",
                            ffmpeg_filter="crop=iw/2:ih:0:0,scale=960:960:flags=lanczos",
                        ),
                        ViewPlan(
                            label="back_fisheye",
                            input_kind="h264",
                            input_path=x5_input,
                            output_path=x5_output_dir / "insta360_x5_back_fisheye.mp4",
                            ffmpeg_filter="crop=iw/2:ih:iw/2:0,scale=960:960:flags=lanczos",
                        ),
                    ),
                )
            )

            if scene_key(label) in insight_keys:
                i9_dir = data_root / task_dir / Path(*parts) / "insight9" / "insight9"
                left_files = sorted((i9_dir / "gray_left").glob("left_*.pgm"))
                right_files = sorted((i9_dir / "gray_right").glob("right_*.pgm"))
                fps = estimate_pgm_fps(left_files)
                i9_output_dir = output_root / task_slug / slug
                plans.append(
                    SequencePlan(
                        task_title=task_title,
                        task_slug=task_slug,
                        task_dir=task_dir,
                        scene_label=label,
                        scene_slug=slug,
                        sensor="insight9",
                        sensor_dir=i9_dir,
                        views=(
                            ViewPlan(
                                label="left_gray",
                                input_kind="pgm_glob",
                                input_path=i9_dir / "gray_left" / "left_*.pgm",
                                output_path=i9_output_dir / "insight9_left_gray.mp4",
                                fps=fps,
                                frame_count=len(left_files),
                            ),
                            ViewPlan(
                                label="right_gray",
                                input_kind="pgm_glob",
                                input_path=i9_dir / "gray_right" / "right_*.pgm",
                                output_path=i9_output_dir / "insight9_right_gray.mp4",
                                fps=fps,
                                frame_count=len(right_files),
                            ),
                        ),
                    )
                )
    return plans


def parse_tum_timestamp(line: str) -> float | None:
    if not line.strip() or line.startswith("#"):
        return None
    try:
        return float(line.split()[0])
    except (IndexError, ValueError):
        return None


def json_robot_time_range(tum_path: Path) -> tuple[float, float, int] | None:
    path = tum_path.with_suffix(".json")
    if not path.is_file():
        return None

    try:
        text = subprocess.run(
            ["head", "-n", "360", str(path)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        ).stdout
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None

    start_match = re.search(r'"replay_started_host_time_ns"\s*:\s*(\d+)', text)
    end_match = re.search(r'"replay_ended_host_time_ns"\s*:\s*(\d+)', text)
    if not start_match or not end_match:
        return None
    start = int(start_match.group(1)) / 1_000_000_000
    end = int(end_match.group(1)) / 1_000_000_000
    return start, end, 0


def replay_time_range_ns(tum_path: Path | None) -> tuple[int, int] | None:
    if tum_path is None:
        return None
    path = tum_path.with_suffix(".json")
    if not path.is_file():
        return None

    try:
        text = subprocess.run(
            ["head", "-n", "360", str(path)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        ).stdout
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None

    start_match = re.search(r'"replay_started_host_time_ns"\s*:\s*(\d+)', text)
    end_match = re.search(r'"replay_ended_host_time_ns"\s*:\s*(\d+)', text)
    if not start_match or not end_match:
        return None
    return int(start_match.group(1)), int(end_match.group(1))


def tum_file_time_range_ns(path: Path | None) -> tuple[int, int, int] | None:
    if path is None:
        return None

    try:
        head = subprocess.run(
            ["head", "-n", "32", str(path)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        ).stdout.splitlines()
        tail = subprocess.run(
            ["tail", "-c", "8192", str(path)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        ).stdout.splitlines()
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None

    first = next((timestamp for line in head if (timestamp := parse_tum_timestamp(line)) is not None), None)
    last = next((timestamp for line in reversed(tail) if (timestamp := parse_tum_timestamp(line)) is not None), None)
    if first is None or last is None:
        return None
    return int(round(first * 1_000_000_000)), int(round(last * 1_000_000_000)), 0


def first_last_tum_time(path: Path | None) -> tuple[float, float, int] | None:
    tum_range = tum_file_time_range_ns(path)
    if tum_range is None:
        return None
    return tum_range[0] / 1_000_000_000, tum_range[1] / 1_000_000_000, tum_range[2]


def parse_csv_timestamp(line: str, index: int) -> float | None:
    try:
        row = next(csv.reader([line]))
        return int(row[index]) / 1_000_000_000
    except (IndexError, StopIteration, TypeError, ValueError):
        return None


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as file:
        return list(csv.DictReader(file))


def ns_to_sec(value: int) -> float:
    return value / 1_000_000_000


def robot_sync_window_ns(plan: SyncSequencePlan, max_seconds: float | None = None) -> tuple[int, int] | None:
    replay = replay_time_range_ns(plan.robot_tum_path)
    tum = tum_file_time_range_ns(plan.robot_tum_path)
    if replay is None or tum is None:
        return None

    start = max(replay[0], tum[0])
    end = min(replay[1], tum[1])
    if max_seconds is not None:
        end = min(end, start + int(round(max_seconds * 1_000_000_000)))
    if start >= end:
        return None
    return start, end


def build_task_tum_lookup(task_root: Path) -> dict[Path, Path]:
    if not task_root.is_dir():
        return {}

    cmd = [
        "find",
        str(task_root),
        "-maxdepth",
        "5",
        "(",
        "-path",
        "*/instan360x5",
        "-o",
        "-path",
        "*/insight9/insight9",
        "-o",
        "-path",
        "*/pico",
        "-o",
        "-path",
        "*/Teleoperation",
        ")",
        "-prune",
        "-o",
        "-type",
        "f",
        "-name",
        "left_*.tum",
        "-print",
    ]
    try:
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except (OSError, subprocess.CalledProcessError):
        return {}

    lookup: dict[Path, Path] = {}
    for line in sorted(result.stdout.splitlines()):
        path = Path(line)
        lookup.setdefault(path.parent, path)
    return lookup


def first_robot_tum(root: Path, tum_lookup: dict[Path, Path]) -> Path | None:
    return tum_lookup.get(root)


def x5_session_range(sensor_dir: Path) -> tuple[float, float, int] | None:
    path = sensor_dir / "session.txt"
    values: dict[str, str] = {}
    try:
        with path.open(encoding="utf-8", errors="ignore") as file:
            for line in file:
                if ":" not in line:
                    continue
                key, value = line.split(":", 1)
                values[key.strip()] = value.strip()
    except OSError:
        return None

    try:
        start = int(values["started_host_time_ns"]) / 1_000_000_000
        end = int(values["ended_host_time_ns"]) / 1_000_000_000
    except (KeyError, TypeError, ValueError):
        return None
    return start, end, 0


def x5_session_start_ns(sensor_dir: Path) -> int | None:
    path = sensor_dir / "session.txt"
    try:
        with path.open(encoding="utf-8", errors="ignore") as file:
            for line in file:
                if line.startswith("started_host_time_ns:"):
                    return int(line.split(":", 1)[1].strip())
    except (OSError, ValueError):
        return None
    return None


def x5_video_frames(sensor_dir: Path) -> list[dict[str, int]]:
    frames: list[dict[str, int]] = []
    for row in load_rows(sensor_dir / "video_packets.csv"):
        try:
            sdk = int(row["sdk_timestamp"])
            host = int(row["host_time_ns"])
        except (KeyError, TypeError, ValueError):
            continue
        if sdk <= 0:
            continue
        frames.append({"sdk_ms": sdk, "host_ns": host})
    return frames


def parse_key_value_text(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    with path.open(encoding="utf-8", errors="ignore") as file:
        for line in file:
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            values[key.strip()] = value.strip()
    return values


def x5_rosbag_summary_sync(
    plan: SyncSequencePlan,
    max_seconds: float | None = None,
) -> dict[str, object] | None:
    summaries = sorted(plan.sensor_dir.glob("*_x5_camera_imu_tum_aligned_summary.txt"))
    if not summaries:
        return None

    try:
        values = parse_key_value_text(summaries[0])
        camera_start_ns = int(values["camera_start_ns"])
        frame_start = int(values["frame_start_idx"])
        frame_end = int(values["frame_end_idx"])
        frames_written = int(values["frames_written"])
        window_start_s = float(values["window_start_s"])
        window_duration_s = float(values["window_duration_s"])
        first_image_s = float(values["first_image_s"])
        last_image_s = float(values["last_image_s"])
        image_dt_median_ms = float(values["image_dt_median_ms"])
        sdk_host_offset_ns = int(values["sdk_host_offset_ns"])
    except (KeyError, TypeError, ValueError, OSError):
        return None

    fps = 1000.0 / image_dt_median_ms if image_dt_median_ms > 0 else 30.0
    selected_count = frames_written
    duration_s = window_duration_s
    if max_seconds is not None:
        selected_count = min(frames_written, max(1, int(round(max_seconds * fps))))
        duration_s = min(window_duration_s, max_seconds)
        frame_end = frame_start + selected_count - 1
        last_image_s = first_image_s + (selected_count - 1) / fps

    window_start_ns = camera_start_ns + int(round(window_start_s * 1_000_000_000))
    window_end_ns = window_start_ns + int(round(duration_s * 1_000_000_000))
    return {
        "sensor": plan.sensor,
        "sync_source": str(summaries[0]),
        "camera_start_ns": camera_start_ns,
        "window_start_ns": window_start_ns,
        "window_end_ns": window_end_ns,
        "window_duration_s": duration_s,
        "selected_count": selected_count,
        "frame_start_idx": frame_start,
        "frame_end_idx": frame_end,
        "first_image_ns": camera_start_ns + int(round(first_image_s * 1_000_000_000)),
        "last_image_ns": camera_start_ns + int(round(last_image_s * 1_000_000_000)),
        "fps": fps,
        "sdk_host_offset_ns": sdk_host_offset_ns,
    }


def x5_rosbag_sync(plan: SyncSequencePlan, max_seconds: float | None = None) -> dict[str, object] | None:
    summary_sync = x5_rosbag_summary_sync(plan, max_seconds=max_seconds)
    if summary_sync is not None:
        return summary_sync

    window = robot_sync_window_ns(plan, max_seconds=max_seconds)
    cam_start_ns = x5_session_start_ns(plan.sensor_dir)
    if window is None or cam_start_ns is None:
        return None

    try:
        frames = x5_video_frames(plan.sensor_dir)
    except OSError:
        return None
    if not frames:
        return None

    offsets = [frame["host_ns"] - frame["sdk_ms"] * 1_000_000 for frame in frames]
    sdk_host_offset_ns = int(median(offsets))

    selected: list[dict[str, int]] = []
    window_start_ns, window_end_ns = window
    for index, frame in enumerate(frames):
        time_ns = int(round(frame["sdk_ms"] * 1_000_000 + sdk_host_offset_ns))
        if window_start_ns <= time_ns <= window_end_ns:
            selected.append({"frame_idx": index, "time_ns": time_ns})

    if not selected:
        return {
            "sensor": plan.sensor,
            "camera_start_ns": cam_start_ns,
            "window_start_ns": window_start_ns,
            "window_end_ns": window_end_ns,
            "window_duration_s": ns_to_sec(window_end_ns - window_start_ns),
            "selected_count": 0,
            "sdk_host_offset_ns": sdk_host_offset_ns,
        }

    times = [sample["time_ns"] for sample in selected]
    if len(times) >= 2:
        fps = 1_000_000_000 / median([b - a for a, b in zip(times, times[1:]) if b > a])
        fps = max(1.0, min(60.0, fps))
    else:
        fps = 30.0
    return {
        "sensor": plan.sensor,
        "camera_start_ns": cam_start_ns,
        "window_start_ns": window_start_ns,
        "window_end_ns": window_end_ns,
        "window_duration_s": ns_to_sec(window_end_ns - window_start_ns),
        "selected_count": len(selected),
        "frame_start_idx": selected[0]["frame_idx"],
        "frame_end_idx": selected[-1]["frame_idx"],
        "first_image_ns": selected[0]["time_ns"],
        "last_image_ns": selected[-1]["time_ns"],
        "fps": fps,
        "sdk_host_offset_ns": sdk_host_offset_ns,
    }


def x5_host_range(sensor_dir: Path) -> tuple[float, float | None, int] | None:
    path = sensor_dir / "exposure.csv"
    session_range = x5_session_range(sensor_dir)
    first: float | None = None
    try:
        head = subprocess.run(
            ["head", "-n", "32", str(path)],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        ).stdout.splitlines()
        if not head:
            return session_range
        header = next(csv.reader([head[0]]))
        host_index = header.index("host_time_ns")
        for line in head[1:]:
            timestamp = parse_csv_timestamp(line, host_index)
            if timestamp is not None:
                first = timestamp
                break
        if first is None:
            return session_range
        return first, session_range[1] if session_range else None, 0
    except OSError:
        return session_range
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, StopIteration, ValueError):
        return session_range


def read_insight9_pairs(sensor_dir: Path) -> list[tuple[float, Path, Path]]:
    path = sensor_dir / "image_timestamps.csv"
    left_rows: list[tuple[float, Path]] = []
    right_rows: list[tuple[float, Path]] = []

    try:
        with path.open(newline="") as file:
            for row in csv.DictReader(file):
                stream = row.get("stream")
                if stream not in {"gray_left", "gray_right"}:
                    continue
                try:
                    timestamp = int(row["host_unix_ns"]) / 1_000_000_000
                    rel = row["relative_path"]
                except (KeyError, TypeError, ValueError):
                    continue
                target = (timestamp, sensor_dir / rel)
                if stream == "gray_left":
                    left_rows.append(target)
                else:
                    right_rows.append(target)
    except OSError:
        return []

    pair_count = min(len(left_rows), len(right_rows))
    pairs: list[tuple[float, Path, Path]] = []
    for index in range(pair_count):
        left_time, left_path = left_rows[index]
        right_time, right_path = right_rows[index]
        pairs.append((max(left_time, right_time), left_path, right_path))
    return pairs


def insight9_host_range(sensor_dir: Path) -> tuple[float, float, int] | None:
    pairs = read_insight9_pairs(sensor_dir)
    if not pairs:
        return None
    return pairs[0][0], pairs[-1][0], len(pairs)


def insight9_device_timestamp_ns(row: dict[str, str]) -> int:
    return int(row["device_timestamp"])


def insight9_median_offset(rows: list[dict[str, str]]) -> int | None:
    offsets: list[int] = []
    for row in rows:
        try:
            offsets.append(int(row["host_unix_ns"]) - insight9_device_timestamp_ns(row))
        except (KeyError, TypeError, ValueError):
            continue
    return int(median(offsets)) if offsets else None


def insight9_rosbag_sync(plan: SyncSequencePlan, max_seconds: float | None = None) -> dict[str, object] | None:
    window = robot_sync_window_ns(plan, max_seconds=max_seconds)
    if window is None:
        return None

    try:
        image_rows = load_rows(plan.sensor_dir / "image_timestamps.csv")
    except OSError:
        return None

    rgb_rows = [row for row in image_rows if row.get("stream") == "rgb_mjpeg"]
    offset_rows = rgb_rows or image_rows
    offset_ns = insight9_median_offset(offset_rows)
    if offset_ns is None:
        return None

    window_start_ns, window_end_ns = window
    selected_by_stream: dict[str, list[dict[str, object]]] = {"gray_left": [], "gray_right": []}
    for row in image_rows:
        stream = row.get("stream")
        if stream not in selected_by_stream:
            continue
        try:
            time_ns = insight9_device_timestamp_ns(row) + offset_ns
            rel = row["relative_path"]
        except (KeyError, TypeError, ValueError):
            continue
        if window_start_ns <= time_ns <= window_end_ns:
            selected_by_stream[stream].append(
                {
                    "time_ns": time_ns,
                    "path": plan.sensor_dir / rel,
                }
            )

    left = selected_by_stream["gray_left"]
    right = selected_by_stream["gray_right"]
    pair_count = min(len(left), len(right))
    if pair_count <= 0:
        return {
            "sensor": plan.sensor,
            "window_start_ns": window_start_ns,
            "window_end_ns": window_end_ns,
            "window_duration_s": ns_to_sec(window_end_ns - window_start_ns),
            "selected_count": 0,
            "left_count": len(left),
            "right_count": len(right),
            "device_host_offset_ns": offset_ns,
        }

    times = [max(int(left[index]["time_ns"]), int(right[index]["time_ns"])) for index in range(pair_count)]
    if len(times) >= 2:
        fps = 1_000_000_000 / median([b - a for a, b in zip(times, times[1:]) if b > a])
        fps = max(1.0, min(60.0, fps))
    else:
        fps = 20.0

    return {
        "sensor": plan.sensor,
        "window_start_ns": window_start_ns,
        "window_end_ns": window_end_ns,
        "window_duration_s": ns_to_sec(window_end_ns - window_start_ns),
        "selected_count": pair_count,
        "left_count": len(left),
        "right_count": len(right),
        "left_paths": [left[index]["path"] for index in range(pair_count)],
        "right_paths": [right[index]["path"] for index in range(pair_count)],
        "first_image_ns": times[0],
        "last_image_ns": times[-1],
        "fps": fps,
        "device_host_offset_ns": offset_ns,
    }


def rosbag_sync_metadata(plan: SyncSequencePlan, max_seconds: float | None = None) -> dict[str, object] | None:
    if plan.sensor == "insta360_x5":
        return x5_rosbag_sync(plan, max_seconds=max_seconds)
    if plan.sensor == "insight9":
        return insight9_rosbag_sync(plan, max_seconds=max_seconds)
    return None


def media_time_range(plan: SyncSequencePlan) -> tuple[float, float | None, int] | None:
    if plan.sensor == "insta360_x5":
        return x5_host_range(plan.sensor_dir)
    if plan.sensor == "insight9":
        return insight9_host_range(plan.sensor_dir)
    return None


def overlap_range(
    media_range: tuple[float, float | None, int] | None,
    tum_range: tuple[float, float, int] | None,
    max_seconds: float | None = None,
) -> tuple[float, float, float] | None:
    if media_range is None or tum_range is None:
        return None

    start = max(media_range[0], tum_range[0])
    media_end = media_range[1] if media_range[1] is not None else tum_range[1]
    end = min(media_end, tum_range[1])
    if max_seconds is not None:
        end = min(end, start + max_seconds)
    duration = end - start
    if duration <= 0:
        return None
    return start, end, duration


def collect_sync_plans(
    data_root: Path,
    output_root: Path,
    task: str | None = None,
    sensor: str | None = None,
    limit: int | None = None,
) -> list[SyncSequencePlan]:
    plans: list[SyncSequencePlan] = []
    task_key = normalize(task).replace(" ", "_") if task else None
    sensor_key = normalize(sensor).replace("-", "_") if sensor else None

    for task in COLLECTED_SCENES:
        task_title = task["name"]
        task_slug = TASK_SLUGS[task_title]
        task_dir = TASK_DIRS[task_title]
        if task_key and task_key not in {normalize(task_title).replace(" ", "_"), task_slug}:
            continue

        task_root = data_root / task_dir
        tum_lookup = build_task_tum_lookup(task_root)
        insight_keys = {scene_key(value) for value in expand_variant_list(task["insight9Variants"])}

        for label in expand_variant_list(task["variants"]):
            slug = scene_slug(label)
            parts = data_scene_parts(label)
            scene_root = task_root / Path(*parts)

            if sensor_key in {None, "insta360_x5"}:
                x5_dir = scene_root / "instan360x5"
                plans.append(
                    SyncSequencePlan(
                        task_title=task_title,
                        task_slug=task_slug,
                        task_dir=task_dir,
                        scene_label=label,
                        scene_slug=slug,
                        sensor="insta360_x5",
                        sensor_dir=x5_dir,
                        robot_tum_path=first_robot_tum(scene_root, tum_lookup),
                        output_path=output_root / task_slug / slug / "insta360_x5_front_back_sync.mp4",
                    )
                )
                if limit and len(plans) >= limit:
                    return plans

            if scene_key(label) in insight_keys and sensor_key in {None, "insight9"}:
                i9_root = scene_root / "insight9"
                plans.append(
                    SyncSequencePlan(
                        task_title=task_title,
                        task_slug=task_slug,
                        task_dir=task_dir,
                        scene_label=label,
                        scene_slug=slug,
                        sensor="insight9",
                        sensor_dir=i9_root / "insight9",
                        robot_tum_path=first_robot_tum(i9_root, tum_lookup),
                        output_path=output_root / task_slug / slug / "insight9_left_right_sync.mp4",
                    )
                )
                if limit and len(plans) >= limit:
                    return plans
    return plans


def plan_input_exists(view: ViewPlan) -> bool:
    if view.input_kind == "h264":
        return view.input_path.is_file()
    if view.input_kind == "pgm_glob":
        return bool(sorted(view.input_path.parent.glob(view.input_path.name)))
    return False


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def convert_h264_view(view: ViewPlan, force: bool, crf: int, preset: str, max_seconds: float | None) -> str:
    if view.output_path.exists() and not force:
        return "exists"

    view.output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-fflags",
        "+genpts",
        "-i",
        str(view.input_path),
    ]
    if max_seconds:
        cmd.extend(["-t", f"{max_seconds:.3f}"])
    cmd.extend([
        "-an",
        "-vf",
        view.ffmpeg_filter or "scale=960:-2:flags=lanczos",
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(view.output_path),
    ])
    run(cmd)
    return "converted"


def convert_pgm_view(view: ViewPlan, force: bool, crf: int, preset: str, max_seconds: float | None) -> str:
    if view.output_path.exists() and not force:
        return "exists"

    view.output_path.parent.mkdir(parents=True, exist_ok=True)
    fps = view.fps or 20.0
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-framerate",
        f"{fps:.6f}",
        "-pattern_type",
        "glob",
        "-i",
        str(view.input_path),
    ]
    if max_seconds:
        cmd.extend(["-t", f"{max_seconds:.3f}"])
    cmd.extend([
        "-an",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos",
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(view.output_path),
    ])
    run(cmd)
    return "converted"


def convert_view(view: ViewPlan, force: bool, crf: int, preset: str, max_seconds: float | None) -> str:
    if not plan_input_exists(view):
        return "missing_input"
    if view.input_kind == "h264":
        return convert_h264_view(view, force=force, crf=crf, preset=preset, max_seconds=max_seconds)
    if view.input_kind == "pgm_glob":
        return convert_pgm_view(view, force=force, crf=crf, preset=preset, max_seconds=max_seconds)
    return "unsupported_input"


def shell_quote_concat_path(path: Path) -> str:
    return "'" + str(path).replace("'", "'\\''") + "'"


def write_concat_list(path: Path, entries: list[tuple[Path, float]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not entries:
        path.write_text("", encoding="utf-8")
        return

    lines: list[str] = []
    for image_path, duration in entries:
        lines.append(f"file {shell_quote_concat_path(image_path)}")
        lines.append(f"duration {max(duration, 0.001):.9f}")
    lines.append(f"file {shell_quote_concat_path(entries[-1][0])}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def selected_insight9_entries(
    sensor_dir: Path,
    start: float,
    end: float,
) -> tuple[list[tuple[Path, float]], list[tuple[Path, float]], int]:
    selected = [(timestamp, left, right) for timestamp, left, right in read_insight9_pairs(sensor_dir) if start <= timestamp <= end]
    if len(selected) < 2:
        return [], [], len(selected)

    durations: list[float] = []
    for index, (timestamp, _, _) in enumerate(selected):
        if index + 1 < len(selected):
            durations.append(max(selected[index + 1][0] - timestamp, 0.001))
        else:
            durations.append(max(median(durations), 0.001) if durations else 0.05)

    left_entries = [(left, durations[index]) for index, (_, left, _) in enumerate(selected)]
    right_entries = [(right, durations[index]) for index, (_, _, right) in enumerate(selected)]
    return left_entries, right_entries, len(selected)


def convert_sync_x5(
    plan: SyncSequencePlan,
    sync: dict[str, object],
    force: bool,
    crf: int,
    preset: str,
) -> str:
    input_path = plan.sensor_dir / "stream_0.h264"
    if not input_path.is_file():
        return "missing_input"
    if plan.output_path.exists() and not force:
        return "exists"

    selected_count = int(sync.get("selected_count") or 0)
    if selected_count <= 0:
        return "insufficient_overlap_frames"
    frame_start = int(sync["frame_start_idx"])
    frame_end = int(sync["frame_end_idx"])
    fps = float(sync.get("fps") or 30.0)
    plan.output_path.parent.mkdir(parents=True, exist_ok=True)

    split_dir = DEFAULT_OUTPUT_ROOT / plan.task_slug / plan.scene_slug
    split_front = split_dir / "insta360_x5_front_fisheye.mp4"
    split_back = split_dir / "insta360_x5_back_fisheye.mp4"
    if split_front.is_file() and split_back.is_file():
        filter_graph = (
            f"[0:v]select='between(n,{frame_start},{frame_end})',setpts=N/({fps:.6f}*TB),"
            "scale=960:960:flags=lanczos[front];"
            f"[1:v]select='between(n,{frame_start},{frame_end})',setpts=N/({fps:.6f}*TB),"
            "scale=960:960:flags=lanczos[back];"
            "[front][back]hstack=inputs=2[v]"
        )
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(split_front),
            "-i",
            str(split_back),
            "-filter_complex",
            filter_graph,
            "-map",
            "[v]",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            preset,
            "-crf",
            str(crf),
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(plan.output_path),
        ]
        run(cmd)
        return "converted"

    filter_graph = (
        f"[0:v]select='between(n,{frame_start},{frame_end})',setpts=N/({fps:.6f}*TB),split=2[front_in][back_in];"
        "[front_in]crop=iw/2:ih:0:0,scale=960:960:flags=lanczos[front];"
        "[back_in]crop=iw/2:ih:iw/2:0,scale=960:960:flags=lanczos[back];"
        "[front][back]hstack=inputs=2[v]"
    )
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-fflags",
        "+genpts",
        "-i",
        str(input_path),
        "-filter_complex",
        filter_graph,
        "-map",
        "[v]",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(plan.output_path),
    ]
    run(cmd)
    return "converted"


def convert_sync_insight9(
    plan: SyncSequencePlan,
    sync: dict[str, object],
    force: bool,
    crf: int,
    preset: str,
    output_root: Path,
) -> str:
    if plan.output_path.exists() and not force:
        return "exists"

    selected_count = int(sync.get("selected_count") or 0)
    if selected_count < 2:
        return "insufficient_overlap_frames"

    left_paths = [Path(path) for path in sync.get("left_paths", [])]
    right_paths = [Path(path) for path in sync.get("right_paths", [])]
    fps = float(sync.get("fps") or 20.0)
    duration = 1.0 / max(fps, 1.0)
    left_entries = [(path, duration) for path in left_paths]
    right_entries = [(path, duration) for path in right_paths]

    plan.output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_dir = output_root / ".concat_lists" / plan.task_slug / plan.scene_slug / plan.sensor
    left_list = tmp_dir / "left.txt"
    right_list = tmp_dir / "right.txt"
    write_concat_list(left_list, left_entries)
    write_concat_list(right_list, right_entries)

    filter_graph = (
        "[0:v]scale=544:640:flags=lanczos[left];"
        "[1:v]scale=544:640:flags=lanczos[right];"
        "[left][right]hstack=inputs=2[v]"
    )
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(left_list),
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(right_list),
        "-filter_complex",
        filter_graph,
        "-map",
        "[v]",
        "-an",
        "-vsync",
        "vfr",
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(plan.output_path),
    ]
    run(cmd)
    return "converted"


def convert_sync_plan(
    plan: SyncSequencePlan,
    output_root: Path,
    force: bool,
    crf: int,
    preset: str,
    max_seconds: float | None,
) -> str:
    sync = rosbag_sync_metadata(plan, max_seconds=max_seconds)
    if sync is None:
        return "missing_sync_metadata"
    if int(sync.get("selected_count") or 0) <= 0:
        return "skipped_no_overlap"

    if plan.sensor == "insta360_x5":
        return convert_sync_x5(plan, sync, force=force, crf=crf, preset=preset)
    if plan.sensor == "insight9":
        return convert_sync_insight9(plan, sync, force=force, crf=crf, preset=preset, output_root=output_root)
    return "unsupported_sensor"


def maybe_filter_sync(
    plans: Iterable[SyncSequencePlan],
    task: str | None,
    sensor: str | None,
    limit: int | None,
) -> list[SyncSequencePlan]:
    filtered: list[SyncSequencePlan] = []
    task_key = normalize(task).replace(" ", "_") if task else None
    sensor_key = normalize(sensor).replace("-", "_") if sensor else None

    for plan in plans:
        if task_key and task_key not in {normalize(plan.task_title).replace(" ", "_"), plan.task_slug}:
            continue
        if sensor_key and sensor_key != plan.sensor:
            continue
        filtered.append(plan)
        if limit and len(filtered) >= limit:
            break
    return filtered


def maybe_filter(plans: Iterable[SequencePlan], task: str | None, sensor: str | None, limit: int | None) -> list[SequencePlan]:
    filtered: list[SequencePlan] = []
    task_key = normalize(task).replace(" ", "_") if task else None
    sensor_key = normalize(sensor).replace("-", "_") if sensor else None

    for plan in plans:
        if task_key and task_key not in {normalize(plan.task_title).replace(" ", "_"), plan.task_slug}:
            continue
        if sensor_key and sensor_key != plan.sensor:
            continue
        filtered.append(plan)
        if limit and len(filtered) >= limit:
            break
    return filtered


def make_manifest(plans: list[SequencePlan], data_root: Path, output_root: Path) -> dict:
    sequences = []
    for plan in plans:
        views = []
        for view in plan.views:
            exists = plan_input_exists(view)
            output_exists = view.output_path.is_file()
            size = view.output_path.stat().st_size if output_exists else 0
            views.append(
                {
                    "label": view.label,
                    "input_kind": view.input_kind,
                    "input_exists": exists,
                    "input_path": str(view.input_path),
                    "output_path": str(view.output_path),
                    "output_relative": view.output_path.relative_to(output_root).as_posix(),
                    "output_exists": output_exists,
                    "output_size_bytes": size,
                    "fps": round(view.fps, 6) if view.fps else None,
                    "frame_count": view.frame_count,
                }
            )
        sequences.append(
            {
                "sequence_id": plan.sequence_id,
                "task_title": plan.task_title,
                "task_slug": plan.task_slug,
                "task_dir": plan.task_dir,
                "scene_label": plan.scene_label,
                "scene_slug": plan.scene_slug,
                "sensor": plan.sensor,
                "sensor_dir": str(plan.sensor_dir),
                "views": views,
            }
        )

    missing_inputs = sum(1 for seq in sequences for view in seq["views"] if not view["input_exists"])
    output_count = sum(1 for seq in sequences for view in seq["views"] if view["output_exists"])
    return {
        "schema": "mild.sequence_video_manifest.v1",
        "data_root": str(data_root),
        "output_root": str(output_root),
        "sequence_count": len(sequences),
        "view_count": sum(len(seq["views"]) for seq in sequences),
        "missing_input_count": missing_inputs,
        "existing_output_count": output_count,
        "sequences": sequences,
    }


def make_sync_manifest(
    plans: list[SyncSequencePlan],
    data_root: Path,
    output_root: Path,
    status_by_sequence: dict[str, str] | None = None,
    max_seconds: float | None = None,
) -> dict:
    sequences = []
    status_by_sequence = status_by_sequence or {}

    for plan in plans:
        sync = rosbag_sync_metadata(plan, max_seconds=max_seconds)
        tum = first_last_tum_time(plan.robot_tum_path)
        status = status_by_sequence.get(plan.sequence_id)
        output_exists = plan.output_path.is_file()
        output_size = plan.output_path.stat().st_size if output_exists else 0
        sync_public = {}
        if sync:
            for key, value in sync.items():
                if key in {"left_paths", "right_paths"}:
                    continue
                sync_public[key] = value

        sequences.append(
            {
                "sequence_id": plan.sequence_id,
                "task_title": plan.task_title,
                "task_slug": plan.task_slug,
                "task_dir": plan.task_dir,
                "scene_label": plan.scene_label,
                "scene_slug": plan.scene_slug,
                "sensor": plan.sensor,
                "sensor_dir": str(plan.sensor_dir),
                "robot_tum_path": str(plan.robot_tum_path) if plan.robot_tum_path else None,
                "robot_tum_start": tum[0] if tum else None,
                "robot_tum_end": tum[1] if tum else None,
                "robot_tum_count": tum[2] if tum else 0,
                "sync_window_start": ns_to_sec(sync["window_start_ns"]) if sync else None,
                "sync_window_end": ns_to_sec(sync["window_end_ns"]) if sync else None,
                "sync_window_duration": sync["window_duration_s"] if sync else 0,
                "selected_count": sync.get("selected_count", 0) if sync else 0,
                "rosbag_sync": sync_public,
                "output_path": str(plan.output_path),
                "output_relative": plan.output_path.relative_to(output_root).as_posix(),
                "output_exists": output_exists,
                "output_size_bytes": output_size,
                "status": status,
            }
        )

    status_counts: dict[str, int] = {}
    for sequence in sequences:
        status = sequence["status"] or "not_converted"
        status_counts[status] = status_counts.get(status, 0) + 1

    positive_overlap = sum(1 for sequence in sequences if sequence["selected_count"] > 0)
    return {
        "schema": "mild.sequence_video_manifest.v2.combined_sync",
        "data_root": str(data_root),
        "output_root": str(output_root),
        "sequence_count": len(sequences),
        "positive_overlap_count": positive_overlap,
        "existing_output_count": sum(1 for sequence in sequences if sequence["output_exists"]),
        "status_counts": status_counts,
        "sequences": sequences,
    }


def write_manifest(path: Path, manifest: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(f"Required command not found: {name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["split", "combined-sync"], default="split")
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--manifest", type=Path, default=None)
    parser.add_argument("--convert", action="store_true", help="Run ffmpeg. Without this flag only a manifest is written.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing output videos.")
    parser.add_argument("--task", help="Filter by task title or task slug.")
    parser.add_argument("--sensor", choices=["insta360_x5", "insight9"], help="Filter by sensor.")
    parser.add_argument("--limit", type=int, help="Limit number of sensor sequences processed.")
    parser.add_argument("--crf", type=int, default=30, help="H.264 CRF for website preview files.")
    parser.add_argument("--preset", default="veryfast", help="x264 preset.")
    parser.add_argument("--max-seconds", type=float, help="Debug option: cap each output view duration.")
    args = parser.parse_args()

    require_tool("ffmpeg")

    if args.mode == "combined-sync":
        if args.output_root == DEFAULT_OUTPUT_ROOT:
            args.output_root = DEFAULT_SYNC_OUTPUT_ROOT

        sync_plans = collect_sync_plans(
            args.data_root,
            args.output_root,
            task=args.task,
            sensor=args.sensor,
            limit=args.limit,
        )
        status_by_sequence: dict[str, str] = {}
        if args.convert:
            for plan in sync_plans:
                try:
                    status = convert_sync_plan(
                        plan,
                        output_root=args.output_root,
                        force=args.force,
                        crf=args.crf,
                        preset=args.preset,
                        max_seconds=args.max_seconds,
                    )
                except subprocess.CalledProcessError as exc:
                    print(f"conversion_failed exit={exc.returncode} output={plan.output_path}", file=sys.stderr)
                    status = f"failed_exit_{exc.returncode}"
                status_by_sequence[plan.sequence_id] = status

        manifest_path = args.manifest or args.output_root / "sequence_video_manifest.json"
        manifest = make_sync_manifest(
            sync_plans,
            args.data_root,
            args.output_root,
            status_by_sequence=status_by_sequence,
            max_seconds=args.max_seconds,
        )
        manifest["convert_requested"] = bool(args.convert)
        write_manifest(manifest_path, manifest)

        sensor_counts: dict[str, int] = {}
        for plan in sync_plans:
            sensor_counts[plan.sensor] = sensor_counts.get(plan.sensor, 0) + 1

        print(f"manifest={manifest_path}")
        print(f"mode=combined-sync sequences={len(sync_plans)} sensors={sensor_counts}")
        print(
            "positive_overlap="
            f"{manifest['positive_overlap_count']} existing_outputs={manifest['existing_output_count']}"
        )
        print(f"status_counts={manifest['status_counts']}")
        failed = sum(count for status, count in manifest["status_counts"].items() if status.startswith("failed_exit_"))
        return 1 if failed else 0

    plans = maybe_filter(collect_plans(args.data_root, args.output_root), args.task, args.sensor, args.limit)

    status_counts: dict[str, int] = {}
    if args.convert:
        for plan in plans:
            for view in plan.views:
                try:
                    status = convert_view(
                        view,
                        force=args.force,
                        crf=args.crf,
                        preset=args.preset,
                        max_seconds=args.max_seconds,
                    )
                except subprocess.CalledProcessError as exc:
                    print(f"conversion_failed exit={exc.returncode} output={view.output_path}", file=sys.stderr)
                    status = f"failed_exit_{exc.returncode}"
                status_counts[status] = status_counts.get(status, 0) + 1

    manifest_path = args.manifest or args.output_root / "sequence_video_manifest.json"
    manifest = make_manifest(plans, args.data_root, args.output_root)
    manifest["convert_requested"] = bool(args.convert)
    manifest["conversion_status_counts"] = status_counts
    write_manifest(manifest_path, manifest)

    sensor_counts: dict[str, int] = {}
    for plan in plans:
        sensor_counts[plan.sensor] = sensor_counts.get(plan.sensor, 0) + 1

    print(f"manifest={manifest_path}")
    print(f"sequences={len(plans)} views={manifest['view_count']} sensors={sensor_counts}")
    print(f"missing_inputs={manifest['missing_input_count']} existing_outputs={manifest['existing_output_count']}")
    if status_counts:
        print(f"conversion_status_counts={status_counts}")
    return 0 if manifest["missing_input_count"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
