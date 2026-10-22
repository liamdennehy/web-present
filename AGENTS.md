# AGENTS.md — Developer / Agent Instructions

This file contains operational guidance for working on this project. It is not user-facing.

## Project Layout

All client-facing code lives under `client/`. The project root holds docs, tests, and the `.git` directory.

```
web-present/
├── client/                # Served to browser — everything here is client code
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js          # Entry point — navigation, rendering, event handlers
│   ├── js/parser.js       # Markdown → structured slides (exported functions)
│   ├── js/theme.js        # Theme application (exported functions)
│   └── slides/            # User .md presentations
├── test/                  # Node.js unit tests (ES modules, no dependencies)
│   ├── setup.mjs          # Shared helpers: loadFixture, mockMarked, assert, runTests
│   ├── test-*.mjs         # One file per concern
│   └── fixtures/          # Shared .md test files
└── DESIGN.md              # Architecture decisions and design brief
```

## Running Tests

```bash
cd /usr/src/web-present
node test/test-parse.mjs        # individual test
node test/test-theme.mjs
# or all at once:
for f in test/test-*.mjs; do node "$f"; done
```

Tests use **Node.js native ESM** — no `package.json`, no `npm install`. The `marked` library is mocked in `test/setup.mjs` because it loads via CDN in the browser.

## Architecture Decisions

### Single-page, no build step

`index.html` is the entry point. `marked` loads from CDN. Client JS files are ES modules linked via `<script type="module">`. No bundler, no transpiler.

### All slides in DOM at once

`app.js` renders every slide into the DOM simultaneously, showing/hiding via CSS class toggling (`.active`). This supports direct navigation (home/end/jump) without re-parsing.

### Parser output contract

`parseMarkdown(raw)` returns:

```js
{
  title: string,              // presentation title from # heading
  theme: object | null,       // global YAML front-matter theme
  slides: [{
    title: string,            // slide title (empty string for intro slide)
    content: string,          // raw markdown content
    html: string,             // HTML from marked.parse()
    theme: object | null,     // per-slide YAML front-matter (null if inherited)
    images: [{ src, alt, classification }],
    textDensity: number,      // heuristic score for layout planning
    layout: object | null,    // grid layout plan (resolved after image dimensions)
  }]
}
```

### Parser quirks

1. **Code blocks** — fenced code blocks (```) are replaced with `%%CODEBLOCKn%%` placeholders before slide splitting to prevent `##` inside code from matching. They are restored after splitting via `restoreCodeBlocks()`.

2. **Front-matter anchoring** — `extractFrontMatter()` uses `^---` so it only matches front-matter at the **start** of the string. Per-slide front-matter must appear at the top of a slide's content (after the `##` heading), not between slides.

3. **Intro slides** — A slide with `title === ''` is an intro slide (content between `# Title` and first `##`). Its title is intentionally empty; the presentation title is in `result.title`.

4. **Empty body before first `##`** — If there is no intro content (e.g., `# Title\n\n## Slide` directly), `i` starts at 1 after the title strip, correctly skipping the whitespace.

5. **`splitSlides` return value** — Returns `{ slides, presentationTitle }`, not just `slides`.

6. **Image detection** — Looks for `<img>` tags in the HTML output from `marked.parse()`. The mock in tests must convert `![alt](src)` to `<img>` tags.

### CSS architecture

- Design tokens via CSS custom properties on `:root` (background, color, font-heading, font-body, accent, slide-padding).
- Per-slide overrides set properties on the `.slide` element, which cascade down.
- Layout uses CSS Grid with properties set dynamically by JS: `--text-col`, `--grid-areas`.
- Transition is a CSS animation (`fadeIn`/`fadeOut`) toggled by class.

## Code Style

- **ES modules** — use `export` / `import`, never `require` or `<script>` tags for app code.
- **No framework** — vanilla JS only. DOM manipulation via `querySelector`, `createElement`, `classList`.
- **CSS custom properties** — prefer `var(--name)` over hard-coded values.
- **Functions over classes** — all logic is in plain functions, no classes.
- **Single responsibility** — each file has one concern: `parser.js` = parsing, `theme.js` = theming, `app.js` = rendering + events.
- **No magic strings** — extract repeated values into constants or CSS variables.
- **Defensive parsing** — always handle null/undefined gracefully in parser output.

## Adding a New Test

1. Create a fixture in `test/fixtures/` if the test needs specific markdown content.
2. Create `test/test-<name>.mjs` importing from `./setup.mjs`.
3. Call `mockMarked()` before importing `parser.js`.
4. Use `assert(condition, msg)` and `runTests()` at the end.

## Common Pitfalls

- **CORS on file://** — ES modules require HTTP. Always use a local server (`python3 -m http.server 8080`).
- **`marked` global** — `parser.js` calls `marked.parse()` expecting `marked` as a global (from the CDN `<script>` tag). In tests, install the mock via `mockMarked()` before importing `parser.js`.
- **`restoreCodeBlocks` uses `/g`** — the regex must be global to replace all placeholders per slide.
- **Theme inheritance** — the parser does NOT merge themes. A slide with `theme: null` inherits from `:root` via CSS cascade. The `app.js` `applySlideTheme()` function applies per-slide overrides directly to the element.
