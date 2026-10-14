# Annika's Garden

A cozy princess garden game for iPhone. Plant crops in the castle garden,
harvest them, fill orders from friends around the kingdom, and level up to
unlock new seeds and more garden plots.

## Play

Open the GitHub Pages link in Safari on iPhone, tap the Share button, then
**Add to Home Screen**. Play from the home screen icon: it opens full screen,
works offline, and keeps progress saved on the phone.

## How it's built

Plain HTML, CSS and JavaScript with no build step, so any file can be edited
directly.

- `index.html` is the page layout.
- `game.js` holds the crops, prices, orders and all game logic. Crop
  balance lives in the `CROPS` list at the top.
- `princess.js` draws the princess and castle. The princess's colors come
  from a `look` object, ready for a future wardrobe.
- `style.css` holds the pastel styling.
- `sw.js` and `manifest.webmanifest` make it installable and playable offline.

Progress is saved in the browser's local storage under `annika-garden-v1`.

To try it on a computer, run `python3 -m http.server` in this folder and open
http://localhost:8000.
