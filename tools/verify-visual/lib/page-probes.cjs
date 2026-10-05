'use strict';

/**
 * In-page collectors (promoted from the scratch probes).
 *
 * Every function here is serialised into the browser by Playwright, so each one
 * must be fully self-contained: no imports, no closure over module scope, and
 * exactly one serialisable argument.
 */

/** True when a node actually paints: sized box, visible, not faded to nothing. */
function paints(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return false;
  let opacity = 1;
  let node = el;
  while (node && node.nodeType === 1) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    opacity *= Number(style.opacity);
    if (opacity < 0.05) return false;
    node = node.parentElement;
  }
  return true;
}

function cssPath(el) {
  const parts = [];
  let node = el;
  for (let depth = 0; node && node.nodeType === 1 && depth < 5; depth += 1) {
    let label = node.tagName.toLowerCase();
    if (node.id) label += `#${node.id}`;
    else if (typeof node.className === 'string' && node.className.trim()) {
      label += `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
    }
    parts.unshift(label);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function sectionOf(el) {
  const anchor = el.closest('section[id], footer, [role="dialog"]');
  if (!anchor) return 'page';
  return anchor.getAttribute('id') || (anchor.getAttribute('role') === 'dialog' ? 'cockpit-modal' : anchor.tagName.toLowerCase());
}

function inkSnapshot(el) {
  let value = 1;
  let node = el;
  while (node && node.nodeType === 1) {
    value *= Number(getComputedStyle(node).opacity);
    node = node.parentElement;
  }
  return Number(value.toFixed(3));
}

/** Knock a node's ink out without erasing its own background box. */
function paintInk({ indices, visible }) {
  const walker = document.evaluate('//body//*', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  let touched = 0;
  for (const index of indices) {
    const el = walker.snapshotItem(index);
    if (!el || !el.style) continue;
    if (visible) {
      el.style.removeProperty('color');
      el.style.removeProperty('-webkit-text-fill-color');
    } else {
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
    }
    touched += 1;
  }
  return touched;
}

/** Flag node indices that match any of the given selectors, for named reporting. */
function markHighlights(selectors) {
  const matched = {};
  for (const selector of selectors) {
    try {
      const nodes = [...document.querySelectorAll(selector)];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let index = 0;
      let node = walker.nextNode();
      while (node) {
        if (nodes.includes(node)) (matched[selector] = matched[selector] || []).push(index);
        index += 1;
        node = walker.nextNode();
      }
    } catch {
      matched[selector] = [];
    }
  }
  return matched;
}

/**
 * Census of every leaf node that paints ink.
 *
 * Ink is knocked out later, at capture time, with `color: transparent` rather
 * than `visibility: hidden`, because hiding the node also erases its own
 * background and a solid champagne button would then be sampled against the page
 * behind it.
 */
function collectTextNodes() {
  const paints = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return false;
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return false;
    let opacity = 1;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      opacity *= Number(style.opacity);
      if (opacity < 0.05) return false;
      node = node.parentElement;
    }
    return true;
  };
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    for (let depth = 0; node && node.nodeType === 1 && depth < 5; depth += 1) {
      let label = node.tagName.toLowerCase();
      if (node.id) label += `#${node.id}`;
      else if (typeof node.className === 'string' && node.className.trim()) {
        label += `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
      }
      parts.unshift(label);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
  const sectionOf = (el) => {
    const anchor = el.closest('section[id], footer, [role="dialog"]');
    if (!anchor) return 'page';
    return anchor.getAttribute('id') || (anchor.getAttribute('role') === 'dialog' ? 'cockpit-modal' : anchor.tagName.toLowerCase());
  };
  const inkSnapshot = (el) => {
    let value = 1;
    let node = el;
    while (node && node.nodeType === 1) {
      value *= Number(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    return Number(value.toFixed(3));
  };

  const nodes = [];
  const walker = document.evaluate('//body//*', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (let i = 0; i < walker.snapshotLength; i += 1) {
    const el = walker.snapshotItem(i);
    if (!paints(el)) continue;
    /* Ink-bearing leaf text. `<br>` is a layout break, not ink of its own, so a
       heading split across lines still paints a single run of type and must be
       measured — treating it as a container would silently drop multi-line
       display headlines out of both the census and the band contrast probes. */
    const hasInkBearingChild = [...el.children].some(
      (child) => (child.textContent || '').trim().length > 0,
    );
    if (hasInkBearingChild) continue;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === 'style' || tag === 'script' || tag === 'noscript') continue;

    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    nodes.push({
      index: i,
      path: cssPath(el),
      section: sectionOf(el),
      tag,
      text: text.slice(0, 44),
      colour: style.color,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage.slice(0, 70),
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontFamily: style.fontFamily.split(',')[0].replace(/["']/g, ''),
      letterSpacing: style.letterSpacing,
      effectiveOpacity: inkSnapshot(el),
      isIcon: /Material Symbols/i.test(style.fontFamily),
      inDialog: Boolean(el.closest('[role="dialog"]')),
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    });
  }
  return nodes;
}

/**
 * Computed-style census: colour, radius, border, shadow. Radii come from
 * computed style so arbitrary values such as `rounded-[28px]` cannot hide from a
 * class-name sweep.
 */
function collectStyleCensus() {
  const paints = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return false;
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return false;
    let opacity = 1;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      opacity *= Number(style.opacity);
      if (opacity < 0.05) return false;
      node = node.parentElement;
    }
    return true;
  };
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    for (let depth = 0; node && node.nodeType === 1 && depth < 5; depth += 1) {
      let label = node.tagName.toLowerCase();
      if (node.id) label += `#${node.id}`;
      else if (typeof node.className === 'string' && node.className.trim()) {
        label += `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
      }
      parts.unshift(label);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
  const sectionOf = (el) => {
    const anchor = el.closest('section[id], footer, [role="dialog"]');
    if (!anchor) return 'page';
    return anchor.getAttribute('id') || (anchor.getAttribute('role') === 'dialog' ? 'cockpit-modal' : anchor.tagName.toLowerCase());
  };

  const out = [];
  const walker = document.evaluate('//body//*', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (let i = 0; i < walker.snapshotLength; i += 1) {
    const el = walker.snapshotItem(i);
    if (!paints(el)) continue;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    out.push({
      index: i,
      path: cssPath(el),
      section: sectionOf(el),
      tag: el.tagName.toLowerCase(),
      colour: style.color,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage.slice(0, 140),
      borderColor: [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor],
      borderWidth: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      radius: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius],
      boxShadow: style.boxShadow,
      filter: style.filter,
      blend: style.mixBlendMode,
      box: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
    });
  }
  return out;
}

/** Live animations. Perpetual ornament must be zero at rest. */
function collectAnimations() {
  return document.getAnimations().map((animation) => {
    const target = animation.effect ? animation.effect.target : null;
    return {
      name: animation.animationName || null,
      transitionProperty: animation.transitionProperty || null,
      type: animation.constructor ? animation.constructor.name : 'Unknown',
      playState: animation.playState,
      target: target ? cssPath(target) : 'detached',
    };
  });
}

/**
 * Geometry and computed optics of the pinned canvas-scroller hero
 * (`JetCanvasScroller`), exactly as the DOM reports them: the 500vh track, the
 * pinned viewport, the frame canvas, the three editorial bands, the Band 2
 * backplate, the Band 3 shadow treatment, the floating nav glass, and the
 * fleet-card count.
 */
function collectScroller() {
  const read = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      transform: style.transform,
      opacity: Number.parseFloat(style.opacity),
      visibility: style.visibility,
      filter: style.filter,
      backgroundImage: style.backgroundImage.slice(0, 160),
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
      box: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
    };
  };

  const band1 = document.querySelector('[data-band="1"]');
  const track = band1 ? band1.closest('section') : null;
  const viewport = track ? track.querySelector('.h-screen') : null;
  const canvas = document.querySelector('canvas');
  const header = document.querySelector('header');

  const trackTop = track ? track.getBoundingClientRect().top + window.scrollY : 0;
  const total = track ? track.offsetHeight - window.innerHeight : 0;
  const progress = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - trackTop) / total)) : 0;

  const textOf = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  };

  const band2 = document.querySelector('[data-band="2"]');
  const stack = band2 ? band2.firstElementChild : null;
  const plate = stack ? stack.children[0] : null;
  let backplate = null;
  if (plate) {
    const s = getComputedStyle(plate);
    backplate = {
      backgroundImage: s.backgroundImage,
      backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
      filter: s.filter,
      borderRadius: s.borderRadius,
      padding: s.padding,
    };
  }

  const band3Title = document.querySelector('[data-band="3"] h2');
  const band3Sub = document.querySelector('[data-band3-telemetry]');
  const canvasStyle = canvas ? getComputedStyle(canvas) : null;
  const navStyle = header ? getComputedStyle(header) : null;

  return {
    present: Boolean(track && canvas),
    trackHeight: track ? track.offsetHeight : null,
    progress: Number(progress.toFixed(4)),
    scrollY: Math.round(window.scrollY),
    viewportTop: viewport ? Math.round(viewport.getBoundingClientRect().top) : null,
    canvas: canvas
      ? {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          opacity: Number.parseFloat(canvasStyle.opacity),
          transform: canvasStyle.transform,
        }
      : null,
    nav: header
      ? {
          background: navStyle.backgroundColor,
          backdrop: navStyle.backdropFilter || navStyle.webkitBackdropFilter,
          border: navStyle.borderTopColor,
          shadow: navStyle.boxShadow,
        }
      : null,
    bands: { 1: read('[data-band="1"]'), 2: read('[data-band="2"]'), 3: read('[data-band="3"]') },
    copy: {
      band1: textOf('[data-band="1"]'),
      band2: textOf('[data-band="2"]'),
      band3: textOf('[data-band="3"]'),
    },
    band3Corridor: (() => {
      /* Measure the actual ink extents of the two flank titles against the
         viewport centre, so "the corridor is clear" is a measurement rather
         than an assumption. */
      const titles = [...document.querySelectorAll('[data-band="3"] h2')]
        .map((el) => el.getBoundingClientRect())
        .sort((a, b) => a.left - b.left);
      if (titles.length < 2) return null;
      const [leftTitle, rightTitle] = titles;
      const mid = window.innerWidth / 2;
      return {
        leftEdge: Number((mid - leftTitle.right).toFixed(2)),   // >0 means left title stops short of centre
        rightEdge: Number((rightTitle.left - mid).toFixed(2)), // <0 means right title starts short of centre
        viewportWidth: window.innerWidth,
        titles: titles.length,
      };
    })(),
    band2Backplate: backplate,
    band3Shadow: {
      titleFilter: band3Title ? getComputedStyle(band3Title).filter : null,
      subFilter: band3Sub ? getComputedStyle(band3Sub).filter : null,
      subColour: band3Sub ? getComputedStyle(band3Sub).color : null,
    },
    fleetCards: document.querySelectorAll('.fleet-card').length,
  };
}

/**
 * Fuselage cutaway probe (`FuselageScroller`).
 *
 * Reads the three quantities the section's contract actually rests on: where the
 * camera currently sits, which zone copy is composed, and whether anything
 * paints inside the reserved centre corridor. Everything is measured from the
 * live computed transform and real client rects — never from the authored
 * `yPercent`, so a regression in the tween shows up as a measurement here.
 */
function collectFuselage() {
  const section = document.querySelector('[aria-label="Fuselage cutaway"]');
  if (!section) return { present: false };
  const camera = section.querySelector('[data-fuselage-camera]');
  const svg = section.querySelector('svg');
  const layers = [...section.querySelectorAll('[data-fuselage-zone]')];
  const markers = [...section.querySelectorAll('[data-fuselage-marker]')];
  const vh = window.innerHeight;

  /* The corridor is the middle third of the width. The schematic lives there, so
     any copy whose box reaches into it competes with the focal object — measured
     over every text node in the section rather than the two known flanks, so a
     future third flank cannot quietly cross the line either. */
  const mid = window.innerWidth / 2;
  const corridorWidth = window.innerWidth * 0.33;
  const corridorLeft = mid - corridorWidth / 2;
  const corridorRight = mid + corridorWidth / 2;
  const intrusions = [];
  const inked = [...section.querySelectorAll('h2, p, li, span, svg')];
  for (const el of inked) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= vh) continue;
    if (rect.top >= vh || rect.bottom <= 0) continue;
    let opacity = 1;
    let node = el;
    while (node && node.nodeType === 1) {
      opacity *= Number(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    if (opacity < 0.05) continue;
    /* The schematic itself owns the corridor; only copy is an obstruction. */
    if (el.closest('svg') || !el.textContent.trim()) continue;
    const overlap = Math.min(rect.right, corridorRight) - Math.max(rect.left, corridorLeft);
    if (overlap > 1) {
      intrusions.push({
        text: el.textContent.trim().slice(0, 48),
        zone: el.closest('[data-fuselage-zone]')?.getAttribute('data-fuselage-zone') || null,
        overlap: Number(overlap.toFixed(1)),
      });
    }
  }

  return {
    present: true,
    vh,
    viewportWidth: window.innerWidth,
    trackHeight: section.offsetHeight,
    svgHeight: svg ? svg.getBoundingClientRect().height : null,
    svgWidth: svg ? svg.getBoundingClientRect().width : null,
    camera: camera
      ? {
          transform: getComputedStyle(camera).transform,
          top: Number(camera.getBoundingClientRect().top.toFixed(2)),
        }
      : null,
    corridor: { left: corridorLeft, right: corridorRight, intrusions },
    zones: layers.map((layer, index) => ({
      id: layer.getAttribute('data-fuselage-zone'),
      opacity: Number(Number(getComputedStyle(layer).opacity).toFixed(3)),
      visibility: getComputedStyle(layer).visibility,
      markerOpacity: markers[index] ? Number(Number(getComputedStyle(markers[index]).opacity).toFixed(3)) : null,
    })),
  };
}

/** Type loading and ligature rendering (promoted from the scratch typography probe). */
function collectTypography() {
  const families = ['Syne', 'Inter', '"JetBrains Mono"', '"Material Symbols Outlined"'];
  const glyph = document.querySelector('.material-symbols-outlined');
  let ligature = { found: false };
  if (glyph) {
    const rect = glyph.getBoundingClientRect();
    const style = getComputedStyle(glyph);
    ligature = {
      found: true,
      text: glyph.textContent,
      widthCss: Math.round(rect.width),
      heightCss: Math.round(rect.height),
      oneEmIs: Math.round(parseFloat(style.fontSize)),
      rendersAsGlyph: rect.width < parseFloat(style.fontSize) * 1.6,
    };
  }
  return {
    check: families.map((family) => ({ family, loaded: document.fonts.check(`16px ${family}`) })),
    faces: [...document.fonts].length,
    ligature,
  };
}

module.exports = {
  paints,
  cssPath,
  sectionOf,
  paintInk,
  markHighlights,
  collectTextNodes,
  collectStyleCensus,
  collectAnimations,
  collectScroller,
  collectFuselage,
  collectTypography,
};


