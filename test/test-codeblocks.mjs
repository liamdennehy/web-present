/**
 * test/test-codeblocks.mjs — Tests that fenced code blocks don't
 * confuse the slide-splitting logic.
 * Run: node test/test-codeblocks.mjs
 */

import { loadFixture, mockMarked, assert, runTests } from './setup.mjs';

mockMarked();
import { parseMarkdown } from '../client/js/parser.js';

console.log('\n── Test: Code blocks isolated from slide splitting ──');
const codeBlocks = loadFixture('codeblocks.md');
const result = parseMarkdown(codeBlocks);

assert(result.slides.length === 2, `2 slides (no intro, 2 real), got ${result.slides.length}`);

// The slide containing the code block should preserve it
const codeSlide = result.slides[0];
assert(codeSlide !== undefined, 'Real Slide found');
assert(codeSlide.content.includes('## Not a slide'), 'Code block content preserved (restored from placeholder)');
assert(codeSlide.content.includes('## Not a slide'), 'Code block content intact');

// "Not a slide" should NOT appear as a slide title
const fakeSlide = result.slides.find(s => s.title === 'Not a slide');
assert(fakeSlide === undefined, '"Not a slide" not parsed as a real slide');

const secondSlide = result.slides.find(s => s.title === 'Second Slide');
assert(secondSlide !== undefined, 'Second Slide found after code block');
assert(secondSlide.content.includes('After the code block'), 'Content after code block present');

console.log('\n── Test: Multiple code blocks ──');
const multi = `# Title

## Slide A

\`\`\`
## Not A
\`\`\`

Text.

## Slide B

\`\`\`
## Not B
\`\`\`

More text.`;

const multiResult = parseMarkdown(multi);
assert(multiResult.slides.length === 2, `2 slides (no intro, 2 real)`);
assert(multiResult.slides[0].content.includes('Not A'), 'First code block preserved');
assert(multiResult.slides[1].content.includes('Not B'), 'Second code block preserved');



runTests();
