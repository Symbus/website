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

if (queryMap) {
  mapName.textContent = queryMap;
}

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

function SetStatusChanged(status) {
  if (!status) return;

  statusText.textContent = status;
  footerStatus.textContent = status;
  serverStatus.textContent = "Loading";
}

function SetFilesTotal(total) {
  filesTotal = Number(total) || 0;
  updateProgress();
}

function SetFilesNeeded(needed) {
  filesNeeded = Number(needed) || 0;
  updateProgress();

  if (filesTotal > 0 && filesNeeded <= 0) {
    serverStatus.textContent = "Almost ready";
  }
}

function DownloadingFile(fileName) {
  // Garry's Mod can call this many times per second.
  // Do not put the rapidly-changing filename into the layout:
  // that was causing visible movement/jitter in the loading page.
  downloadText.textContent = "Downloading server content...";
  footerStatus.textContent = "Downloading server content...";
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
