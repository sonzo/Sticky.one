# Sticky One

A lightweight, offline-first task manager that runs entirely in the browser — no server, no build step, no dependencies beyond [Pico CSS](https://picocss.com/) and Material Icons.

## Features

- Organize tasks into collapsible groups
- Track time per task with a built-in timer
- Attach a URL and description to each task
- Dark / light mode follows your OS preference
- All data persists locally via `localStorage`

## Usage

Open `index.html` directly in any modern browser — no installation required.

## Project Structure

```
index.html          Entry point
css/
  pico.min.css      Pico CSS framework
  style.css         App styles
js/
  storage.js        localStorage read/write
  timer.js          Timer interval management
  ui.js             DOM rendering
  app.js            State, event handling, init
fonts/
  MaterialIcons-Regular-20260501.woff2   Locally hosted icon font
```

## License

MIT — see [LICENSE](LICENSE).
