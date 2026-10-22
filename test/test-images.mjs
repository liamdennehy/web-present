/**
 * test/test-images.mjs — Tests image detection in slide content.
 * Run: node test/test-images.mjs
 */

import { loadFixture, mockMarked, assert, runTests } from './setup.mjs';

mockMarked();
import { parseMarkdown } from '../client/js/parser.js';

console.log('\n── Test: Image detection ──');
const withImages = loadFixture('images.md');
const result = parseMarkdown(withImages);

const imgSlide = result.slides[0]; // "With Images"
assert(imgSlide !== undefined, 'Image slide found');
assert(imgSlide.images.length === 2, `2 images found (got ${imgSlide.images.length})`);
assert(imgSlide.images[0].src === 'assets/logo.png', 'First image src correct');
assert(imgSlide.images[1].src === 'assets/diagram.jpg', 'Second image src correct');

console.log('\n── Test: No images ──');
const noImages = '# Title\n\n## Plain\n\nJust text.';
const plainResult = parseMarkdown(noImages);
const plainSlide = plainResult.slides[0];
assert(plainSlide.images.length === 0, 'No images on plain slide');

console.log('\n── Test: Inline image syntax preserved ──');
const inline = `# Title

## Inline

![Alt text](path/to/image.png) is inline.`;

const inlineResult = parseMarkdown(inline);
const inlineSlide = inlineResult.slides[0];
assert(inlineSlide.images.length === 1, 'Inline image detected');
assert(inlineSlide.images[0].alt === 'Alt text', 'Alt text captured');
assert(inlineSlide.images[0].src === 'path/to/image.png', 'Src captured');

runTests();
