// Short Bytes TTT loading screen
// Supports Garry's Mod loading URL callbacks.

const tips = [
  "Traitors win through deception. Innocents win through communication.",
  "If you hear gunfire, identify the shooter before opening fire yourself.",
  "Detectives are confirmed Innocents. Use their information carefully.",
  "A missing player can be just as suspicious as an aggressive one.",
  "Call out bodies, locations and suspicious behaviour clearly.",
  "Do not assume someone is a Traitor just because they are holding a Traitor weapon.",
  "Use voice chat to share useful information, not to drown out the round.",
  "A good Traitor does not always need to shoot first."
];

let filesTotal = 0;
let filesNeeded = 0;

const statusText = document.getElementById("statusText");
const downloadText = document.getElementById("downloadText");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const fileCounter = document.getElementById("fileCounter");
const footerStatus = document.getElementById("footerStatus");
const serverStatus = document.getElementById("serverStatus");
const tipText = document.getElementById("tipText");
const mapName = document.getElementById("mapName");
const playerId = document.getElementById("playerId");

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const map = getQueryParam("map");
const steamid = getQueryParam("steamid");

if (map) {
  mapName.textContent = map;
}

if (steamid) {
  playerId.textContent = steamid;
}

function showRandomTip() {
  tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
}

showRandomTip();
setInterval(showRandomTip, 9000);

function updateProgress() {
  if (filesTotal <= 0) {
    progressBar.style.width = "0%";
    progressLabel.textContent = "0%";
    fileCounter.textContent = "0 / 0 files";
    return;
  }

  const completed = Math.max(0, filesTotal - filesNeeded);
  const percent = Math.max(0, Math.min(100, (completed / filesTotal) * 100));

  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${Math.round(percent)}%`;
  fileCounter.textContent = `${completed} / ${filesTotal} files`;
}

// Called by Garry's Mod.
function SetStatusChanged(status) {
  if (!status) return;

  statusText.textContent = status;
  footerStatus.textContent = status;
  serverStatus.textContent = "Loading";
}

// Called by Garry's Mod.
function SetFilesTotal(total) {
  filesTotal = Number(total) || 0;
  updateProgress();
}

// Called by Garry's Mod.
function SetFilesNeeded(needed) {
  filesNeeded = Number(needed) || 0;
  updateProgress();

  if (filesTotal > 0 && filesNeeded <= 0) {
    serverStatus.textContent = "Almost ready";
  }
}

// Called by Garry's Mod.
function DownloadingFile(fileName) {
  if (!fileName) return;

  downloadText.textContent = `Downloading ${fileName}`;
  footerStatus.textContent = `Downloading ${fileName}`;
}

// Optional compatibility callbacks used by some loading implementations.
function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
  if (mapname) {
    mapName.textContent = mapname;
  }

  if (steamid) {
    playerId.textContent = steamid;
  }

  if (servername) {
    document.title = `${servername} - Loading`;
  }
}
