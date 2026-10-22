/**
 * test/test-parse.mjs — Tests slide parsing: splitting, titles, content.
 * Run: node test/test-parse.mjs
 */

import { loadFixture, mockMarked, assert, runTests } from './setup.mjs';

mockMarked();
import { parseMarkdown } from '../client/js/parser.js';

console.log('\n── Test: Basic slide splitting ──');
const basic = loadFixture('basic.md');
const result = parseMarkdown(basic);

assert(result.title === 'My Presentation', 'Presentation title extracted');
assert(result.slides.length === 3, `3 slides parsed (got ${result.slides.length})`);
assert(result.slides[0].title === '', 'Slide 0 has no heading (intro)');
assert(result.slides[1].title === 'Slide One', 'Slide 1 title correct');
assert(result.slides[2].title === 'Slide Two', 'Slide 2 title correct');
assert(result.slides[1].content.includes('Content for the first slide'), 'Slide 1 has content');
assert(result.slides[2].content.includes('Content for the second slide'), 'Slide 2 has content');

// Single-slide document (no ##)
console.log('\n── Test: Single slide (no ##) ──');
const single = '# Title\n\nOnly slide content.';
const singleResult = parseMarkdown(single);
assert(singleResult.slides.length === 1, 'Single slide parsed');
assert(singleResult.slides[0].title === '', 'Intro slide has no heading when no ##');
assert(singleResult.slides[0].content.includes('Only slide content'), `Content preserved in intro slide (got: ${JSON.stringify(singleResult.slides[0].content)})`);

// Multiple ## with no intro
console.log('\n── Test: Slides only, no intro ──');
const slidesOnly = `# Presentation

## First

Content A.

## Second

Content B.`;
const slidesOnlyResult = parseMarkdown(slidesOnly);
assert(slidesOnlyResult.slides.length === 2, '2 slides, no intro');
assert(slidesOnlyResult.slides[0].title === 'First', 'First slide title');
assert(slidesOnlyResult.slides[1].title === 'Second', 'Second slide title');

runTests();
