/**
 * parser.js — Markdown → slides + layout data
 *
 * Parses a raw Markdown string into an array of slide objects.
 * Each slide contains: title, html, theme, images, layout, textDensity.
 */

// ── YAML front-matter regex ───────────────────────────
const FRONT_MATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

/**
 * Simple YAML sub-set parser for the theme block we expect:
 *   theme:
 *     background: "#1a1a2e"
 *     color: "#eaeaea"
 * Returns a plain object or null.
 */
function parseYamlFrontMatter(text) {
  const m = text.trim().match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;

  const lines = m[1].split('\n');
  const result = {};
  let currentKey = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Detect indentation level
    const indent = line.match(/^(\s*)/)[1].length;
    const kv = trimmed.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;

    if (indent === 0) {
      // Top-level key
      currentKey = kv[1];
      const val = kv[2].trim();
      result[currentKey] = val ? parseYamlValue(val) : {};
    } else if (currentKey) {
      // Nested key under current top-level
      const key = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      result[currentKey] = result[currentKey] || {};
      result[currentKey][key] = val;
    }
  }

  return result;
}

function parseYamlValue(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  return val.replace(/^["']|["']$/g, '');
}

/**
 * Extract front-matter from raw text.
 * Returns { meta: object, body: string }
 */
function extractFrontMatter(raw) {
  const m = raw.match(FRONT_MATTER_RE);
  if (!m) return { meta: null, body: raw };

  const meta = parseYamlFrontMatter(raw);
  const body = m[2];
  return { meta, body };
}

/**
 * Split body text into slides on ## headings.
 * Returns array of { title, content (raw markdown), theme }.
 */
function restoreCodeBlocks(text, codeBlocks) {
  return text.replace(/%%CODEBLOCK(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx, 10)] || '');
}

function splitSlides(body) {
  // Extract the leading # presentation title (first line starting with single #)
  let presentationTitle = '';
  const titleMatch = body.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    presentationTitle = titleMatch[1].trim();
    body = body.replace(/^#\s+(.+)$/m, '');
  }

  // Replace fenced code blocks with placeholder to avoid false ## matches
  const codeBlocks = [];
  body = body.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `%%CODEBLOCK${codeBlocks.length}%%`;
    codeBlocks.push(match);
    return placeholder;
  });

  // Match ## at start of line but not ###
  const slideRegex = /^(?=## )(?!###)(#.*)$/gm;
  const parts = body.split(slideRegex);

  const slides = [];
  let i = 0;

  // parts[0] = content before first ##
  // parts[1] = heading text (## ...)
  // parts[2] = content under that heading
  // parts[3] = next heading, etc.

  if (parts[0].trim() && !parts[0].trim().startsWith('#')) {
    slides.push({
      title: '',
      content: restoreCodeBlocks(parts[0].trim(), codeBlocks),
      theme: null,
    });
    i = 1;
  } else if (!parts[0].trim()) {
    // No intro content — whitespace-only before first ##, skip to first heading
    i = 1;
  }

  while (i < parts.length) {
    const heading = parts[i].replace(/^#+\s*/, '').trim();
    const content = (parts[i + 1] || '').trim();

    // Check for front-matter within the slide
    let theme = null;
    let cleanContent = content;
    const fm = extractFrontMatter(content);
    if (fm.meta && fm.meta.theme) {
      theme = fm.meta.theme;
      cleanContent = fm.body;
    }

    slides.push({
      title: heading,
      content: restoreCodeBlocks(cleanContent, codeBlocks),
      theme,
    });

    i += 2;
  }

  return { slides, presentationTitle };
}

/**
 * Classify image by size relative to slide viewport.
 */
function classifyImage(naturalWidth, naturalHeight) {
  // Assume viewport is roughly 1200x800
  const viewportArea = 1200 * 800;
  const imageArea = naturalWidth * naturalHeight;
  const ratio = imageArea / viewportArea;

  if (ratio > 0.3) return 'dominant';
  if (ratio > 0.02) return 'medium';
  return 'small';
}

/**
 * Measure text density of a slide's raw markdown content.
 * Returns a numeric score — higher = more text.
 */
function measureTextDensity(markdown) {
  const text = markdown
    .replace(/![^[]*\([^)]*\)/g, '')  // strip images
    .replace(/#{1,6}\s/g, '')           // strip heading markers
    .replace(/\n{2,}/g, '\n')           // normalize newlines
    .trim();

  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const hasList = /[*-]\s/.test(markdown);
  const hasTable = /\|.*\|/.test(markdown);
  const hasCode = /```/.test(markdown);

  // Heuristic: words + bonus for structural elements
  return words + (hasList ? 3 : 0) + (hasTable ? 5 : 0) + (hasCode ? 4 : 0);
}

/**
 * Decide layout based on images and text density.
 * Returns { textCol, imgArea, contentArea, gridAreas }
 */
function planLayout(images, textDensity) {
  // Thresholds for text density
  const DENSE_THRESHOLD = 80;
  const hasImages = images.length > 0;

  if (!hasImages) {
    return {
      textCol: '1fr',
      imgArea: null,
      contentArea: 'content',
      gridAreas: '"content"',
      layout: 'full',
    };
  }

  // Separate images by classification
  const dominantImages = images.filter(img => img.classification === 'dominant');
  const mediumImages = images.filter(img => img.classification === 'medium');
  const smallImages = images.filter(img => img.classification === 'small');

  // Small images stay inline — don't affect grid
  const layoutImages = [...dominantImages, ...mediumImages];

  if (layoutImages.length === 0) {
    return {
      textCol: '1fr',
      imgArea: null,
      contentArea: 'content',
      gridAreas: '"content"',
      layout: 'full',
    };
  }

  // One dominant image
  if (layoutImages.length === 1) {
    const img = layoutImages[0];
    const imgOnLeft = textDensity < DENSE_THRESHOLD;

    return {
      textCol: imgOnLeft ? '1fr 3fr' : '3fr 1fr',
      imgArea: imgOnLeft ? 'image' : 'image',
      contentArea: imgOnLeft ? 'text' : 'text',
      gridAreas: imgOnLeft ? '"image text"' : '"text image"',
      layout: 'two-col',
      imageSlots: [{ index: 0, area: imgOnLeft ? 'image' : 'image' }],
      imageOrder: ['image'],
    };
  }

  // Multiple images — left/right alternating
  const numSlots = layoutImages.length;
  const slots = [];
  for (let i = 0; i < numSlots; i++) {
    slots.push({
      imageIndex: i,
      position: i % 2 === 0 ? 'left' : 'right',
    });
  }

  // Build grid areas for alternating layout
  let gridAreasStr = '';
  for (let i = 0; i < numSlots; i++) {
    const leftArea = i % 2 === 0 ? `left-${i}` : 'text';
    const rightArea = i % 2 === 0 ? 'text' : `left-${i}`;
    gridAreasStr += `"${leftArea} ${rightArea}" `;
  }

  // Text gets its own row if there are multiple images
  if (numSlots > 1 && textDensity >= DENSE_THRESHOLD) {
    gridAreasStr += '"text text"';
  }

  // Build column definitions
  // Alternating: odd rows have img | text, even rows have text | img
  const colDef = numSlots <= 1 ? '1fr 2fr' : '2fr 1fr';

  return {
    textCol: colDef,
    imgArea: null,
    contentArea: 'text',
    gridAreas: gridAreasStr.trim(),
    layout: 'alternating',
    imageSlots: slots,
    imageOrder: slots.map(s => `left-${s.imageIndex}`),
  };
}

/**
 * Main entry point.
 * @param {string} rawMarkdown - The raw .md file content.
 * @returns {Object} { title, slides: [{ title, html, theme, images, layout }] }
 */
export function parseMarkdown(rawMarkdown, basePath) {
  const { meta, body } = extractFrontMatter(rawMarkdown);
  const splitResult = splitSlides(body);
  const slides = splitResult.slides;
  const presentationTitle = splitResult.presentationTitle || 'Web Slideshow';

  // Convert each slide's markdown to HTML and gather image info
  const parsedSlides = slides.map((slide, idx) => {
    const headingHtml = slide.title ? `<h2>${slide.title}</h2>` : '';
    const html = marked.parse(slide.content || '');
    const fullHtml = headingHtml + (headingHtml && html ? '\n' + html : html);

    // Fix relative image paths using the source file's directory
    const resolvedHtml = fullHtml.replace(
      /<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g,
      (match, before, src, after) => {
        if (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) {
          return match; // already absolute or protocol-relative
        }
        const resolved = basePath ? basePath.replace(/\/$/, '') + '/' + src : src;
        return `<img ${before}src="${resolved}"${after}>`;
      },
    );

    // Parse images from resolved HTML
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
    const images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.push({
        src: match[1],
        alt: match[2],
        classification: null, // will be set after dimensions load
        domIndex: images.length,
        element: null,
      });
    }

    const textDensity = measureTextDensity(slide.content || '');

    return {
      title: (slide.title === '' || slide.title) ? slide.title : `Slide ${idx + 1}`,
      content: slide.content || '',
      html: resolvedHtml,
      theme: slide.theme || (idx === 0 && meta?.theme ? meta.theme : null),
      images,
      textDensity,
      layout: null, // planned after image dimensions are known
    };
  });

  return {
    title: presentationTitle,
    slides: parsedSlides,
    theme: meta?.theme || null,
  };
}

/**
 * Async: after DOM is ready, resolve image dimensions and plan layouts.
 * @param {Object} parsed - Output of parseMarkdown
 * @returns {Promise<Object>} Same structure but with layouts filled in
 */
export async function resolveImageLayouts(parsed) {
  // Wait for images to load their natural dimensions
  const imgPromises = [];
  for (const slide of parsed.slides) {
    for (const img of slide.images) {
      imgPromises.push(
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            img.classification = classifyImage(image.naturalWidth, image.naturalHeight);
            resolve();
          };
          image.onerror = () => {
            img.classification = 'small';
            resolve();
          };
          image.src = img.src;
        })
      );
    }
  }

  await Promise.allSettled(imgPromises);

  // Plan layouts now that we know image classifications
  for (const slide of parsed.slides) {
    slide.layout = planLayout(slide.images, slide.textDensity);
  }

  return parsed;
}
