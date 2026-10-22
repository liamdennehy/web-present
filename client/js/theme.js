/**
 * theme.js — YAML front-matter parsing + theme application
 *
 * Manages CSS custom properties for the global theme and per-slide overrides.
 */

const DEFAULT_THEME = {
  background: '#ffffff',
  color: '#222222',
  'font-heading': '"Merriweather", Georgia, serif',
  'font-body': '"Inter", system-ui, -apple-system, sans-serif',
  accent: '#2563eb',
  layout: 'wide',
};

const THEME_CSS_PROPS = [
  'background',
  'color',
  'font-heading',
  'font-body',
  'accent',
];

/**
 * Apply the global presentation theme to :root.
 * @param {Object|null} theme - Theme object from front-matter (or null for defaults)
 */
export function applyGlobalTheme(theme) {
  const root = document.documentElement;
  const t = theme || DEFAULT_THEME;

  for (const prop of THEME_CSS_PROPS) {
    const value = t[prop] || DEFAULT_THEME[prop];
    root.style.setProperty(`--${prop}`, value);
  }

  // Layout mode affects padding
  if (t.layout === 'narrow') {
    root.style.setProperty('--slide-padding', '2rem');
  } else if (t.layout === 'fullscreen') {
    root.style.setProperty('--slide-padding', '1rem');
  } else {
    root.style.setProperty('--slide-padding', '4rem');
  }
}

/**
 * Apply a per-slide theme override to a slide DOM element.
 * @param {HTMLElement} slideEl - The slide element
 * @param {Object} theme - Theme object from the slide's front-matter
 */
export function applySlideTheme(slideEl, theme) {
  if (!theme) return;

  for (const prop of THEME_CSS_PROPS) {
    if (theme[prop] !== undefined) {
      slideEl.style.setProperty(`--${prop}`, theme[prop]);
    }
  }

  // Layout mode
  if (theme.layout) {
    let padding = '4rem';
    if (theme.layout === 'narrow') padding = '2rem';
    else if (theme.layout === 'fullscreen') padding = '1rem';
    slideEl.style.setProperty('--slide-padding', padding);
  }
}

/**
 * Reset a slide element's theme to inherit from :root.
 * @param {HTMLElement} slideEl
 */
export function resetSlideTheme(slideEl) {
  slideEl.style.cssText = '';
}
