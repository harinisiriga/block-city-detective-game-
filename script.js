const districts = [
  {
    name: "Downtown Market",
    palette: ["#f4a261", "#2a9d8f", "#e9c46a", "#e76f51"],
    clueFlavor: "A vendor saw square footprints beside the melon stand.",
  },
  {
    name: "Neon Pier",
    palette: ["#3a86ff", "#ff006e", "#8338ec", "#06d6a0"],
    clueFlavor: "Wet cube prints led away from the arcade lights.",
  },
  {
    name: "Museum Lane",
    palette: ["#b8c0ff", "#ffd6a5", "#caffbf", "#9bf6ff"],
    clueFlavor: "A display case was opened with a blocky bronze key.",
  },
  {
    name: "Rooftop Gardens",
    palette: ["#80ed99", "#57cc99", "#38a3a5", "#f9c74f"],
    clueFlavor: "Leaves were scattered in a perfect staircase pattern.",
  },
  {
    name: "Central Station",
    palette: ["#adb5bd", "#f8961e", "#277da1", "#f94144"],
    clueFlavor: "A ticket machine printed one suspicious cube-shaped receipt.",
  },
];

const suspectsPool = [
  {
    name: "Brick Benny",
    icon: "B",
    traits: ["red cap", "paint smudge", "fast runner"],
    clueMap: {
      color: "warm red",
      evidence: "paint dust",
      habit: "quick footsteps",
      gear: "cap",
    },
    hat: "#d62828",
    shirt: "#f77f00",
  },
  {
    name: "Pixel Penny",
    icon: "P",
    traits: ["green scarf", "tiny shovel", "left-handed"],
    clueMap: {
      color: "green cloth",
      evidence: "garden soil",
      habit: "left-side marks",
      gear: "small digging tool",
    },
    hat: "#06d6a0",
    shirt: "#118ab2",
  },
  {
    name: "Cube Carl",
    icon: "C",
    traits: ["blue boots", "gold button", "hums loudly"],
    clueMap: {
      color: "blue rubber",
      evidence: "golden fleck",
      habit: "faint humming",
      gear: "boots",
    },
    hat: "#3a86ff",
    shirt: "#ffbe0b",
  },
  {
    name: "Mosaic Mia",
    icon: "M",
    traits: ["purple hood", "chalk dust", "map lover"],
    clueMap: {
      color: "purple fabric",
      evidence: "chalk powder",
      habit: "route planning",
      gear: "hood",
    },
    hat: "#8338ec",
    shirt: "#fb5607",
  },
  {
    name: "Voxel Vik",
    icon: "V",
    traits: ["black gloves", "silver badge", "coffee fan"],
    clueMap: {
      color: "dark thread",
      evidence: "silver scratch",
      habit: "coffee smell",
      gear: "gloves",
    },
    hat: "#212529",
    shirt: "#8ecae6",
  },
  {
    name: "Lantern Lou",
    icon: "L",
    traits: ["yellow vest", "oil stain", "whistles"],
    clueMap: {
      color: "bright yellow",
      evidence: "oil mark",
      habit: "soft whistle",
      gear: "vest",
    },
    hat: "#ffb703",
    shirt: "#2b9348",
  },
];

const vagueClueTemplates = [
  "Witness note: something {color} flashed near the scene.",
  "Forensics report: a trace of {evidence} was found on a block edge.",
  "Audio clue: someone nearby left behind {habit}.",
  "Shape clue: the mark matches a person known for their {gear}.",
];

const redHerrings = [
  "A witness changed their story twice, so one clue may be noisy.",
  "Two suspects crossed the area within the same minute.",
  "The city lights made colors harder to read.",
  "Rain blurred part of the trail before detectives arrived.",
  "A prankster moved one loose block after the crime.",
];

const state = {
  caseIndex: 0,
  score: 0,
  streak: 0,
  time: 45,
  culprit: null,
  suspects: [],
  district: districts[0],
  locked: false,
  timerId: null,
  hintUsed: false,
};

const districtButtons = document.querySelector("#districtButtons");
const cityScene = document.querySelector("#cityScene");
const locationName = document.querySelector("#locationName");
const caseBadge = document.querySelector("#caseBadge");
const clues = document.querySelector("#clues");
const suspects = document.querySelector("#suspects");
const score = document.querySelector("#score");
const streak = document.querySelector("#streak");
const timer = document.querySelector("#timer");
const messagePanel = document.querySelector("#messagePanel");
const hintBtn = document.querySelector("#hintBtn");
const newGameBtn = document.querySelector("#newGameBtn");
const scenePanel = document.querySelector(".scene-panel");
const confetti = document.querySelector("#confetti");

function sample(items, count) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function renderDistrictButtons() {
  districtButtons.innerHTML = "";
  districts.forEach((district, index) => {
    const button = document.createElement("button");
    button.className = `district-button ${state.district.name === district.name ? "active" : ""}`;
    button.type = "button";
    button.textContent = district.name;
    button.addEventListener("click", () => startCase(index));
    districtButtons.append(button);
  });
}

function renderScene() {
  const heights = [130, 190, 150, 220, 120, 170, 205];
  cityScene.innerHTML = "";
  state.district.palette.forEach((color, index) => {
    const building = document.createElement("div");
    building.className = "building";
    building.style.height = `${heights[(index + state.caseIndex) % heights.length]}px`;
    building.style.setProperty("--building-color", color);
    cityScene.append(building);
  });

  const street = document.createElement("div");
  street.className = "street";
  cityScene.append(street);
  scenePanel.classList.toggle("night", state.caseIndex % 2 === 1);
}

function renderClues(showHint = false) {
  const clueKeys = sample(["color", "evidence", "habit", "gear"], 2);
  const clueList = [
    state.district.clueFlavor,
    ...clueKeys.map((key) =>
      vagueClueTemplates.find((template) => template.includes(`{${key}}`))
        .replace(`{${key}}`, state.culprit.clueMap[key])
    ),
    sample(redHerrings, 1)[0],
  ];

  if (showHint) {
    const hiddenTrait = sample(state.culprit.traits, 1)[0];
    clueList.push(`Tiny hint: one real suspect detail is "${hiddenTrait}".`);
  }

  clues.innerHTML = clueList
    .map((clue) => `<div class="clue">${clue}</div>`)
    .join("");
}

function renderSuspects() {
  suspects.innerHTML = "";
  state.suspects.forEach((suspect) => {
    const card = document.createElement("button");
    card.className = "suspect-card";
    card.type = "button";
    card.style.setProperty("--hat-color", suspect.hat);
    card.style.setProperty("--shirt-color", suspect.shirt);
    card.innerHTML = `
      <div class="suspect-avatar">${suspect.icon}</div>
      <h3>${suspect.name}</h3>
      <div class="trait-list">
        ${suspect.traits.map((trait) => `<span class="trait">${trait}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => guess(suspect));
    suspects.append(card);
  });
}

function renderStatus() {
  score.textContent = state.score;
  streak.textContent = state.streak;
  timer.textContent = state.time;
  timer.classList.toggle("low", state.time <= 10);
  locationName.textContent = state.district.name;
  caseBadge.textContent = `Case ${state.caseIndex + 1} / ${districts.length}`;
}

function setMessage(type, title, text) {
  messagePanel.className = `message-panel ${type}`;
  messagePanel.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    if (state.locked) return;
    state.time -= 1;
    renderStatus();

    if (state.time <= 0) {
      state.locked = true;
      state.streak = 0;
      setMessage("wrong", "Time is up.", `${state.culprit.name} slipped away. Next district loading...`);
      disableSuspects();
      setTimeout(nextCase, 1500);
    }
  }, 1000);
}

function playTone(success) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.frequency.value = success ? 620 : 180;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
}

function throwConfetti() {
  confetti.innerHTML = "";
  const colors = ["#f94144", "#f9c74f", "#43aa8b", "#577590", "#f3722c"];
  for (let i = 0; i < 34; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.setProperty("--piece-color", colors[i % colors.length]);
    confetti.append(piece);
  }
}

function disableSuspects() {
  document.querySelectorAll(".suspect-card").forEach((card) => {
    card.disabled = true;
  });
}

function guess(suspect) {
  if (state.locked) return;
  state.locked = true;
  disableSuspects();

  const correct = suspect.name === state.culprit.name;
  if (correct) {
    const bonus = Math.max(5, state.time) + (state.hintUsed ? 0 : 10);
    state.streak += 1;
    state.score += 50 + bonus + state.streak * 5;
    setMessage("correct", "Solved!", `${suspect.name} matched the clues. Bonus points secured.`);
    throwConfetti();
    playTone(true);
  } else {
    state.streak = 0;
    state.score = Math.max(0, state.score - 15);
    setMessage("wrong", "Not quite.", `${suspect.name} has an alibi. The criminal was ${state.culprit.name}.`);
    playTone(false);
  }

  renderStatus();
  setTimeout(nextCase, 1700);
}

function startCase(index = state.caseIndex) {
  state.caseIndex = index;
  state.district = districts[index];
  state.suspects = sample(suspectsPool, 4);
  state.culprit = state.suspects[Math.floor(Math.random() * state.suspects.length)];
  state.time = 45;
  state.locked = false;
  state.hintUsed = false;

  renderDistrictButtons();
  renderScene();
  renderClues();
  renderSuspects();
  renderStatus();
  setMessage("", "Case opened.", "Study the clues, compare the suspects, and make your call.");
  startTimer();
}

function nextCase() {
  if (state.caseIndex >= districts.length - 1) {
    clearInterval(state.timerId);
    state.locked = true;
    setMessage("correct", "Run complete.", `Final score: ${state.score}. Start a new case run to beat it.`);
    return;
  }
  startCase(state.caseIndex + 1);
}

hintBtn.addEventListener("click", () => {
  if (state.locked || state.hintUsed) return;
  state.hintUsed = true;
  state.score = Math.max(0, state.score - 5);
  renderClues(true);
  renderStatus();
  setMessage("", "Hint unlocked.", "It costs 5 points, but a good detective uses every tool.");
});

newGameBtn.addEventListener("click", () => {
  state.caseIndex = 0;
  state.score = 0;
  state.streak = 0;
  startCase(0);
});

startCase(0);
