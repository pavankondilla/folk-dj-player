# Folk DJ Player 🎧

A simple, mobile-friendly music player for a folk song playlist. Pure HTML/CSS/JS — no build step, no dependencies.

## Features
- Play / pause, next / previous, shuffle, repeat (all / one)
- Seek bar + volume control
- Tap any track in the playlist to jump to it
- Auto-plays the next song when one ends, and auto-skips a track if it fails to load
- Lock-screen / hardware media key support via the Media Session API
- Responsive layout designed for phone screens

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
  index.html   player markup
  style.css    player styles
  app.js       player logic
  songs.js     playlist manifest (titles + file paths)
  songs/       mp3 files
```
