# Folk DJ Player 🎧

A simple, mobile-friendly music player for a folk song playlist. Pure HTML/CSS/JS — no build step, no dependencies.

## Features
- Play / pause, stop, next / previous, shuffle, repeat (all / one)
- Seek bar + volume control
- Tap any track in the playlist to jump to it
- Auto-plays the next song when one ends, and auto-skips a track if it fails to load
- Lock-screen / notification-shade media controls (play, pause, stop, next, previous, seek) via the Media Session API — works with the screen off and while switching apps, as long as the tab/app stays open
- Installable as a Progressive Web App ("Install App" button, or your browser's "Add to Home Screen") — installed apps get the most reliable background and screen-off playback on mobile, plus offline playback of already-loaded songs via a service worker
- Small draggable floating mini-player overlay ("Overlay" button) with play/pause and stop, stays on top of the page while you browse
- Optional always-on-top pop-out window ("Pop-out" button) using the Document Picture-in-Picture API on supporting Chromium browsers
- Responsive layout designed for phone screens

### About background playback
Browsers (not this app) control whether audio keeps playing when you switch away or lock the screen. With this player, playback continues in the background and with the screen off as long as the browser tab (or the installed app) stays open — installing it as an app via "Install App" gives the most reliable result. No web page can keep audio playing after the browser/app itself is fully closed or force-killed; that limitation is the same for every website-based player.

## Run locally
Open `site/index.html` in a browser, or serve the `site/` folder with any static server:

```
cd site
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Live hosting (GitHub Pages)
This repo is set up to publish the `site/` folder via GitHub Pages using the included Actions workflow (`.github/workflows/pages.yml`). Once enabled in the repo's Settings → Pages (source: GitHub Actions), the player is available at:

```
https://<username>.github.io/<repo>/
```

## Project structure
```
site/
  index.html    player markup
  style.css     player styles
  app.js        player logic
  songs.js      playlist manifest (titles + file paths)
  songs/        mp3 files
  manifest.json PWA install manifest
  sw.js         service worker (offline caching)
  icons/        app icons
```
