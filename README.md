# ARMOR-HAL project page

Project website for **ARMOR-HAL: Unified Defense for Adversarial Robustness and Hallucination Mitigation in Large Vision-Language Models**, an NSF NAIRR Pilot project (SPEED Lab, Florida Atlantic University).

A static page with no build step, so GitHub Pages can serve it directly.

```
index.html             all content
assets/css/style.css   design tokens at the top
assets/js/main.js      interactive demos, charts, timeline (data lives here)
assets/img/            NAIRR and SPEED Lab logos
assets/teasers/        HALS and Trajectory-Lens teaser videos + poster frames
```

## Editing

- **Chart data**: `HALS`, `TLM`/`OURS` and `COMPUTE` objects in `assets/js/main.js`.
- **Timeline phases**: `PHASES` in `assets/js/main.js`.
- After changing CSS or JS, bump the `?v=` numbers on main.js and style.css on their links in `index.html`.

## Preview locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
