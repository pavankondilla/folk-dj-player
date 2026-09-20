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
    art.classList.toggle("spinning", playing);
    renderPlaylist();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
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
      navigator.mediaSession.setActionHandler("nexttrack", playNext);
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
