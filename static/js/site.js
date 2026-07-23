const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const cards = Array.from(document.querySelectorAll(".task-card"));
const searchInput = document.querySelector("#taskSearch");
const taskCount = document.querySelector("#taskCount");
const taskEmpty = document.querySelector("#taskEmpty");
const sequenceOverviewTable = document.querySelector("#sequenceOverviewTable");
const sequenceOverviewCount = document.querySelector("#sequenceOverviewCount");
const releaseBaseUrl = "https://github.com/Zjj587/MILD/releases/download/v0.1/";
const syncVideoAssetPrefix = "mild_v0_sync";

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
    insight9Usable: 0,
    insight9Variants: "none",
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

const sensorFilterTokens = {
  "Insta360 X5": "insta360-x5",
  Insight9: "insight9",
};

const sensorVideoSlugs = {
  "Insta360 X5": "insta360_x5",
  Insight9: "insight9",
};

const sensorVideoLabels = {
  "Insta360 X5": "front / back fisheye",
  Insight9: "left / right grayscale",
};

const sensorVideoSpecs = {
  "Insta360 X5": "1920 x 960 H.264 MP4",
  Insight9: "1088 x 640 H.264 MP4",
};

const sequenceOverviewScenes = [
  "table",
  "tablecloth",
  "ArUco 1",
  "ArUco 2",
  "ArUco 4",
  "AprilTag 1",
  "AprilTag 2",
  "AprilTag 4",
];

const sequenceOverviewSensors = [
  { name: "Insta360 X5", shortName: "X5" },
  { name: "Insight9", shortName: "I9" },
];

const invalidDataSequences = new Set([
  "box02__table__insight9",
  "box02__aruco_4__insight9",
]);

const datasetDownloadRecords = [
  ["circular_2_t__tablecloth__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQAmV_QL-rU1SqQzdBpodCS7AUDkH_74OnBbEEG8W8FUMv4", "https://1drv.ms/u/c/7625f90385490ff5/IQDPKx9wJr3bTroJDecSDwLeAUW3G2UzxWVqUicnlNpbhAc"],
  ["bookshelf02_2__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQAUfbz0fIdwSoh8nzioisyvAftcX7jJb2UMhi4VmsrxRns", "https://1drv.ms/u/c/7625f90385490ff5/IQBpOX_CDD6ERoz9TIOgv1HMATneCjPKb2kF-Iy7867T1bg"],
  ["circular_2_t__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQD-F7v--h4NTqBiDXA0pCgVAT1SMjePmj_JuVyWdHnbEzk", "https://1drv.ms/u/c/7625f90385490ff5/IQDtf7P4NrtxTL0miQV8qJAIARF9O-DZnlbPU6bmsImbt2k"],
  ["circular_2_t__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQD8a67NOef-R50aklXGZLvdAdmBindFpHEvY8LfyGmsvGw", "https://1drv.ms/u/c/7625f90385490ff5/IQAb0MzapqYERqHyz_P13ofOAY-DN2aFAFRlZMwy8EqJ208"],
  ["analemma_2_t__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBds2mjx9d3QYXjoT7ElrXeAUj72ju6nonWC95qh4NUe5A", "https://1drv.ms/u/c/7625f90385490ff5/IQByor6lMWotQKJXH7w54i57ASuelcuKKhyLBxn1E8EC68U"],
  ["analemma_2_t__tablecloth__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQDpf_uv115bQ5Ud-VhXhwtSAZg5kAJl0lw5d8gvgfyfEQ8", "https://1drv.ms/u/c/7625f90385490ff5/IQDIN-0GWIfjTqsLoL5AYfsxAZ72a3ngVlug6us9R2VE54Q"],
  ["analemma_2_t__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQAVUDPeB6woQ7S7IGLO9QBLAQOl2-WbDM-FWU7G9UU1goE", "https://1drv.ms/u/c/7625f90385490ff5/IQCsPITscGd6RItx5aO4ENwFAY3obPC186rSlk3GvAUJUGU"],
  ["bookshelf02_2__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBgGHN1D51cS5rbd6djXYXKAUIUyHKvVoObPkCSyJ9i_jM", "https://1drv.ms/u/c/7625f90385490ff5/IQDDWO60ueivSq9ntkw6Q_cEAbRTk2v_W0Gt7LdOvkpnTm8"],
  ["bookshelf01_2__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQAXqL7jaZflQaIWqmdS6XuRAWYxYFcS-7Szo2x4pHFdFLo", "https://1drv.ms/u/c/7625f90385490ff5/IQCJciLG_0CTQpdATZnSd9IKAVRYOuVLRejKBuiGgVY0LDg"],
  ["bookshelf01_2__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQDxHz5cVveJSqdOu-C277_5AZgQv5nYH-wLHtXu6wYey9k", "https://1drv.ms/u/c/7625f90385490ff5/IQCfdYOYJJzUSLYDdABQwVWDAVJo_ceUtTYcNCFHzM7a4P0"],
  ["box01__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQD7M9ZGjPXyQZo0UHBRs5PlAZ3Xw3g_uvx0hJFf9VTdtiQ", "https://1drv.ms/u/c/7625f90385490ff5/IQCrbQX9-Js1RKmXDq8gxs6JAcwhrVkhl85txSQNFGxpmfU"],
  ["grab_place01_t__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBvaRviokf4QJqkLogH3P2bAfXvzsnPe_zZtX6HUHe3zks", "https://1drv.ms/u/c/7625f90385490ff5/IQDoIvD9MRtSQbFJdKys2GOmATshuy0E5tmE-r2VvHidcbQ"],
  ["zigzag_2_t__apriltag_2__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBjbMBxOLPxSJMsi3byUiCUAc3HSbrB2tlPS-mU3d1E6nY", "https://1drv.ms/u/c/7625f90385490ff5/IQDWVDS5qZqwTqUlbkC4mPrLAXwKGeiWdEEtFTNIqUTPlBo"],
  ["zigzag_2_t__aruco_2__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQAODpZfqnJbQYRR4MMU_PQgAX1JFnEew1AkW4FuqRD9GCw", "https://1drv.ms/u/c/7625f90385490ff5/IQBmZ0N5JcYgS5J5mO67OziBAT7H10H_cuWDtMOUj-vOy48"],
  ["zigzag_2_t__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQCYg12USuDwT5EhTMKyJ8LFAViazIFcGmwKeXVPIEI5ThU", "https://1drv.ms/u/c/7625f90385490ff5/IQCmPnOXlpDGTq6UDfnIAbrfAYu-uF3e-J2CLpo19aTdqjQ"],
  ["zigzag_2_t__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBXmLnO7kJGRKpRgdYXVsz3Af-UGhnJDrPrDSUhv1WNW58", "https://1drv.ms/u/c/7625f90385490ff5/IQDvi8PIgL6qRLAL6IbXYYt6Ad-3lvmBJbhB1h12crTKqJU"],
  ["zigzag_2_t__tablecloth__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBjAsfz5dnGRKovAEY7_jJtAco-gY0mp_6G7TIAw4l3pD8", "https://1drv.ms/u/c/7625f90385490ff5/IQDHIg_tQ9emRa5tiiOsMtHUARH7bctRa9XqrPvhj8DCPsU"],
  ["wiping02_1__aruco_4__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQABVVZNXbmfSZ3kaitsJe39AUipDK-rzkvfuiGrRWhyX68", "https://1drv.ms/u/c/7625f90385490ff5/IQDae9TAG99KRImzgmZ_Jg3-AfwFK9Ag7iL8iXG0ej4bPtw"],
  ["circular_2_t__apriltag_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBLEmbvO6gQS52QIyqxy63OAYBhIlyIOC3GRdaCUo3KmVQ", "https://1drv.ms/u/c/7625f90385490ff5/IQCUwcYrFTOPQLuRE3hxjXWyAV9DmJmZwRXotcWmDiIw61A"],
  ["circular_2_t__aruco_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQCz0POJVaMZT6IOFZRmzPu_AfaQczxmYRVMN1DaVdPpDF4", "https://1drv.ms/u/c/7625f90385490ff5/IQDl1qETPsABRILstfm6QEtyAVe5F9SWBXVPRLkNfwdgVH8"],
  ["circular_2_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAUfNex8IzaTKLTtBmXJE1EARFYAW8RkcDWNlb5BF42SYs", "https://1drv.ms/u/c/7625f90385490ff5/IQDZ95Kh8uFpTaD4HOEmQvJRARUh0Tzw8eFBJ8IgU-tPFqM"],
  ["circular_2_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQA7B5pNjYvrRo8YrGMJ2Cw7AQk2IiXNS1bR1UyztQOw5RA", "https://1drv.ms/u/c/7625f90385490ff5/IQA2FnhJTWW_SaHugTjtug_rAb478u_CG0B6-ye5FTAKwwY"],
  ["circular_2_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBx1NVI3a0MQo1NSd3dsL4RAXrAfFcmPeCCOpEeNN9SUsw", "https://1drv.ms/u/c/7625f90385490ff5/IQDaNOk2yq-qS4GcPA0RL-WJAYIavNUhwkx5_1zhdmPYgZE"],
  ["wiping02_1__table__insight9", "Insight9", "https://1drv.ms/u/c/7625f90385490ff5/IQBlKQBRjdDvSK3v5wSKa9GTARH6wunyFWuWx8i-zdjy3l8", "https://1drv.ms/u/c/7625f90385490ff5/IQCPtSSR9OcvQLgCPbEq8fCxAY1IhyFdpOaU841yPSy_w-A"],
  ["analemma_2_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQB3SI6dBqIORYeW-_YEZZQ8Aah_s3nIll53bN_xcP4CVcM", "https://1drv.ms/u/c/7625f90385490ff5/IQCMfFE0JKNaQ4l2q3EHmVqVAYYf0ZewLFw2kKzDjCMhmVs"],
  ["analemma_2_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAV-i8gkHmGQ4j-PE9FwnO9Aa3LWCvzYiSWh5ZPmw5n5R8", "https://1drv.ms/u/c/7625f90385490ff5/IQDvyaD2VIKaSJKbU0oHjcMsAdbKAPAZLtA1Q9OopYRgo7A"],
  ["analemma_2_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBoVd8qNSQHTIcEriQNQKcXAX0unJcC-k44Crv7RLYzQEI", "https://1drv.ms/u/c/7625f90385490ff5/IQA0dlds9Y8RR7or42D99unCAXUazxiit_7mBOQs1rwSthE"],
  ["analemma_2_t__apriltag_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQCBpLH5CzrIQKxiYFFClDmhAZtP1nnMzayJnVYfKm5d7Dg", "https://1drv.ms/u/c/7625f90385490ff5/IQDgnhTaa2qdSK0gK4LKtwJkAczWWPRBnXbo9TevpeyoObY"],
  ["analemma_2_t__aruco_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDqLv1ZgncOTZwLtA9XRc8gAeFqeTTXeaPML71QyRExGYg", "https://1drv.ms/u/c/7625f90385490ff5/IQCLTDQ9XnFvSZX9O1b2kcL7AWcjh6JlxeOfq1AxzxpjAa8"],
  ["circular_2_t__tablecloth__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDt1ZEGV9F-QomoC4NSDSNNAQcIW4f_QhrFS9lMjXEwEyQ", "https://1drv.ms/u/c/7625f90385490ff5/IQBtoogco3umRYA03hbg51nyAZC-UkUbg-4BJmUsPpEYFE8"],
  ["analemma_2_t__tablecloth__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQD59dpDJ__wSqXY6JJeXxBMAX7bqypehnw9mAb8C5x3MJE", "https://1drv.ms/u/c/7625f90385490ff5/IQA4pPWqPKLPQ6y9vO93nHyLAUqCZ9dC5ohBd4C0SJ8hGgE"],
  ["grab_place03_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAwsxRoGrkfT5FgHuKGmRqGAVGl29wr2Ruhwox0X60yxL4", "https://1drv.ms/u/c/7625f90385490ff5/IQCkBoQ_pNeISLxPxlv-CPHoAd-ofuprGDDCi_BVDNTzhDg"],
  ["grab_place03_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQD0_6dsbPbVSZRvVR2xyuFIAT516KHLmS76DJEbsmrmvO0", "https://1drv.ms/u/c/7625f90385490ff5/IQD_mLopslYiRbBbhOCMPep-ATNBCd8rpSRy4lNdcsewzcE"],
  ["grab_place03_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBybxaM-qdFR5hR2hyUHtYQAd3g0Mar6MvYVsfxNGaG6u4", "https://1drv.ms/u/c/7625f90385490ff5/IQCfuvu9ZvysRIC3T2WzdjP6AXzZso7yJNp8mAa9LCgru-U"],
  ["grab_place03_t__tablecloth__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBBGjJN6DSeQ4u7ZCiUVyz9Ae74tluLm4M1M3kBNJYZUEk", "https://1drv.ms/u/c/7625f90385490ff5/IQDOf4JUjEH8RoiqLpMyfYNHAaISnDIJzXp3vICkYxzCQZw"],
  ["bookshelf01_2__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBIA7BctLc9S46_L4E4Y7KsATmsKMG_Z6W8vpJLqVIRdGA", "https://1drv.ms/u/c/7625f90385490ff5/IQDYdTbz0kM6S5_Nq8DKN7r0ATkuW85_XtPUSoC-VI-YNXY"],
  ["bookshelf01_2__aruco_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQB3d145hGKVT7O6X8DybqEHAcIfnku5M_oytyjmG73feuM", "https://1drv.ms/u/c/7625f90385490ff5/IQBUA-xVOUm5R6t7o7wSbJQXAX7ycYZ2OhYfM2CJwpmE_to"],
  ["bookshelf01_2__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAuB861jstKQ4KADotdHsKnAX6XwdGftu70_g-QNJ0-fn4", "https://1drv.ms/u/c/7625f90385490ff5/IQDxMpOfb6SKRItYFd_8zn_VATIFID9NNL6ulUD_Yfghq-o"],
  ["grab_place02_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBHoAwiDh_fRJii8XB_8FbdAZcKXMx_fBvfOD1A3AA50VY", "https://1drv.ms/u/c/7625f90385490ff5/IQCHxZOgCmv3R6lVKIY1EIMRAUG30jVE7LYiHkc0siDQW5s"],
  ["grab_place02_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQD7oxP3-NRDTbUZ5Ygg6OgoAV6WZ-guJLH72hGgpV6pAQ4", "https://1drv.ms/u/c/7625f90385490ff5/IQCwVttFVaCOTZ9AbFp7wSZTARELD6zGyBJFW8dO7QR2WTg"],
  ["bookshelf01_2__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDjCwnQ9q-ZS5Fmydmom7r6AXNIsyr3WqiZ_zO0Xeeq7bk", "https://1drv.ms/u/c/7625f90385490ff5/IQDqLqmbPkCCQIEvOdzvzKteAeKbtYV0Z2nfNlmKY40oq84"],
  ["grab_place02_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBZodabJ26xS6mmnqSjz5tPAaTKChsJqe_py6-FXCzHHcs", "https://1drv.ms/u/c/7625f90385490ff5/IQAkvM0Vj8mwRIsa141RaNFwASQ9C6GoUAhAHOR6OZ5ysgY"],
  ["bookshelf01_2__apriltag_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDbvB_i6jYWTKJaK_k69j7iAUW6r_xICA_i8R_XVzkO7tw", "https://1drv.ms/u/c/7625f90385490ff5/IQDkJiIRysMMToZxBrUisrbPAaasEO4EW_LXB2YAYqxa4BM"],
  ["grab_place01_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBmp0R18Yh8TKIfn1K4FabtAXgsxlbVZlEX0VGi85StlIM", "https://1drv.ms/u/c/7625f90385490ff5/IQBwxNV5wO-rT4hyFmtPHKX4AeNNS9yeeScVSFHJz9pykI0"],
  ["grab_place01_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQCbEhQkSChiSY1L3IvD52YNAT-KCvqCEz7mFZiZtbEmNVw", "https://1drv.ms/u/c/7625f90385490ff5/IQAdDkG7zOJST4Jr25ZcUhiKAYYUyrBz4SHPl4IhZH_8sXA"],
  ["grab_place01_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAXR9RydS1_Sbn2Xwp_2yajAV7k2YKq7VH6f7bNToPq2D4", "https://1drv.ms/u/c/7625f90385490ff5/IQBbWRbQWBMnR5h1UcuLbZRhAYw3f4IgGvlrXkqLE6cYoBQ"],
  ["box01__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDhK9Y_Hu2jRbURViJDk19uAfQihEVZkMht8vD41-SzEGM", "https://1drv.ms/u/c/7625f90385490ff5/IQCFhNCYNoXmSZJ-y89XdPKLAZlaUCRIwZadXSsBc1g_dSQ"],
  ["box01__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBiYwaiLs-5Sr_HfUgf7sTdAX-gbiEa6UNEDokdpyDnefA", "https://1drv.ms/u/c/7625f90385490ff5/IQC9yLgagm9VRZLdcpt6RvstAYd0MbWptg62EgMtKLni0pk"],
  ["box01__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQDNCfQhPiaKT4PRiVfjaFwHAa0dA5xuf4hxKth6C3LPDOo", "https://1drv.ms/u/c/7625f90385490ff5/IQDuZWwzeP5hQL8CJz30sNwaAWvvBemVt2ZEOX_9NN8Ksoo"],
  ["zigzag_2_t__apriltag_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQA_08WsHGfdRbcS8IJcxGb6AQc0Ov5drrq6-45dTks9JCo", "https://1drv.ms/u/c/7625f90385490ff5/IQByTgll06rjTJbSsnazF4IOAXQujhL7cLL8QEZ8iXUq3NY"],
  ["zigzag_2_t__apriltag_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQAknr9gaR3RRqPbd99bVpdUAV8JuuwLYXaFmcS5HsMlsX0", "https://1drv.ms/u/c/7625f90385490ff5/IQAeRkxYx88DSpmjsGac_FhWASJ8S7K5USGctbMW8v8xXvg"],
  ["zigzag_2_t__aruco_4__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQC0AApEm2Y3RoBwCEgHYMxkAQ-nFrxQ_QP3p8GxzyTZSI0", "https://1drv.ms/u/c/7625f90385490ff5/IQA8hG4nTBwASoAT6e9DuEswAea-hVStVsMBGM1755W3mcI"],
  ["zigzag_2_t__table__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQBQN1DiWIulS5Mu-qoCC3-pAd0m1lKTijfzgacSSVfWdp0", "https://1drv.ms/u/c/7625f90385490ff5/IQAbU0UBl0lRTZXIlaxcbVbsAchqWOTZedEIkjeTD7rZJrw"],
  ["zigzag_2_t__aruco_2__insta360_x5", "Insta360 X5", "https://1drv.ms/u/c/7625f90385490ff5/IQB2yFK_cel-RKf3MQOUaZwzARG1RxFQgs6iE0oxybyx9Rw", "https://1drv.ms/u/c/7625f90385490ff5/IQB4DxnIVSYdQ7e5oogaUxrpARwOktxdZw-XMHsdAbyHUSo"],
];

const datasetDownloadLinks = Object.fromEntries(
  datasetDownloadRecords.map(([key, sensorName, rosbagUrl, tumUrl]) => [
    key,
    {
      rosbag: [{ label: `${sensorName} rosbag`, url: rosbagUrl }],
      tum: [{ label: `${sensorName} GT TUM`, url: tumUrl, title: `${sensorName} robot end-effector ground-truth TUM trajectory` }],
    },
  ]),
);

function normalize(value) {
  return value.trim().toLowerCase();
}

function sceneFilterToken(value) {
  return sceneKey(value).replace(/\s+/g, "");
}

function getTaskForCard(card) {
  const taskName = card.querySelector("h3")?.textContent.trim();
  return collectedScenes.find((item) => item.name === taskName);
}

function taskMatchesSceneSensor(task, sceneFilter, sensorFilter) {
  if (!task) return false;

  return buildSceneEntries(task).some((scene) => {
    const sceneMatches = sceneFilter === "all" || sceneFilterToken(scene.name) === sceneFilter;
    const sensorMatches = sensorFilter === "all" || scene.sensors.some((sensorName) => sensorFilterTokens[sensorName] === sensorFilter);
    return sceneMatches && sensorMatches;
  });
}

function updateTasks() {
  const query = searchInput ? normalize(searchInput.value) : "";
  let visibleCount = 0;

  cards.forEach((card) => {
    const category = card.dataset.category || "";
    const task = getTaskForCard(card);
    const searchText = normalize(`${card.textContent} ${card.dataset.search || ""} ${card.dataset.scenes || ""} ${card.dataset.sensors || ""}`);
    const categoryMatch = activeFilters.category === "all" || category === activeFilters.category;
    const sceneSensorMatch = taskMatchesSceneSensor(task, activeFilters.scene, activeFilters.sensor);
    const searchMatch = !query || searchText.includes(query);
    const visible = categoryMatch && sceneSensorMatch && searchMatch;

    card.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  if (taskCount) {
    taskCount.textContent = `Showing ${visibleCount} benchmark task${visibleCount === 1 ? "" : "s"}`;
  }

  if (taskEmpty) {
    taskEmpty.hidden = visibleCount !== 0;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.filterGroup || "category";
    const nextFilter = button.dataset.filter || "all";

    activeFilters[group] = nextFilter;
    filterButtons
      .filter((item) => (item.dataset.filterGroup || "category") === group)
      .forEach((item) => item.classList.toggle("is-active", item === button));
    updateTasks();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", updateTasks);
}

function createDownloadPill(label, fileName, title = label) {
  const anchor = document.createElement("a");
  anchor.className = "download-pill";
  anchor.href = /^https?:\/\//.test(fileName) ? fileName : `${releaseBaseUrl}${fileName}`;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.textContent = label;
  anchor.title = title;
  anchor.setAttribute("aria-label", title);
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

const scenePreviewImages = {
  table: "static/images/pic/scenes/table.jpg",
  tablecloth: "static/images/pic/scenes/tablecloth.jpg",
  "aruco 1": "static/images/pic/scenes/aruco2.jpg",
  "aruco 2": "static/images/pic/scenes/aruco2.jpg",
  "aruco 4": "static/images/pic/scenes/aruco4.jpg",
  "apriltag 1": "static/images/pic/scenes/apriltag2.jpg",
  "apriltag 2": "static/images/pic/scenes/apriltag2.jpg",
  "apriltag 4": "static/images/pic/scenes/apriltag4.jpg",
};

const scenePreviewColors = {
  table: "#f3f0e7",
  tablecloth: "#f7ece8",
  "aruco 1": "#eef1eb",
  "aruco 2": "#eef1eb",
  "aruco 4": "#eef1eb",
  "apriltag 1": "#ecefeb",
  "apriltag 2": "#ecefeb",
  "apriltag 4": "#ecefeb",
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

function syncVideoKey(taskSlug, sceneName, sensorName) {
  const sensorSlug = sensorVideoSlugs[sensorName];
  if (!taskSlug || !sensorSlug) return "";
  return `${taskSlug}__${sceneSlug(sceneName)}__${sensorSlug}`;
}

function syncVideoAssetName(taskSlug, sceneName, sensorName) {
  const sensorSlug = sensorVideoSlugs[sensorName];
  return `${syncVideoAssetPrefix}_${taskSlug}__${sceneSlug(sceneName)}__${sensorSlug}.mp4`;
}

function getSyncVideo(taskSlug, sceneName, sensorName) {
  const key = syncVideoKey(taskSlug, sceneName, sensorName);
  if (!key) {
    return { available: false, key };
  }

  if (invalidDataSequences.has(key)) {
    return { available: false, invalid: true, key };
  }

  const assetName = syncVideoAssetName(taskSlug, sceneName, sensorName);
  return {
    available: true,
    key,
    assetName,
    url: `${releaseBaseUrl}${encodeURIComponent(assetName)}`,
    label: sensorVideoLabels[sensorName],
    spec: sensorVideoSpecs[sensorName],
  };
}

function getDatasetDownloadRows(scene) {
  const rows = { rosbag: [], tum: [] };

  scene.sensors.forEach((sensorName) => {
    const key = syncVideoKey(scene.taskSlug, scene.name, sensorName);
    const links = datasetDownloadLinks[key];
    if (!links) return;

    rows.rosbag.push(...links.rosbag);
    rows.tum.push(...links.tum);
  });

  return [
    { label: "Rosbag", links: rows.rosbag },
    { label: "GT TUM", links: rows.tum },
  ].filter((row) => row.links.length);
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

function renderSequenceOverview() {
  if (!sequenceOverviewTable) return;

  sequenceOverviewTable.replaceChildren();

  const table = document.createElement("table");
  table.className = "sequence-overview-table";

  const thead = document.createElement("thead");
  const sceneRow = document.createElement("tr");
  const sensorRow = document.createElement("tr");
  const taskHeader = document.createElement("th");
  taskHeader.scope = "col";
  taskHeader.rowSpan = 2;
  taskHeader.textContent = "Task";
  sceneRow.appendChild(taskHeader);

  sequenceOverviewScenes.forEach((sceneName) => {
    const sceneHeader = document.createElement("th");
    sceneHeader.scope = "colgroup";
    sceneHeader.colSpan = sequenceOverviewSensors.length;
    sceneHeader.textContent = sceneName;
    sceneRow.appendChild(sceneHeader);

    sequenceOverviewSensors.forEach((sensor) => {
      const sensorHeader = document.createElement("th");
      sensorHeader.scope = "col";
      const abbr = document.createElement("abbr");
      abbr.title = sensor.name;
      abbr.textContent = sensor.shortName;
      sensorHeader.appendChild(abbr);
      sensorRow.appendChild(sensorHeader);
    });
  });

  thead.append(sceneRow, sensorRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  let availableCount = 0;

  collectedScenes.forEach((task, taskIndex) => {
    const taskSlug = taskSlugs[String(taskIndex + 1).padStart(2, "0")];
    const sceneEntries = buildSceneEntries(task).map((scene) => ({
      ...scene,
      key: sceneKey(scene.name),
    }));
    const available = new Set();
    sceneEntries.forEach((scene) => {
      scene.sensors.forEach((sensorName) => {
        const key = syncVideoKey(taskSlug, scene.name, sensorName);
        if (!invalidDataSequences.has(key)) {
          available.add(`${scene.key}__${sensorName}`);
        }
      });
    });

    const row = document.createElement("tr");
    const taskCell = document.createElement("th");
    taskCell.scope = "row";

    const taskButton = document.createElement("button");
    taskButton.className = "sequence-task-button";
    taskButton.type = "button";
    taskButton.textContent = task.name;
    taskButton.setAttribute("aria-label", `Open ${task.name} task details`);
    taskButton.addEventListener("click", () => {
      const card = cards[taskIndex];
      if (card) openTaskDetail(card);
    });

    taskCell.appendChild(taskButton);
    row.appendChild(taskCell);

    sequenceOverviewScenes.forEach((sceneName) => {
      const normalizedScene = sceneKey(sceneName);
      sequenceOverviewSensors.forEach((sensor) => {
        const cell = document.createElement("td");
        const hasSequence = available.has(`${normalizedScene}__${sensor.name}`);
        cell.className = `sequence-cell${hasSequence ? " is-available" : ""}`;
        cell.title = hasSequence
          ? `${task.name}: ${sceneName} / ${sensor.name} available`
          : `${task.name}: ${sceneName} / ${sensor.name} not available`;
        cell.setAttribute("aria-label", cell.title);
        if (hasSequence) {
          cell.textContent = "✓";
          availableCount += 1;
        }
        row.appendChild(cell);
      });
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  sequenceOverviewTable.appendChild(table);

  if (sequenceOverviewCount) {
    sequenceOverviewCount.textContent = `${availableCount} usable sequence streams across ${collectedScenes.length} tasks`;
  }
}

function renderScenePreview(scene) {
  if (!taskDetailRefs.photo) return;
  const key = sceneKey(scene.name);
  const image = scenePreviewImages[key] || scenePreviewImages.table;
  taskDetailRefs.photo.style.backgroundColor = scenePreviewColors[key] || "#eef3ef";
  taskDetailRefs.photo.style.backgroundImage = `url("${image}")`;
  taskDetailRefs.photo.style.backgroundPosition = "center";
  taskDetailRefs.photo.style.backgroundRepeat = "no-repeat";
  taskDetailRefs.photo.style.backgroundSize = "contain";
  taskDetailRefs.photo.style.transform = "";
  taskDetailRefs.photo.dataset.scenePreview = sceneFilterToken(scene.name);
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

function renderSensorDetail(scene) {
  taskDetailRefs.sensorTitle.textContent = scene.name;
  taskDetailRefs.sensorMeta.textContent = `${scene.sensors.length} usable sensor stream${scene.sensors.length === 1 ? "" : "s"}`;
  taskDetailRefs.sensorList.replaceChildren();
  taskDetailRefs.sceneDownloads.replaceChildren();

  scene.sensors.forEach((sensorName) => {
    const sensor = sensorCatalog[sensorName];
    const video = getSyncVideo(scene.taskSlug, scene.name, sensorName);
    const card = document.createElement("article");
    card.className = "detail-sensor-card";

    const top = document.createElement("div");
    top.className = "detail-sensor-top";

    const title = document.createElement("strong");
    title.textContent = sensorName;

    top.append(title, createStatusBadge(video.invalid ? "invalid data" : video.available ? "video synced" : "no synced video", video.available ? "good" : "warn"));

    const role = document.createElement("span");
    role.textContent = sensor.role;

    const signals = document.createElement("p");
    signals.textContent = sensor.signals;

    card.append(top, role, signals);

    if (video.available) {
      const videoPanel = document.createElement("div");
      videoPanel.className = "sync-video-panel";

      const videoTop = document.createElement("div");
      videoTop.className = "sync-video-top";

      const videoLabel = document.createElement("span");
      videoLabel.textContent = video.label;

      const videoLink = document.createElement("a");
      videoLink.href = video.url;
      videoLink.target = "_blank";
      videoLink.rel = "noopener";
      videoLink.textContent = "Open MP4";

      videoTop.append(videoLabel, videoLink);

      const player = document.createElement("video");
      player.className = "sync-video-player";
      player.controls = true;
      player.preload = "metadata";
      player.playsInline = true;
      player.muted = true;
      player.poster = scenePreviewImages[sceneKey(scene.name)] || scenePreviewImages.table;
      player.src = video.url;
      player.setAttribute("aria-label", `${sensorName} ${scene.name} synchronized trajectory video`);

      const videoMeta = document.createElement("p");
      videoMeta.className = "sync-video-meta";
      videoMeta.textContent = video.spec;

      videoPanel.append(videoTop, player, videoMeta);
      card.appendChild(videoPanel);
    } else {
      const missing = document.createElement("p");
      missing.className = "sync-video-missing";
      missing.textContent = video.invalid
        ? "This sensor sequence is excluded from the usable dataset after rosbag/TUM synchronization found no overlapping frames."
        : "No synchronized image frames overlap this robot trajectory window.";
      card.appendChild(missing);
    }

    taskDetailRefs.sensorList.appendChild(card);
  });

  taskDetailRefs.sensorNote.textContent = scene.sensors.includes("Insight9")
    ? "This scene contains both the wide-view VIO stream and the stereo companion stream."
    : "Only the public usable Insta360 X5 stream is listed for this scene.";

  const datasetDownloadRows = getDatasetDownloadRows(scene);
  if (datasetDownloadRows.length) {
    const heading = document.createElement("div");
    heading.className = "download-heading";

    const title = document.createElement("span");
    title.textContent = "Data links";

    const release = document.createElement("small");
    release.textContent = "OneDrive";

    heading.append(title, release);
    taskDetailRefs.sceneDownloads.appendChild(heading);
    datasetDownloadRows.forEach((row) => {
      taskDetailRefs.sceneDownloads.appendChild(createDownloadRow(row.label, row.links.map((link) => createDownloadPill(link.label, link.url, link.title))));
    });
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
      renderScenePreview(scene);
    });

    if (index === 0) {
      button.classList.add("is-active");
      renderSensorDetail(scene);
      renderScenePreview(scene);
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
    taskSlug,
    releaseSlug: taskSlug ? `${taskSlug}_${sceneSlug(scene.name)}` : "",
  }));

  lastTaskTrigger = photo;
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

renderSequenceOverview();
updateTasks();
