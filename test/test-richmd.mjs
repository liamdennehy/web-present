/**
 * test/test-richmd.mjs — Tests that rich Markdown features are preserved
 * through the parsing pipeline.
 * Run: node test/test-richmd.mjs
 */

import { loadFixture, mockMarked, assert, runTests } from './setup.mjs';

mockMarked();
import { parseMarkdown } from '../client/js/parser.js';

console.log('\n── Test: Rich Markdown content ──');
const rich = loadFixture('richmd.md');
const result = parseMarkdown(rich);

assert(result.slides.length === 1, '1 slide (no intro, just Features)');

const features = result.slides[0];
assert(features.title === 'Features', 'Slide title correct');
assert(features.content.includes('Bullet one'), 'Bulleted list preserved');
assert(features.content.includes('Bullet two'), 'Bulleted list preserved');
assert(features.content.includes('Bullet three'), 'Bulleted list preserved');
assert(features.content.includes('Numbered one'), 'Numbered list preserved');
assert(features.content.includes('Col A'), 'Table preserved');
assert(features.content.includes('blockquote'), 'Blockquote preserved');
assert(features.content.includes('Bold'), 'Bold preserved');
assert(features.content.includes('italic'), 'Italic preserved');
assert(features.content.includes('code'), 'Inline code preserved');

// Verify HTML tags are present (the mock marked.parse produces them)
assert(features.html.includes('<li>'), 'HTML contains list items');
assert(features.html.includes('<blockquote>'), 'HTML contains blockquote');

runTests();
