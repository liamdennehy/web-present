/**
 * app.js — Main entry, event listeners, navigation, rendering
 */

import { parseMarkdown, resolveImageLayouts } from './parser.js';
import { applyGlobalTheme, applySlideTheme } from './theme.js';

// ── State ──────────────────────────────────────────────
let parsed = null;
let currentIndex = 0;
let isTransitioning = false;

// ── DOM refs ───────────────────────────────────────────
const slidesContainer = document.getElementById('slides-container');
const progressFill = document.getElementById('progress-fill');
const slideCounter = document.getElementById('slide-counter');
const helpOverlay = document.getElementById('help-overlay');
const fileInput = document.getElementById('file-input');

// ── Init ───────────────────────────────────────────────
async function init() {
  const params = new URLSearchParams(window.location.search);
  const folder = params.get('folder');

  if (folder) {
    // Load from a server-hosted presentation folder
    const url = folder.replace(/\/$/, '') + '/index.md';
    const response = await fetch(url);
    const text = await response.text();
    await loadSlides(text, folder.replace(/\/$/, '') + '/');
    return;
  }

  // Try to load default slide, fall back to empty
  try {
    const response = await fetch('slides/default.md');
    const text = await response.text();
    await loadSlides(text, 'slides/');
  } catch {
    // No default slide — show a welcome slide
    const welcome = `# Welcome to Web Slideshow

Load a Markdown presentation file by pressing **f**.

Your .md file will be rendered as slides — each **##** heading starts a new slide.

`;
    await loadSlides(welcome);
  }
}

/**
 * Load raw Markdown text, parse, resolve image layouts, apply theme, render.
 */
async function loadSlides(rawMarkdown, basePath) {
  parsed = parseMarkdown(rawMarkdown, basePath || '');

  // Apply global theme
  applyGlobalTheme(parsed.theme);

  // Resolve image dimensions and plan layouts
  parsed = await resolveImageLayouts(parsed);

  renderSlides();
  goToSlide(0);

  // Set browser tab title to presentation title
  document.title = parsed.title || 'Web Slideshow';
}

// ── Rendering ──────────────────────────────────────────

/**
 * Build DOM for all slides at once.
 */
function renderSlides() {
  slidesContainer.innerHTML = '';

  parsed.slides.forEach((slide, idx) => {
    const el = document.createElement('div');
    el.className = 'slide';
    el.dataset.index = idx;

    // Title slide?
    if (idx === 0 && !slide.title) {
      el.classList.add('title-slide');
    }

    const content = document.createElement('div');
    content.className = 'slide-content';
    content.innerHTML = slide.html;

    el.appendChild(content);

    // Add image slots based on layout plan
    addImageSlots(el, slide);

    // Apply per-slide theme
    if (slide.theme) {
      applySlideTheme(el, slide.theme);
    }

    slidesContainer.appendChild(el);
  });

  updateProgress();
}

/**
 * Create image container elements based on the slide's layout plan.
 */
function addImageSlots(slideEl, slide) {
  if (!slide.layout || slide.layout.layout === 'full') return;

  const layout = slide.layout;

  if (layout.layout === 'two-col') {
    // Single dominant image
    const imgEl = document.createElement('div');
    imgEl.className = 'slide-image';
    imgEl.style.gridArea = 'image';

    const img = document.createElement('img');
    img.src = slide.images[0].src;
    img.alt = slide.images[0].alt || '';
    img.loading = 'eager';
    imgEl.appendChild(img);

    slideEl.appendChild(imgEl);
  } else if (layout.layout === 'alternating') {
    // Multiple images — alternating left/right
    const gridAreas = layout.gridAreas;
    slideEl.style.setProperty('--grid-areas', gridAreas);

    slide.images.forEach((imgData, i) => {
      // Only add medium/dominant images as grid elements
      if (imgData.classification === 'small') return;

      const slotEl = document.createElement('div');
      const slotName = layout.imageOrder[i];
      slotEl.style.gridArea = slotName;
      slotEl.className = 'slide-image';

      const img = document.createElement('img');
      img.src = imgData.src;
      img.alt = imgData.alt || '';
      img.loading = i === 0 ? 'eager' : 'lazy';
      slotEl.appendChild(img);

      slideEl.appendChild(slotEl);
    });
  }
}

// ── Navigation ─────────────────────────────────────────

/**
 * Switch to slide at given index with animation.
 */
function goToSlide(index) {
  if (isTransitioning) return;
  if (index < 0 || index >= parsed.slides.length) return;

  isTransitioning = true;

  const slides = slidesContainer.querySelectorAll('.slide');
  const prevIndex = currentIndex;

  // Fade out current
  if (slides[prevIndex]) {
    slides[prevIndex].classList.remove('active', 'fade-in');
    slides[prevIndex].classList.add('fade-out');
  }

  setTimeout(() => {
    if (slides[prevIndex]) {
      slides[prevIndex].classList.remove('fade-out');
    }

    currentIndex = index;

    // Activate target
    if (slides[currentIndex]) {
      slides[currentIndex].classList.add('active', 'fade-in');
    }

    updateProgress();

    setTimeout(() => {
      isTransitioning = false;
    }, 400);
  }, 250);
}

function nextSlide() {
  goToSlide(Math.min(currentIndex + 1, parsed.slides.length - 1));
}

function prevSlide() {
  goToSlide(Math.max(currentIndex - 1, 0));
}

function firstSlide() {
  goToSlide(0);
}

function lastSlide() {
  goToSlide(parsed.slides.length - 1);
}

// ── Progress & Counter ─────────────────────────────────

function updateProgress() {
  const total = parsed.slides.length;
  const current = currentIndex + 1;

  const pct = total > 0 ? (current / total) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  slideCounter.textContent = `${current} / ${total}`;
}

// ── Help Overlay ───────────────────────────────────────

function toggleHelp() {
  helpOverlay.classList.toggle('hidden');
}

// ── File Picker ────────────────────────────────────────

function openFilePicker() {
  fileInput.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Try to infer base path from file name (e.g., "slides/present.md" -> "slides/")
    const parts = file.name.split('/');
    const baseDir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    loadSlides(e.target.result, baseDir);
  };
  reader.readAsText(file);

  // Reset input so the same file can be re-selected
  fileInput.value = '';
}

// ── Keyboard Handler ───────────────────────────────────

function handleKeyDown(e) {
  // Don't capture keys when help is open
  const helpOpen = !helpOverlay.classList.contains('hidden');

  if (e.key === '?' || e.key === 'Help') {
    e.preventDefault();
    toggleHelp();
    return;
  }

  if (e.key === 'Escape') {
    if (helpOpen) {
      toggleHelp();
    }
    return;
  }

  if (helpOpen) return;

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      nextSlide();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevSlide();
      break;
    case 'Home':
      e.preventDefault();
      firstSlide();
      break;
    case 'End':
      e.preventDefault();
      lastSlide();
      break;
    case 'g':
      if (!e.ctrlKey && !e.metaKey) {
        firstSlide();
      }
      break;
    case 'G':
      if (!e.ctrlKey && !e.metaKey) {
        lastSlide();
      }
      break;
    case 'f':
      e.preventDefault();
      openFilePicker();
      break;
  }
}

// ── Touch / Swipe Support ──────────────────────────────

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  // Only horizontal swipes (ignore if vertical movement is larger)
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
}

// ── Event Binding ──────────────────────────────────────

document.addEventListener('keydown', handleKeyDown);
fileInput.addEventListener('change', handleFileSelect);
document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchend', handleTouchEnd, { passive: true });

// Click navigation on slides
slidesContainer.addEventListener('click', (e) => {
  // Right side of slide = next, left side = previous
  const rect = slidesContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x > rect.width * 0.7) {
    nextSlide();
  } else if (x < rect.width * 0.3) {
    prevSlide();
  }
});

// ── Start ──────────────────────────────────────────────
init();
