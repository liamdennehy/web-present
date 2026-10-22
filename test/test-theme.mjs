/**
 * test/test-theme.mjs — Tests YAML front-matter parsing and theme extraction.
 * Run: node test/test-theme.mjs
 */

import { loadFixture, mockMarked, assert, runTests } from './setup.mjs';

mockMarked();
import { parseMarkdown } from '../client/js/parser.js';

console.log('\n── Test: Global presentation theme ──');
const themed = loadFixture('themed.md');
const result = parseMarkdown(themed);

assert(result.theme !== null, 'Global theme object exists');
assert(result.theme.background === '#1a1a2e', 'Background color parsed');
assert(result.theme.color === '#eaeaea', 'Color parsed');
assert(result.theme.accent === '#e94560', 'Accent color parsed');

console.log('\n── Test: Per-slide theme overrides ──');
const perSlide = loadFixture('perslide.md');
const perSlideResult = parseMarkdown(perSlide);

const normalSlide = perSlideResult.slides.find(s => s.title === 'Normal Slide');
assert(normalSlide !== undefined, 'Normal slide found');
assert(normalSlide.theme === null, 'Normal slide has no explicit theme (inherits via CSS cascade)');

const darkSlide = perSlideResult.slides.find(s => s.title === 'Dark Slide');
assert(darkSlide !== undefined, 'Dark slide found');
assert(darkSlide.theme !== null, 'Dark slide has theme override');
assert(darkSlide.theme.background === '#000000', 'Dark slide background is black');
assert(darkSlide.theme.color === '#ffffff', 'Dark slide color is white');

console.log('\n── Test: No front-matter ──');
const noTheme = '# Title\n\n## Slide\n\nText.';
const noThemeResult = parseMarkdown(noTheme);
assert(noThemeResult.theme === null, 'No global theme when absent');
assert(noThemeResult.slides[0].theme === null, 'No per-slide theme when absent');

runTests();
