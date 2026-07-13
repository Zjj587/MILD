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

let activeFilter = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function updateTasks() {
  const query = searchInput ? normalize(searchInput.value) : "";
  let visibleCount = 0;

  cards.forEach((card) => {
    const category = card.dataset.category || "";
    const searchText = normalize(`${card.textContent} ${card.dataset.search || ""}`);
    const categoryMatch = activeFilter === "all" || category === activeFilter;
    const searchMatch = !query || searchText.includes(query);
    const visible = categoryMatch && searchMatch;

    card.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  if (taskCount) {
    taskCount.textContent = `Showing ${visibleCount} benchmark task${visibleCount === 1 ? "" : "s"}`;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
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

function createTaskDownloads(card) {
  const taskNumber = card.querySelector(".task-topline span")?.textContent.trim();
  const slug = taskSlugs[taskNumber];
  if (!slug) return null;

  const panel = document.createElement("div");
  panel.className = "task-downloads";
  panel.setAttribute("aria-label", "Task dataset downloads");

  const heading = document.createElement("div");
  heading.className = "download-heading";

  const title = document.createElement("span");
  title.textContent = "Data Links";

  const release = document.createElement("small");
  release.textContent = "release plan";

  heading.append(title, release);
  panel.appendChild(heading);
  panel.appendChild(createDownloadRow("Scene", [
    createDownloadPill("bundle", `${slug}_scene_bundle.zip`),
  ]));
  panel.appendChild(createDownloadRow("Metadata", [
    createDownloadPill("manifest", `${slug}_manifest.json`),
  ]));

  return panel;
}

function createStatusBadge(text, tone = "neutral") {
  const badge = document.createElement("span");
  badge.className = `status-badge status-${tone}`;
  badge.textContent = text;
  return badge;
}

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

document.querySelectorAll(".dataset-link.is-disabled").forEach((link) => {
  const card = link.closest(".task-card");
  const downloads = card ? createTaskDownloads(card) : null;
  if (downloads) {
    link.replaceWith(downloads);
  } else {
    link.addEventListener("click", (event) => event.preventDefault());
  }
});

renderCollectedInventory();
updateTasks();
