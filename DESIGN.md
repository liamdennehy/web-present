# Web Slideshow — Design Brief

## Overview

A client-side web slideshow engine that renders presentations written in
Markdown. Presentations are plain `.md` files, making them trivially
version-controllable with git. No build step, no server required — just open
an HTML file in a browser.

## Core Concepts

### Document Structure

| Markdown syntax | Role                         |
| --------------- | ---------------------------- |
| `# Title`       | **Presentation** (title slide) |
| `## Heading`    | **Slide** start               |
| `### Heading`   | Section heading _within_ a slide |
| `#### Heading`  | Sub-section within a slide    |

- The first `#` in the document defines the presentation title.
- Every `##` begins a new slide.
- Content between two `##` markers belongs to the current slide.
- `###`, `####`, etc. are regular slide headings.

### Navigation

| Key            | Action                      |
| -------------- | --------------------------- |
| `Right Arrow`  | Next slide                  |
| `Space`        | Next slide                  |
| `Left Arrow`   | Previous slide              |
| `Home` / `g`   | Go to first slide           |
| `End` / `G`    | Go to last slide            |
| `f`            | Open a `.md` file picker    |
| `?`            | Show/hide keyboard shortcuts help overlay |

Progress is shown as a thin bar at the bottom of the screen.

## Slide Layout Engine

### Image-Aware Dynamic Layout

Each slide may contain zero or more `<img>` elements (standard Markdown image
syntax `![alt](path)`). The layout engine decides where to position each image
using a **density-based heuristic**:

1. **Measure text density** — count words, characters, and heading levels in
   the slide body text.
2. **Measure image footprint** — compute each image's pixel dimensions (or
   natural aspect ratio if dimensions aren't specified).
3. **Decide placement**:
   - **No images** → full-bleed text, centered.
   - **One dominant image** (> 50 % of slide area) → image takes the larger
     region (left or right depending on text density); text flows in the
   remaining space.
   - **Multiple images** → grid layout; images placed top-down, text interleaved.
   - **Small images / icons** → inline within the text at their document
     position.

**Text-density heuristic**: When text is sparse (short bullet lists, few
words), the image is placed on the **left** with text to its right. When text
is dense (long paragraphs, multiple sections), the image is placed on the **right**
so the text can flow more naturally below headings. This is a simple rule but
works well for most presentations.

```
Sparse text →  ┌──────┬─────────┐
               │ Image │ Text   │
               └──────┴─────────┘

Dense text  →  ┌──────────┬──────┐
               │ Text     │ Image│
               └──────────┴──────┘
```

### Slide CSS Grid Strategy

Each slide is rendered inside a CSS Grid container:

```css
.slide {
  display: grid;
  height: 100vh;
  width: 100vw;
  padding: 4rem;
  gap: 2rem;
  /* columns are assigned dynamically by JS */
  grid-template-columns: var(--text-col) var(--img-col);
  grid-template-areas: var(--grid-areas);
}
```

JavaScript sets CSS custom properties based on the layout heuristic, keeping
the layout fully data-driven and re-computable.

## Theming (Optional Markdown Metadata)

A YAML front-matter block at the top of the `.md` file can specify theme
preferences:

```yaml
---
theme:
  background: "#1a1a2e"
  color: "#eaeaea"
  font-heading: "Georgia, serif"
  font-body: "Inter, system-ui, sans-serif"
  accent: "#e94560"
  layout: "wide"        # "wide" | "narrow" | "fullscreen"
---
```

Defaults (when no front-matter is present):

| Property       | Default                        |
| -------------- | ------------------------------ |
| background     | `#ffffff`                      |
| color          | `#222222`                      |
| font-heading   | `"Merriweather", serif`        |
| font-body      | `"Inter", system-ui, sans-serif` |
| accent         | `#2563eb`                      |
| layout         | `wide`                         |

Themes cascade — a presentation-level theme can be overridden per-slide by
adding front-matter on that slide:

```markdown
---
theme:
  background: "#0f3460"
  color: "#f0f0f0"
---

## Dark Slide Example
```

## Rendering Pipeline

```
.md file
  │
  ├─► YAML front-matter parser  → extract theme config
  │
  ├─► Markdown parser           → HTML
  │   (marked.js or similar)
  │
  ├─► AST walk                  → identify slides, images, headings
  │
  ├─► Layout planner            → compute CSS grid properties per slide
  │
  └─► Render                    → inject HTML into DOM, apply theme vars
```

### Library Choices

| Concern          | Option            | Notes                          |
| ---------------- | ----------------- | ------------------------------ |
| Markdown parser  | `marked`          | Fast, mature, ES-module friendly |
| YAML front-matter | Custom regex or `js-yaml` | Front-matter is optional and simple |
| Styling          | CSS custom props  | Zero runtime CSS-in-JS         |
| Images           | Native `<img>`    | Lazy-loaded via IntersectionObserver |

No framework required. Pure HTML + CSS + vanilla JS.

## File Layout

```
web-present/
├── index.html          # Single-page app shell
├── css/
│   └── style.css       # Base styles, slide layout, theming
├── js/
│   ├── app.js          # Main entry, event listeners, navigation
│   ├── parser.js       # Markdown → slides + layout data
│   └── theme.js        # Front-matter parsing + theme application
├── slides/             # User's .md presentation files
│   └── example.md
├── assets/             # Images referenced by slides
│   └── logo.png
└── DESIGN.md           # This file
```

## Implementation Tasks

### Phase 1 — Core Engine
1. Parse Markdown into slides (split on `##`, extract `#` title).
2. Render a single slide's content as HTML.
3. Implement keyboard navigation (right/left/space).
4. Show a slide counter and progress bar.

### Phase 2 — Image Layout
5. Detect images in slide content.
6. Implement the density-based heuristic (sparse → image-left, dense → image-right).
7. Apply CSS Grid dynamically per slide.
8. Support inline small images.

### Phase 3 — Theming
9. Parse YAML front-matter (simple regex-based extractor).
10. Map front-matter to CSS custom properties.
11. Support per-slide theme overrides.
12. Apply sensible defaults when no front-matter is present.

### Phase 4 — Polish
13. Add file picker (`f` key) to load local `.md` files.
14. Add help overlay (`?` key).
15. Smooth transition animation between slides.
16. Responsive adjustments for smaller screens.
17. Print-friendly styles.

## Future / Stretch Goals

- **Export to PDF** via browser print dialog with custom `@page` rules.
- **Speaker notes** — hidden per-slide notes (toggle with `S`).
- **Slide transitions** — fade, slide, zoom options.
- **Live editing** — split-pane editor with live preview.
- **Remote control** — second device navigates via WebSocket.
- **Multiple image zones** — more sophisticated masonry layout.
- **Code syntax highlighting** — integrate `highlight.js`.
