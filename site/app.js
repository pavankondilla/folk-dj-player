(function () {
  const audio = document.getElementById("audio");
  const art = document.getElementById("art");
  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const seek = document.getElementById("seek");
  const curTime = document.getElementById("curTime");
  const durTime = document.getElementById("durTime");
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn = document.getElementById("repeatBtn");
  const volume = document.getElementById("volume");
  const statusEl = document.getElementById("status");
  const playlistEl = document.getElementById("playlist");
  const trackCount = document.getElementById("trackCount");
  const stopBtn = document.getElementById("stopBtn");
  const floatBtn = document.getElementById("floatBtn");
  const pipBtn = document.getElementById("pipBtn");
  const installBtn = document.getElementById("installBtn");
  const miniPlayer = document.getElementById("miniPlayer");
  const miniTitle = document.getElementById("miniTitle");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniStopBtn = document.getElementById("miniStopBtn");
  const miniCloseBtn = document.getElementById("miniCloseBtn");
  const miniDrag = document.getElementById("miniDrag");

  let order = PLAYLIST.map((_, i) => i);
  let pos = 0; // index into `order`
  let shuffle = false;
  let repeatMode = 0; // 0 off, 1 repeat all, 2 repeat one
  let isSeeking = false;

  trackCount.textContent = PLAYLIST.length + " tracks";

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return m + ":" + sec;
  }

  function currentIndex() {
    return order[pos];
  }

  function renderPlaylist() {
    playlistEl.innerHTML = "";
    PLAYLIST.forEach((song, i) => {
      const row = document.createElement("div");
      row.className = "track" + (i === currentIndex() ? " playing" : "");
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.innerHTML =
        '<span class="num">' + (i + 1) + '</span>' +
        '<span class="info"><div class="t"></div><div class="a"></div></span>' +
        '<span class="eq">' + (i === currentIndex() && !audio.paused ? "♪" : "") + '</span>';
      row.querySelector(".t").textContent = song.title;
      row.querySelector(".a").textContent = song.artist || "";
      row.addEventListener("click", () => {
        const idx = order.indexOf(i);
        pos = idx !== -1 ? idx : 0;
        loadTrack(true);
      });
      playlistEl.appendChild(row);
    });
  }

  function buildOrder() {
    order = PLAYLIST.map((_, i) => i);
    if (shuffle) {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
  }

  function loadTrack(autoplay) {
    const song = PLAYLIST[currentIndex()];
    if (!song) return;
    audio.src = song.file;
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist || "";
    miniTitle.textContent = song.title;
    statusEl.textContent = "";
    seek.value = 0;
    curTime.textContent = "0:00";
    durTime.textContent = "0:00";
    renderPlaylist();
    updateMediaSession(song);
    if (autoplay) {
      audio.play().catch(() => {
        statusEl.textContent = "Tap play to start.";
      });
    }
    try { localStorage.setItem("folkdj_last", String(currentIndex())); } catch (e) {}
  }

  function updatePlayState() {
    const playing = !audio.paused && !audio.ended;
    playBtn.textContent = playing ? "⏸️" : "▶️";
    miniPlayBtn.textContent = playing ? "⏸️" : "▶️";
    art.classList.toggle("spinning", playing);
    renderPlaylist();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  }

  function stopPlayback() {
    audio.pause();
    audio.currentTime = 0;
    seek.value = 0;
    curTime.textContent = "0:00";
    updatePlayState();
  }

  function updateMediaSession(song) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "Folk DJ",
        album: "Folk DJ Playlist",
      });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", playPrev);
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext(false));
      navigator.mediaSession.setActionHandler("stop", stopPlayback);
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null && isFinite(audio.duration)) {
          audio.currentTime = details.seekTime;
        }
      });
    } catch (e) {}
  }

  function playNext(auto) {
    if (repeatMode === 2 && auto) {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (pos < order.length - 1) {
      pos++;
    } else if (repeatMode === 1) {
      pos = 0;
    } else if (auto) {
      art.classList.remove("spinning");
      playBtn.textContent = "▶️";
      return; // stop at end of list
    } else {
      pos = 0;
    }
    loadTrack(true);
  }

  function playPrev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    pos = pos > 0 ? pos - 1 : order.length - 1;
    loadTrack(true);
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => { statusEl.textContent = "Couldn't play this track."; });
    } else {
      audio.pause();
    }
  });

  nextBtn.addEventListener("click", () => playNext(false));
  prevBtn.addEventListener("click", playPrev);

  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    const currentSongIdx = currentIndex();
    buildOrder();
    pos = order.indexOf(currentSongIdx);
    shuffleBtn.classList.toggle("active", shuffle);
    renderPlaylist();
  });

  repeatBtn.addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.classList.toggle("active", repeatMode !== 0);
    repeatBtn.textContent = repeatMode === 2 ? "🔂" : "🔁";
  });

  audio.addEventListener("play", updatePlayState);
  audio.addEventListener("pause", updatePlayState);
  audio.addEventListener("ended", () => playNext(true));

  audio.addEventListener("timeupdate", () => {
    if (isSeeking) return;
    if (audio.duration) {
      seek.value = (audio.currentTime / audio.duration) * 100;
    }
    curTime.textContent = fmtTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    durTime.textContent = fmtTime(audio.duration);
  });

  audio.addEventListener("error", () => {
    statusEl.textContent = "This track failed to load — skipping to next.";
    setTimeout(() => playNext(true), 800);
  });

  seek.addEventListener("input", () => { isSeeking = true; });
  seek.addEventListener("change", () => {
    if (audio.duration) {
      audio.currentTime = (seek.value / 100) * audio.duration;
    }
    isSeeking = false;
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    try { localStorage.setItem("folkdj_vol", volume.value); } catch (e) {}
  });

  stopBtn.addEventListener("click", stopPlayback);
  miniStopBtn.addEventListener("click", stopPlayback);

  miniPlayBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => { statusEl.textContent = "Couldn't play this track."; });
    } else {
      audio.pause();
    }
  });

  function showMiniPlayer() {
    miniPlayer.hidden = false;
    floatBtn.classList.add("active");
    try { localStorage.setItem("folkdj_mini", "1"); } catch (e) {}
  }
  function hideMiniPlayer() {
    miniPlayer.hidden = true;
    floatBtn.classList.remove("active");
    try { localStorage.setItem("folkdj_mini", "0"); } catch (e) {}
  }
  floatBtn.addEventListener("click", () => {
    if (miniPlayer.hidden) showMiniPlayer(); else hideMiniPlayer();
  });
  miniCloseBtn.addEventListener("click", hideMiniPlayer);

  // Drag to reposition the floating overlay (touch + mouse), kept on-screen.
  (function enableDrag() {
    let dragging = false, offX = 0, offY = 0;

    function start(x, y) {
      dragging = true;
      const rect = miniPlayer.getBoundingClientRect();
      offX = x - rect.left;
      offY = y - rect.top;
      miniPlayer.style.left = rect.left + "px";
      miniPlayer.style.bottom = "auto";
      miniPlayer.style.top = rect.top + "px";
    }
    function move(x, y) {
      if (!dragging) return;
      const maxX = window.innerWidth - miniPlayer.offsetWidth - 6;
      const maxY = window.innerHeight - miniPlayer.offsetHeight - 6;
      const nx = Math.min(Math.max(6, x - offX), Math.max(6, maxX));
      const ny = Math.min(Math.max(6, y - offY), Math.max(6, maxY));
      miniPlayer.style.left = nx + "px";
      miniPlayer.style.top = ny + "px";
    }
    function end() { dragging = false; }

    miniDrag.addEventListener("mousedown", (e) => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", end);

    miniDrag.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("touchend", end);
  })();

  // Restore overlay visibility preference.
  try {
    if (localStorage.getItem("folkdj_mini") === "1") showMiniPlayer();
  } catch (e) {}

  // Optional: "always-on-top" pop-out window via the Document Picture-in-Picture API
  // (supported on Chromium desktop/Android; hidden automatically where unavailable).
  if ("documentPictureInPicture" in window) {
    pipBtn.hidden = false;
    pipBtn.addEventListener("click", async () => {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 300,
          height: 110,
        });
        pipWindow.document.head.innerHTML =
          '<style>' +
          'body{margin:0;font-family:sans-serif;background:#1c1630;color:#f5f3ff;display:flex;align-items:center;gap:10px;padding:12px;height:100%;box-sizing:border-box;}' +
          '.t{flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
          'button{border:none;background:#7c5cff;color:#fff;border-radius:50%;width:36px;height:36px;font-size:15px;cursor:pointer;flex-shrink:0;}' +
          '</style>';
        const wrap = pipWindow.document.createElement("div");
        wrap.style.cssText = "display:flex;align-items:center;gap:10px;width:100%;";
        const t = pipWindow.document.createElement("div");
        t.className = "t";
        t.textContent = PLAYLIST[currentIndex()].title;
        const playPip = pipWindow.document.createElement("button");
        playPip.textContent = audio.paused ? "▶" : "⏸";
        playPip.addEventListener("click", () => {
          if (audio.paused) audio.play(); else audio.pause();
        });
        const stopPip = pipWindow.document.createElement("button");
        stopPip.textContent = "⏹";
        stopPip.addEventListener("click", stopPlayback);
        wrap.appendChild(t);
        wrap.appendChild(playPip);
        wrap.appendChild(stopPip);
        pipWindow.document.body.appendChild(wrap);

        const syncPip = () => {
          playPip.textContent = audio.paused ? "▶" : "⏸";
          t.textContent = PLAYLIST[currentIndex()].title;
        };
        audio.addEventListener("play", syncPip);
        audio.addEventListener("pause", syncPip);
        pipWindow.addEventListener("pagehide", () => {
          audio.removeEventListener("play", syncPip);
          audio.removeEventListener("pause", syncPip);
        });
      } catch (e) {
        statusEl.textContent = "Pop-out window isn't available in this browser.";
      }
    });
  }

  // Install-as-app prompt: standalone/installed apps get the most reliable
  // background and screen-off playback on mobile.
  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener("appinstalled", () => { installBtn.hidden = true; });

  // Register service worker so the app shell + played songs are cached and
  // playback keeps working reliably across app switches and reloads.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
    if (e.code === "ArrowRight") nextBtn.click();
    if (e.code === "ArrowLeft") prevBtn.click();
  });

  // Restore preferences
  try {
    const savedVol = localStorage.getItem("folkdj_vol");
    if (savedVol !== null) {
      volume.value = savedVol;
      audio.volume = Number(savedVol);
    }
    const savedLast = localStorage.getItem("folkdj_last");
    if (savedLast !== null) {
      const idx = Number(savedLast);
      if (idx >= 0 && idx < PLAYLIST.length) {
        buildOrder();
        pos = order.indexOf(idx);
      }
    } else {
      buildOrder();
    }
  } catch (e) {
    buildOrder();
  }

  loadTrack(false);
  updatePlayState();
})();
