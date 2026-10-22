# Web Slideshow

A git-friendly, markdown-powered presentation engine. Write your slides in plain Markdown, open in any browser, navigate with keyboard shortcuts. No build step, no server required, no frameworks.

## Features

- **Markdown-driven** — write presentations in `.md` files; each `##` heading is a new slide
- **Dynamic image layout** — images auto-position based on text density (sparse → left, dense → right)
- **YAML front-matter theming** — customise colors, fonts, and layout per-presentation or per-slide
- **Keyboard navigation** — arrows, space, home/end, plus touch swipe on mobile
- **File picker** — press `f` to load any local `.md` presentation
- **Help overlay** — press `?` to see all shortcuts
- **Smooth transitions** — fade animations between slides
- **Responsive** — adapts to mobile screens
- **Print-friendly** — `Ctrl+P` prints all slides, one per page
- **Version controllable** — plain text diffs tracked in git

## Quick Start

1. Open `client/index.html` in a browser (requires a local HTTP server for ES modules)
2. The demo presentation loads automatically
3. Press `f` to load your own `.md` file
4. Navigate with arrow keys or space

### Start a local server

```bash
python3 -m http.server 8080
# then open http://localhost:8080/client/index.html
```

## Slide Structure

| Markdown | Role |
|----------|------|
| `# Title` | Presentation title slide |
| `## Heading` | New slide |
| `### Subheading` | Section within a slide |
| `#### Sub-sub` | Sub-section within a slide |

Content between two `##` markers belongs to the current slide.

### Theming

Add a YAML front-matter block at the top of your `.md` file:

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

Theme can also be set per-slide by placing front-matter between the `##` heading and the slide content.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `Home` / `g` | First slide |
| `End` / `G` | Last slide |
| `f` | Load a `.md` file |
| `?` | Show/hide help |
| `Esc` | Dismiss overlay |

Click the left/right edges of a slide to navigate as an alternative.

## Supported Markdown

Full CommonMark via [marked.js](https://github.com/markedjs/marked):

- Bold, italic, strikethrough
- Code blocks and inline code
- Bullet and numbered lists
- Tables
- Blockquotes
- Links and images

## File Structure

```
web-present/
├── client/                # Everything served to the browser
│   ├── index.html         # Single-page app shell
│   ├── css/style.css      # Styles — layout, typography, transitions
│   ├── js/
│   │   ├── app.js         # Navigation, rendering, events
│   │   ├── parser.js      # Markdown → slides + layout data
│   │   └── theme.js       # YAML front-matter + CSS custom properties
│   └── slides/
│       └── default.md     # Demo presentation
├── test/                  # Unit tests (54 tests, 0 failures)
│   ├── setup.mjs          # Shared test utilities
│   ├── test-parse.mjs     # Slide splitting & titles
│   ├── test-theme.mjs     # YAML front-matter & theming
│   ├── test-codeblocks.mjs
│   ├── test-images.mjs    # Image detection
│   ├── test-richmd.mjs    # Rich Markdown preservation
│   └── fixtures/          # Shared markdown test files
├── DESIGN.md              # Architecture design brief
└── AGENTS.md              # Developer/agent instructions
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Markup | HTML5 |
| Styling | CSS custom properties + CSS Grid |
| Scripting | Vanilla ES modules (no framework) |
| Markdown parsing | [marked.js](https://github.com/markedjs/marked) (CDN) |
| Testing | Node.js native ESM, no dependencies |

## Future / Stretch Goals

- Export to PDF via print dialog
- Speaker notes (toggle with `S`)
- Slide transition effects (fade, slide, zoom)
- Live split-pane editing
- Remote control via WebSocket
- Syntax highlighting for code blocks
