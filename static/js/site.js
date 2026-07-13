const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const cards = Array.from(document.querySelectorAll(".task-card"));
const searchInput = document.querySelector("#taskSearch");
const taskCount = document.querySelector("#taskCount");
const releaseBaseUrl = "https://github.com/Zjj587/MILD/releases/download/v0.1/";

const taskSlugs = {
  "01": "analemma_2_t",
  "02": "bookshelf01_2",
  "03": "bookshelf02_2",
  "04": "box01",
  "05": "box02",
  "06": "circular_2_t",
  "07": "grab_place01_t",
  "08": "grab_place02_t",
  "09": "grab_place03_t",
  "10": "grab_place04",
  "11": "grab_place05",
  "12": "grab_place06_t",
  "13": "wiping01",
  "14": "wiping02_1",
  "15": "zigzag_2_t",
};

const categoryLabels = {
  motion: "Motion Pattern",
  bookshelf: "Bookshelf",
  box: "Box",
  "grasp-place": "Pick-and-Place",
  wipe: "Wiping",
};

const collectedScenes = [
  {
    name: "Analemma",
    variantCount: 6,
    variants: "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
    insta360Usable: 6,
    insight9Usable: 3,
    insight9Variants: "table, tablecloth, ArUco 4",
  },
  {
    name: "Bookshelf 01",
    variantCount: 5,
    variants: "table, ArUco 2/4, AprilTag Custom48h12 2/4",
    insta360Usable: 5,
    insight9Usable: 2,
    insight9Variants: "table, ArUco 4",
  },
  {
    name: "Bookshelf 02",
    variantCount: 6,
    variants: "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
    insta360Usable: 6,
    insight9Usable: 2,
    insight9Variants: "table, ArUco 4",
  },
  {
    name: "Box 01",
    variantCount: 3,
    variants: "table, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 3,
    insight9Usable: 1,
    insight9Variants: "ArUco 4",
  },
  {
    name: "Box 02",
    variantCount: 3,
    variants: "table, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 3,
    insight9Usable: 2,
    insight9Variants: "table, ArUco 4",
  },
  {
    name: "Circular",
    variantCount: 6,
    variants: "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
    insta360Usable: 6,
    insight9Usable: 3,
    insight9Variants: "table, tablecloth, ArUco 4",
  },
  {
    name: "Grab Place 01",
    variantCount: 4,
    variants: "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 4,
    insight9Usable: 1,
    insight9Variants: "table",
  },
  {
    name: "Grab Place 02",
    variantCount: 4,
    variants: "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 4,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Grab Place 03",
    variantCount: 4,
    variants: "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 4,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Grab Place 04",
    variantCount: 3,
    variants: "table, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 3,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Grab Place 05",
    variantCount: 3,
    variants: "table, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 3,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Grab Place 06",
    variantCount: 4,
    variants: "table, tablecloth, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 4,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Wiping 01",
    variantCount: 3,
    variants: "table, ArUco 4, AprilTag Custom48h12 4",
    insta360Usable: 3,
    insight9Usable: 0,
    insight9Variants: "none",
  },
  {
    name: "Wiping 02",
    variantCount: 7,
    variants: "table, ArUco 1/2/4, AprilTag Custom48h12 1/2/4",
    insta360Usable: 7,
    insight9Usable: 2,
    insight9Variants: "table, ArUco 4",
  },
  {
    name: "Zigzag",
    variantCount: 6,
    variants: "table, tablecloth, ArUco 2/4, AprilTag Custom48h12 2/4",
    insta360Usable: 6,
    insight9Usable: 5,
    insight9Variants: "table, tablecloth, ArUco 2/4, AprilTag 2",
  },
];

const activeFilters = {
  category: "all",
  scene: "all",
  sensor: "all",
};

function normalize(value) {
  return value.trim().toLowerCase();
}

function updateTasks() {
  const query = searchInput ? normalize(searchInput.value) : "";
  let visibleCount = 0;

  cards.forEach((card) => {
    const category = card.dataset.category || "";
    const scenes = (card.dataset.scenes || "").split(/\s+/).filter(Boolean);
    const sensors = (card.dataset.sensors || "").split(/\s+/).filter(Boolean);
    const searchText = normalize(`${card.textContent} ${card.dataset.search || ""} ${card.dataset.scenes || ""} ${card.dataset.sensors || ""}`);
    const categoryMatch = activeFilters.category === "all" || category === activeFilters.category;
    const sceneMatch = activeFilters.scene === "all" || scenes.includes(activeFilters.scene);
    const sensorMatch = activeFilters.sensor === "all" || sensors.includes(activeFilters.sensor);
    const searchMatch = !query || searchText.includes(query);
    const visible = categoryMatch && sceneMatch && sensorMatch && searchMatch;

    card.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  if (taskCount) {
    taskCount.textContent = `Showing ${visibleCount} benchmark task${visibleCount === 1 ? "" : "s"}`;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.filterGroup || "category";
    activeFilters[group] = button.dataset.filter || "all";
    filterButtons
      .filter((item) => (item.dataset.filterGroup || "category") === group)
      .forEach((item) => item.classList.toggle("is-active", item === button));
    updateTasks();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", updateTasks);
}

function createDownloadPill(label, fileName) {
  const anchor = document.createElement("a");
  anchor.className = "download-pill";
  anchor.href = `${releaseBaseUrl}${fileName}`;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.textContent = label;
  return anchor;
}

function createDownloadRow(label, links) {
  const row = document.createElement("div");
  row.className = "download-row";

  const rowLabel = document.createElement("span");
  rowLabel.textContent = label;

  const linkWrap = document.createElement("div");
  linkWrap.className = "download-links";
  links.forEach((link) => linkWrap.appendChild(link));

  row.append(rowLabel, linkWrap);
  return row;
}

function createStatusBadge(text, tone = "neutral") {
  const badge = document.createElement("span");
  badge.className = `status-badge status-${tone}`;
  badge.textContent = text;
  return badge;
}

const sensorCatalog = {
  "Insta360 X5": {
    role: "Wide-view VIO stream",
    signals: "Dual fisheye video, IMU, timestamps, and exposure metadata.",
  },
  Insight9: {
    role: "Stereo companion stream",
    signals: "Left/right grayscale images, IMU, and time-sync index.",
  },
};

function expandVariantList(value) {
  if (!value || normalize(value) === "none") return [];

  return value.split(",").flatMap((item) => {
    const label = item.trim().replace(/\.$/, "");
    if (!label) return [];

    const markerMatch = label.match(/^(.*?)(\d+(?:\/\d+)*)$/);
    if (!markerMatch) return [label];

    const prefix = markerMatch[1].trim();
    return markerMatch[2].split("/").map((count) => `${prefix} ${count}`);
  });
}

function sceneKey(value) {
  return normalize(value)
    .replace(/custom48h12/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sceneSlug(value) {
  return sceneKey(value).replace(/\s+/g, "_");
}

function buildSceneEntries(task) {
  const insightScenes = new Set(expandVariantList(task.insight9Variants).map(sceneKey));

  return expandVariantList(task.variants).map((sceneName) => {
    const sensors = ["Insta360 X5"];
    if (insightScenes.has(sceneKey(sceneName))) {
      sensors.push("Insight9");
    }
    return { name: sceneName, sensors };
  });
}

function createTaskDetailDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "task-detail-dialog";
  dialog.innerHTML = `
    <div class="task-detail-shell">
      <div class="task-detail-visual">
        <div class="task-detail-photo" aria-hidden="true"></div>
      </div>
      <div class="task-detail-content">
        <div class="task-detail-header">
          <div>
            <p class="section-kicker task-detail-kicker"></p>
            <h3 class="task-detail-title"></h3>
            <p class="task-detail-summary"></p>
          </div>
          <button class="detail-close" type="button">Close</button>
        </div>
        <div class="task-detail-columns">
          <div>
            <h4>Scenes</h4>
            <div class="scene-list"></div>
          </div>
          <div>
            <h4>Sensors</h4>
            <div class="sensor-detail">
              <strong class="sensor-detail-title"></strong>
              <p class="sensor-detail-meta"></p>
              <div class="sensor-list"></div>
              <p class="sensor-detail-note"></p>
              <div class="scene-downloads" aria-label="Scene release downloads"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

const taskDetailDialog = createTaskDetailDialog();
const taskDetailRefs = {
  photo: taskDetailDialog.querySelector(".task-detail-photo"),
  kicker: taskDetailDialog.querySelector(".task-detail-kicker"),
  title: taskDetailDialog.querySelector(".task-detail-title"),
  summary: taskDetailDialog.querySelector(".task-detail-summary"),
  sceneList: taskDetailDialog.querySelector(".scene-list"),
  sensorTitle: taskDetailDialog.querySelector(".sensor-detail-title"),
  sensorMeta: taskDetailDialog.querySelector(".sensor-detail-meta"),
  sensorList: taskDetailDialog.querySelector(".sensor-list"),
  sensorNote: taskDetailDialog.querySelector(".sensor-detail-note"),
  sceneDownloads: taskDetailDialog.querySelector(".scene-downloads"),
  close: taskDetailDialog.querySelector(".detail-close"),
};

let lastTaskTrigger = null;

function copyTaskPhotoStyle(source) {
  if (!source || !taskDetailRefs.photo) return;
  const style = window.getComputedStyle(source);
  taskDetailRefs.photo.style.backgroundColor = style.backgroundColor;
  taskDetailRefs.photo.style.backgroundImage = style.backgroundImage;
  taskDetailRefs.photo.style.backgroundPosition = style.backgroundPosition;
  taskDetailRefs.photo.style.backgroundRepeat = style.backgroundRepeat;
  taskDetailRefs.photo.style.backgroundSize = style.backgroundSize;
  taskDetailRefs.photo.style.transform = style.transform === "none" ? "" : style.transform;
}

function renderSensorDetail(scene) {
  taskDetailRefs.sensorTitle.textContent = scene.name;
  taskDetailRefs.sensorMeta.textContent = `${scene.sensors.length} usable sensor stream${scene.sensors.length === 1 ? "" : "s"}`;
  taskDetailRefs.sensorList.replaceChildren();
  taskDetailRefs.sceneDownloads.replaceChildren();

  scene.sensors.forEach((sensorName) => {
    const sensor = sensorCatalog[sensorName];
    const card = document.createElement("article");
    card.className = "detail-sensor-card";

    const top = document.createElement("div");
    top.className = "detail-sensor-top";

    const title = document.createElement("strong");
    title.textContent = sensorName;

    top.append(title, createStatusBadge("usable", "good"));

    const role = document.createElement("span");
    role.textContent = sensor.role;

    const signals = document.createElement("p");
    signals.textContent = sensor.signals;

    card.append(top, role, signals);
    taskDetailRefs.sensorList.appendChild(card);
  });

  taskDetailRefs.sensorNote.textContent = scene.sensors.includes("Insight9")
    ? "This scene contains both the wide-view VIO stream and the stereo companion stream."
    : "Only the public usable Insta360 X5 stream is listed for this scene.";

  if (scene.releaseSlug) {
    const heading = document.createElement("div");
    heading.className = "download-heading";

    const title = document.createElement("span");
    title.textContent = "Data links";

    const release = document.createElement("small");
    release.textContent = "release plan";

    heading.append(title, release);
    taskDetailRefs.sceneDownloads.appendChild(heading);
    taskDetailRefs.sceneDownloads.appendChild(createDownloadRow("Scene", [
      createDownloadPill("bundle", `${scene.releaseSlug}_bundle.zip`),
    ]));
    taskDetailRefs.sceneDownloads.appendChild(createDownloadRow("Metadata", [
      createDownloadPill("manifest", `${scene.releaseSlug}_manifest.json`),
    ]));
  }
}

function renderSceneOptions(scenes) {
  taskDetailRefs.sceneList.replaceChildren();

  scenes.forEach((scene, index) => {
    const button = document.createElement("button");
    button.className = "scene-option";
    button.type = "button";
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");

    const name = document.createElement("strong");
    name.textContent = scene.name;

    const sensors = document.createElement("span");
    sensors.textContent = scene.sensors.join(" + ");

    button.append(name, sensors);
    button.addEventListener("click", () => {
      taskDetailRefs.sceneList.querySelectorAll(".scene-option").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      renderSensorDetail(scene);
    });

    if (index === 0) {
      button.classList.add("is-active");
      renderSensorDetail(scene);
    }

    taskDetailRefs.sceneList.appendChild(button);
  });
}

function getTaskNumber(card) {
  const index = cards.indexOf(card);
  return index >= 0 ? String(index + 1).padStart(2, "0") : "";
}

function openTaskDetail(card) {
  const taskName = card.querySelector("h3")?.textContent.trim();
  const task = collectedScenes.find((item) => item.name === taskName);
  if (!task) return;

  const taskNumber = getTaskNumber(card);
  const taskCategory = categoryLabels[card.dataset.category] || "";
  const taskSummary = card.querySelector(".task-body > p")?.textContent.trim() || "";
  const photo = card.querySelector(".task-photo");
  const taskSlug = taskSlugs[taskNumber];
  const scenes = buildSceneEntries(task).map((scene) => ({
    ...scene,
    releaseSlug: taskSlug ? `${taskSlug}_${sceneSlug(scene.name)}` : "",
  }));

  lastTaskTrigger = photo;
  copyTaskPhotoStyle(photo);
  taskDetailRefs.kicker.textContent = taskCategory || "Task scenes";
  taskDetailRefs.title.textContent = task.name;
  taskDetailRefs.summary.textContent = taskSummary;
  renderSceneOptions(scenes);

  if (typeof taskDetailDialog.showModal === "function") {
    taskDetailDialog.showModal();
  } else {
    taskDetailDialog.setAttribute("open", "");
  }
}

function closeTaskDetail() {
  if (typeof taskDetailDialog.close === "function" && taskDetailDialog.open) {
    taskDetailDialog.close();
  } else {
    taskDetailDialog.removeAttribute("open");
  }
}

taskDetailRefs.close.addEventListener("click", closeTaskDetail);
taskDetailDialog.addEventListener("click", (event) => {
  if (event.target === taskDetailDialog) closeTaskDetail();
});
taskDetailDialog.addEventListener("close", () => {
  lastTaskTrigger?.focus();
});

cards.forEach((card) => {
  card.querySelector(".task-photo")?.addEventListener("click", () => openTaskDetail(card));
});

function renderCollectedInventory() {
  const tableBody = document.querySelector("#collectedInventory");
  const inventoryCount = document.querySelector("#inventoryCount");
  if (!tableBody) return;

  tableBody.replaceChildren();

  collectedScenes.forEach((scene) => {
    const row = document.createElement("tr");

    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = scene.name;
    const sceneMeta = document.createElement("small");
    sceneMeta.textContent = `${scene.variantCount} variants`;
    name.appendChild(sceneMeta);

    const variants = document.createElement("td");
    variants.textContent = scene.variants;

    const insta360 = document.createElement("td");
    insta360.appendChild(createStatusBadge(`${scene.insta360Usable}/${scene.variantCount} usable`, "good"));

    const insight = document.createElement("td");
    if (scene.insight9Usable > 0) {
      const insightWrap = document.createElement("div");
      insightWrap.className = "sensor-chip-row";
      insightWrap.appendChild(createStatusBadge(`${scene.insight9Usable} usable`, "good"));
      insight.appendChild(insightWrap);
    } else {
      insight.textContent = "-";
    }

    const notes = document.createElement("td");
    notes.textContent = scene.insight9Variants === "none" ? "-" : scene.insight9Variants;

    row.append(name, variants, insta360, insight, notes);
    tableBody.appendChild(row);
  });

  if (inventoryCount) {
    const totalVariants = collectedScenes.reduce((sum, scene) => sum + scene.variantCount, 0);
    const insta360Sequences = collectedScenes.reduce((sum, scene) => sum + scene.insta360Usable, 0);
    const insightVariants = collectedScenes.reduce((sum, scene) => sum + scene.insight9Usable, 0);
    const sensorSequences = insta360Sequences + insightVariants;
    inventoryCount.textContent = `${collectedScenes.length} tasks / 6 scene settings / 2 sensors / ${sensorSequences} sensor sequences`;
  }
}

renderCollectedInventory();
updateTasks();
