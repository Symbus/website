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
let finishing = false;
let lastDownloadActivity = 0;
let finishTimer = null;

const statusText = document.getElementById("statusText");
const downloadText = document.getElementById("downloadText");
const progressBar = document.getElementById("progressBar");
const progressTrack = document.querySelector(".progress-track");
const progressMeta = document.querySelector(".progress-meta");
const progressLabel = document.getElementById("progressLabel");
const fileCounter = document.getElementById("fileCounter");
const footerStatus = document.getElementById("footerStatus");
const serverStatus = document.getElementById("serverStatus");
const tipText = document.getElementById("tipText");
const mapName = document.getElementById("mapName");
const playerName = document.getElementById("playerName");
const playerSubtext = document.getElementById("playerSubtext");
const playerAvatar = document.getElementById("playerAvatar");

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setFallbackAvatar() {
  playerAvatar.removeAttribute("src");
  playerAvatar.alt = "";
}

function showRandomTip() {
  tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
}

showRandomTip();
setInterval(showRandomTip, 9000);

const queryMap = getQueryParam("map");
const querySteamId = getQueryParam("steamid");

if (queryMap) mapName.textContent = queryMap;

async function loadSteamProfile(steamId) {
  if (!steamId) {
    playerName.textContent = "Player";
    playerSubtext.textContent = "Joining Short Bytes";
    setFallbackAvatar();
    return;
  }

  playerName.textContent = "Player";
  playerSubtext.textContent = "Looking up Steam profile...";

  try {
    const response = await fetch(
      `https://playerdb.co/api/player/steam/${encodeURIComponent(steamId)}`
    );

    if (!response.ok) throw new Error(`PlayerDB returned ${response.status}`);

    const json = await response.json();
    const player = json && json.data && json.data.player;
    if (!player) throw new Error("No player data returned");

    playerName.textContent = player.username || "Player";
    playerSubtext.textContent = "Joining Short Bytes";

    if (player.avatar) {
      playerAvatar.src = player.avatar;
      playerAvatar.alt = `${player.username || "Steam player"} avatar`;
    } else {
      setFallbackAvatar();
    }
  } catch (error) {
    console.warn("Steam profile lookup failed:", error);
    playerName.textContent = "Player";
    playerSubtext.textContent = "Joining Short Bytes";
    setFallbackAvatar();
  }
}

loadSteamProfile(querySteamId);

function enterFinishingState(message = "Finishing connection...") {
  if (finishing) return;
  finishing = true;

  statusText.textContent = message;
  downloadText.textContent = "Preparing the map and game state...";
  footerStatus.textContent = message;
  serverStatus.textContent = "Almost ready";

  progressTrack.classList.add("indeterminate");
  progressMeta.classList.add("finishing");
  progressLabel.textContent = "Almost ready...";
}

function leaveFinishingState() {
  if (!finishing) return;
  finishing = false;
  progressTrack.classList.remove("indeterminate");
  progressMeta.classList.remove("finishing");
}

function scheduleFinishingState() {
  clearTimeout(finishTimer);

  // If GMod stops reporting download progress for a few seconds while
  // connection work continues, stop pretending the frozen file count
  // represents the remaining join progress.
  finishTimer = setTimeout(() => {
    const quietFor = Date.now() - lastDownloadActivity;
    if (!finishing && filesTotal > 0 && quietFor >= 3500) {
      enterFinishingState();
    }
  }, 3700);
}

function updateProgress() {
  if (finishing) return;

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

function friendlyStatus(status) {
  if (!status) return "Loading server...";

  const s = String(status).toLowerCase();

  if (
    s.includes("loading '") ||
    s.includes("workshop") ||
    /^\s*\d+\s*\/\s*\d+/.test(s)
  ) {
    return "Downloading Workshop Content...";
  }

  if (s.includes("client info sent")) return "Client info sent!";
  if (s.includes("sending client info")) return "Sending client info...";
  if (s.includes("retrieving server info")) return "Retrieving server info...";
  if (s.includes("connecting")) return "Connecting to server...";
  if (s.includes("starting lua")) return "Starting Lua...";
  if (s.includes("initializing")) return "Initializing...";
  if (s.includes("precaching")) return "Preparing game content...";

  return status;
}

function statusMeansDownloadIsOver(status) {
  const s = String(status || "").toLowerCase();

  return (
    s.includes("client info sent") ||
    s.includes("sending client info") ||
    s.includes("starting lua") ||
    s.includes("initializing") ||
    s.includes("precaching") ||
    s.includes("spawning") ||
    s.includes("ready")
  );
}

function SetStatusChanged(status) {
  if (!status) return;

  if (statusMeansDownloadIsOver(status) && filesTotal > 0) {
    enterFinishingState("Finishing connection...");
    return;
  }

  if (!finishing) {
    const friendly = friendlyStatus(status);
    statusText.textContent = friendly;
    footerStatus.textContent = friendly;
    serverStatus.textContent = "Loading";
  }
}

function SetFilesTotal(total) {
  filesTotal = Number(total) || 0;
  lastDownloadActivity = Date.now();
  updateProgress();
  scheduleFinishingState();
}

function SetFilesNeeded(needed) {
  const nextNeeded = Number(needed) || 0;

  if (nextNeeded !== filesNeeded) {
    lastDownloadActivity = Date.now();
  }

  filesNeeded = nextNeeded;

  if (!finishing) {
    updateProgress();
    scheduleFinishingState();
  }

  if (filesTotal > 0 && filesNeeded <= 0) {
    enterFinishingState("Finishing connection...");
  }
}

function DownloadingFile(fileName) {
  lastDownloadActivity = Date.now();

  if (!finishing) {
    downloadText.textContent = "Downloading server content...";
    scheduleFinishingState();
  }
}

function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
  if (mapname) mapName.textContent = mapname;

  if (steamid && steamid !== querySteamId) {
    loadSteamProfile(steamid);
  }

  if (servername) {
    document.title = `${servername} - Loading`;
  }
}
