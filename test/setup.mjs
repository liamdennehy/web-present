/**
 * test/setup.mjs — Common test utilities.
 *
 * Provides:
 *  - loadFixture(name)  — reads a .md file from test/fixtures/
 *  - assert(condition, msg) — throws on failure, logs ✓/✗
 *  - mockMarked()       — installs a minimal marked.parse mock on globalThis
 *  - parseMarkdown        — re-export of the real parser
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

/**
 * Read a fixture file and return its text content.
 */
export function loadFixture(name) {
  return readFileSync(join(FIXTURES, name), 'utf8');
}

/**
 * Minimal marked.js mock — covers the Markdown constructs used in our tests.
 * Installs itself as globalThis.marked so parser.js can call marked.parse().
 */
export function mockMarked() {
  globalThis.marked = {
    parse(md) {
      return md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\\)\*(.+?)(?<!\\)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/!\[([^\]]*)\]\(([^ )]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1">')
        .replace(/^\|(.+)\|$/gm, (m) => {
          const cells = m.split('|').filter(c => c.trim());
          return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
        })
        .replace(/^\|? ?[-:]+[\-:]* ?\|?$/gm, '')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/^<li>(.+)<\/li>\n?/gm, (m, inner) => `<li>${inner}</li>\n`)
    },
  };
}

/**
 * Counter and assertion helper.
 * Call `runTests()` at the end of your test file to print results.
 */
export const testState = { passed: 0, failed: 0, total: 0 };

export function assert(condition, msg) {
  testState.total++;
  if (condition) {
    testState.passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    testState.failed++;
    console.error(`  ✗ ${msg}`);
  }
}

export function runTests() {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${testState.passed} passed, ${testState.failed} failed, ${testState.total} total`);
  if (testState.failed > 0) process.exit(1);
}
