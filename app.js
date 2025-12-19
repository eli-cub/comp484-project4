const MAP_IMG_URL = "img/csun-map.png";

const BUILDINGS = {
  "Bayramian Hall": {
    code: "BH",
    grid: "C4",
    bounds: [[530, 308], [589, 400]]
  },
  "Oviatt Library": { code: "OV", grid: "D4", bounds: [[498, 422], [555, 528]] },
  "Student Union (USU)": { code: "USU", grid: "F4", bounds: [[501, 730], [545, 791]] },
  "Jacaranda Hall": { code: "JA", grid: "E5", bounds: [[624, 474], [716, 590]] },
  "Sierra Hall": { code: "SH", grid: "C3", bounds: [[343, 311], [376, 415]] }
};

const QUESTIONS = [
  "Bayramian Hall",
  "Oviatt Library",
  "Student Union (USU)",
  "Jacaranda Hall",
  "Sierra Hall"
];

const promptEl = document.getElementById("prompt");
const scoreEl = document.getElementById("score");
const logEl = document.getElementById("log");
const finalEl = document.getElementById("final");
const startBtn = document.getElementById("startBtn");
const calibModeEl = document.getElementById("calibMode");

// map setup
const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomControl: false,
  doubleClickZoom: false,
  dragging: false,
  scrollWheelZoom: false,
  touchZoom: false,
  boxZoom: false,
  keyboard: false,
});

let imageBounds;
let overlayLayer;
let feedbackLayer = null;

function clearFeedback() {
  if (feedbackLayer) {
    map.removeLayer(feedbackLayer);
    feedbackLayer = null;
  }
}

// show green or red box
function showBounds(bounds, color) {
  clearFeedback();
  feedbackLayer = L.rectangle(bounds, {
    color,
    weight: 2,
    fillOpacity: 0.35
  }).addTo(map);
}

const img = new Image();
img.onload = () => {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  imageBounds = [[0, 0], [h, w]];

  overlayLayer = L.imageOverlay(MAP_IMG_URL, imageBounds).addTo(map);
  map.fitBounds(imageBounds);

  resetGame();
};
img.src = MAP_IMG_URL;

// keeps track of game state
let round = 0;
let correct = 0;
let incorrect = 0;
let historyLines = [];

// updates the prompt text
function setPrompt() {
  const name = QUESTIONS[round];
  const b = BUILDINGS[name];
  promptEl.textContent = `Double click where you think ${name} is (${b.grid})`;
}

// updates the score line
function updateScore() {
  scoreEl.textContent = `Score: ${correct} Correct, ${incorrect} Incorrect`;
}

function addHistoryLine(text, cls) {
  historyLines.push({ text, cls });
  renderHistory();
}

function renderHistory() {
  logEl.innerHTML = historyLines
    .map(h => `<div class="${h.cls || ""}">${h.text}</div>`)
    .join("");
}

function finishGame() {
  promptEl.textContent = "Done!";
  finalEl.textContent = `${correct} Correct, ${incorrect} Incorrect`;
}

function resetGame() {
  round = 0;
  correct = 0;
  incorrect = 0;
  historyLines = [];
  finalEl.textContent = "";
  clearFeedback();
  updateScore();
  setPrompt();
  renderHistory();
}

startBtn.addEventListener("click", resetGame);

// check if click is inside the building
function pointInBounds(latlng, bounds) {
  const y = latlng.lat;
  const x = latlng.lng;
  const y1 = Math.min(bounds[0][0], bounds[1][0]);
  const y2 = Math.max(bounds[0][0], bounds[1][0]);
  const x1 = Math.min(bounds[0][1], bounds[1][1]);
  const x2 = Math.max(bounds[0][1], bounds[1][1]);
  return (y >= y1 && y <= y2 && x >= x1 && x <= x2);
}

// handle the double click
map.on("dblclick", (e) => {
  if (calibModeEl.checked) {
    addHistoryLine(`Calib click: [${e.latlng.lat.toFixed(0)}, ${e.latlng.lng.toFixed(0)}]`, "");
    return;
  }

  if (round >= QUESTIONS.length) return;

  const name = QUESTIONS[round];
  const building = BUILDINGS[name];

  const b = building.bounds;
  const looksUnset = (b[0][0] === 0 && b[0][1] === 0 && b[1][0] === 0 && b[1][1] === 0);
  if (looksUnset) {
    addHistoryLine("Bounds not set yet; use calibration mode.", "bad");
    return;
  }

  const isCorrect = pointInBounds(e.latlng, building.bounds);

  if (isCorrect) {
    correct++;
    addHistoryLine("Your answer is correct!!", "good");
    showBounds(building.bounds, "green");
  } else {
    incorrect++;
    addHistoryLine("Sorry wrong location.", "bad");
    showBounds(building.bounds, "red");
  }

  updateScore();
  round++;
  if (round >= QUESTIONS.length) {
    finishGame();
  } else {
    setPrompt();
  }
});
