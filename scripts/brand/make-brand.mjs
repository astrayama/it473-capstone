// Generates the Prairie Crest crest, mark, wordmark and icon as outlined SVG paths.
// Usage: node scripts/brand/make-brand.mjs <repoRoot>   (fonts from extract-fonts.mjs; see README.md)
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const repo = process.argv[2];
const load = (f) => opentype.parse(fs.readFileSync(new URL(`./fonts/${f}`, import.meta.url)).buffer);
const serifItalic = load("CormorantGaramondLight-Italic.ttf");
const sans = load("InterTight-Regular.ttf");

const r2 = (n) => Math.round(n * 100) / 100;
const C = { x: 120, y: 120 };

/** Path data for a string laid out horizontally; returns { d, bbox, width }. */
function textPath(font, text, size, x, y, tracking = 0) {
  let cursor = x;
  const parts = [];
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  glyphs.forEach((g, i) => {
    const p = g.getPath(cursor, y, size);
    parts.push(p.toPathData(2));
    let adv = g.advanceWidth * scale;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
    cursor += adv;
  });
  return { d: parts.join(""), width: cursor - x };
}

function bboxOf(font, text, size, tracking = 0) {
  const t = textPath(font, text, size, 0, 0, tracking);
  // measure via opentype path of each glyph
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cursor = 0;
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  glyphs.forEach((g, i) => {
    const bb = g.getPath(cursor, 0, size).getBoundingBox();
    if (bb.x1 !== bb.x2) {
      minX = Math.min(minX, bb.x1); maxX = Math.max(maxX, bb.x2);
      minY = Math.min(minY, bb.y1); maxY = Math.max(maxY, bb.y2);
    }
    let adv = g.advanceWidth * scale;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
    cursor += adv;
  });
  return { minX, minY, maxX, maxY, advance: t.width };
}

/** Lays text along a circle. mode "top": reads clockwise over the top; "bottom": under, upright. */
function arcText(font, text, size, radius, centerDeg, tracking, mode) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const advs = glyphs.map((g, i) => {
    let a = g.advanceWidth * scale;
    if (i < glyphs.length - 1) a += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
    return a;
  });
  const total = advs.reduce((a, b) => a + b, 0) - tracking;
  const totalDeg = (total / radius) * (180 / Math.PI);
  const parts = [];
  let s = 0;
  glyphs.forEach((g, i) => {
    const mid = s + (g.advanceWidth * scale) / 2;
    const offDeg = (mid / radius) * (180 / Math.PI) - totalDeg / 2;
    const deg = mode === "top" ? centerDeg + offDeg : centerDeg - offDeg;
    const rad = (deg * Math.PI) / 180;
    const px = C.x + radius * Math.cos(rad);
    const py = C.y + radius * Math.sin(rad);
    const rot = mode === "top" ? deg + 90 : deg - 90;
    const gp = g.getPath(-(g.advanceWidth * scale) / 2, 0, size).toPathData(2);
    if (gp) parts.push(`<path transform="translate(${r2(px)} ${r2(py)}) rotate(${r2(rot)})" d="${gp}"/>`);
    s += advs[i];
  });
  return parts.join("");
}

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C.x + r * Math.cos(a), C.y + r * Math.sin(a)];
};

/** A wheat stalk following a circle of radius r from deg0 (base) to deg1 (tip). */
function wheat(r, deg0, deg1, side) {
  const steps = 40;
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(polar(r, deg0 + ((deg1 - deg0) * i) / steps));
  const stem = `M${pts.map((p) => p.map(r2).join(" ")).join("L")}`;
  const grains = [];
  const leaf = (x, y, angDeg, len, w) => {
    const a = (angDeg * Math.PI) / 180;
    const tx = x + len * Math.cos(a), ty = y + len * Math.sin(a);
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    const mx = (x + tx) / 2, my = (y + ty) / 2;
    return `M${r2(x)} ${r2(y)}Q${r2(mx + nx)} ${r2(my + ny)} ${r2(tx)} ${r2(ty)}Q${r2(mx - nx)} ${r2(my - ny)} ${r2(x)} ${r2(y)}Z`;
  };
  const dir = Math.sign(deg1 - deg0);
  const n = 6;
  for (let k = 0; k < n; k++) {
    const t = 0.38 + (k / n) * 0.56;
    const deg = deg0 + (deg1 - deg0) * t;
    const [x, y] = polar(r, deg);
    const tangent = deg + 90 * dir; // direction of growth
    const len = 10.5 - k * 0.7;
    grains.push(leaf(x, y, tangent - 34, len, 2.5));
    grains.push(leaf(x, y, tangent + 34, len, 2.5));
  }
  const [tx, ty] = polar(r, deg1);
  grains.push(leaf(tx, ty, deg1 + 90 * dir, 9, 2.4));
  // a single leaf low on the stem
  const [lx, ly] = polar(r, deg0 + (deg1 - deg0) * 0.18);
  grains.push(leaf(lx, ly, deg0 + (deg1 - deg0) * 0.18 + 90 * dir + (side === "left" ? 50 : -50), 14, 3));
  return { stem, grains: grains.join("") };
}

// ---- Monogram --------------------------------------------------------------
function monogram(size, cx, cy, overlap) {
  const tracking = -overlap * size;
  const bb = bboxOf(serifItalic, "PC", size, tracking);
  const x = cx - (bb.minX + bb.maxX) / 2;
  const y = cy - (bb.minY + bb.maxY) / 2;
  return { d: textPath(serifItalic, "PC", size, x, y, tracking).d, bb, x, y };
}

// ---- Full crest (240 × 240) ------------------------------------------------
const mono = monogram(78, 120, 106, 0.07);
const top = arcText(sans, "PRAIRIE CREST", 10.5, 97.5, -90, 3.2, "top");
const bottom = arcText(sans, "FOODS", 10.5, 105, 90, 3.2, "bottom");
const [dlx, dly] = polar(101.5, 180), [drx, dry] = polar(101.5, 0);
const diamond = (x, y) => `M${r2(x - 2.4)} ${r2(y)}L${r2(x)} ${r2(y - 2.4)}L${r2(x + 2.4)} ${r2(y)}L${r2(x)} ${r2(y + 2.4)}Z`;

const horizonY = 156;
const sunR = 12.5;
const rays = [];
for (let deg = -165; deg <= -15; deg += 25) {
  const [x1, y1] = [120 + (sunR + 4) * Math.cos((deg * Math.PI) / 180), horizonY + (sunR + 4) * Math.sin((deg * Math.PI) / 180)];
  const [x2, y2] = [120 + (sunR + 9) * Math.cos((deg * Math.PI) / 180), horizonY + (sunR + 9) * Math.sin((deg * Math.PI) / 180)];
  rays.push(`M${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}`);
}
const leftWheat = wheat(70, 150, 214, "left");
const rightWheat = wheat(70, 30, -34, "right");

const crestBody = `
  <circle cx="120" cy="120" r="117" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <circle cx="120" cy="120" r="112" fill="none" stroke="currentColor" stroke-width="0.6"/>
  <circle cx="120" cy="120" r="86" fill="none" stroke="currentColor" stroke-width="0.6"/>
  <g fill="currentColor">${top}${bottom}<path d="${diamond(dlx, dly)}${diamond(drx, dry)}"/></g>
  <path d="${mono.d}" fill="currentColor" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/>
  <g fill="none" stroke="currentColor" stroke-linecap="round">
    <path d="M${120 - 58} ${horizonY}H${120 + 58}" stroke-width="1.1"/>
    <path d="M${120 - sunR} ${horizonY}A${sunR} ${sunR} 0 0 1 ${120 + sunR} ${horizonY}" stroke-width="1.1"/>
    <path d="${rays.join("")}" stroke-width="1"/>
    <path d="M${120 - 42} ${horizonY + 7}H${120 + 42}M${120 - 26} ${horizonY + 13}H${120 + 26}M${120 - 12} ${horizonY + 19}H${120 + 12}" stroke-width="0.7"/>
    <path d="${leftWheat.stem}${rightWheat.stem}" stroke-width="0.9"/>
  </g>
  <path d="${leftWheat.grains}${rightWheat.grains}" fill="currentColor"/>`;

// ---- Mark: simplified for small sizes (ring + monogram + horizon) ---------
const markMono = monogram(92, 120, 110, 0.07);
const markBody = `
  <circle cx="120" cy="120" r="112" fill="none" stroke="currentColor" stroke-width="5"/>
  <path d="${markMono.d}" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M58 166H182" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;

// ---- Wordmark (stacked) ----------------------------------------------------
const nameSize = 64;
const nameBB = bboxOf(serifItalic, "Prairie Crest", nameSize, 0);
const nameW = nameBB.maxX - nameBB.minX;
const padX = 4;
const nameX = padX - nameBB.minX;
const nameY = 4 - nameBB.minY;
const nameD = textPath(serifItalic, "Prairie Crest", nameSize, nameX, nameY, 0).d;
const foodsSize = 12.5, foodsTrack = 7.5;
const foodsBB = bboxOf(sans, "FOODS", foodsSize, foodsTrack);
const foodsW = foodsBB.maxX - foodsBB.minX;
const wmW = nameW + padX * 2;
const foodsX = wmW / 2 - foodsW / 2 - foodsBB.minX;
const foodsY = nameY + (nameBB.maxY) + 30;
const foodsD = textPath(sans, "FOODS", foodsSize, foodsX, foodsY, foodsTrack).d;
const ruleY = foodsY - (foodsBB.maxY - foodsBB.minY) / 2 + foodsBB.maxY - 0.5;
const ruleGap = 14;
const wmH = foodsY + foodsBB.maxY + 6;
const wordmarkBody = `
  <path d="${nameD}" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>
  <path d="${foodsD}" fill="currentColor"/>
  <path d="M${r2(foodsX + foodsBB.minX - ruleGap - 70)} ${r2(ruleY)}h70M${r2(foodsX + foodsBB.maxX + ruleGap)} ${r2(ruleY)}h70" stroke="currentColor" stroke-width="1" fill="none"/>`;

// ---- Horizontal lockup: mark + name + FOODS ---------------------------------
const lkH = 96;
const lkMarkScale = lkH / 240;
const lkNameSize = 54;
const lkBB = bboxOf(serifItalic, "Prairie Crest", lkNameSize, 0);
const lkNameX = lkH + 22 - lkBB.minX;
const lkNameY = 50;
const lkNameD = textPath(serifItalic, "Prairie Crest", lkNameSize, lkNameX, lkNameY, 0).d;
const lkFoodsX = lkH + 24;
const lkFoodsD = textPath(sans, "FOODS", 11.5, lkFoodsX, 78, 7).d;
const lkW = lkNameX + lkBB.maxX + 4;
const lockupBody = `
  <g transform="scale(${r2(lkMarkScale)})">${markBody}</g>
  <path d="${lkNameD}" fill="currentColor" stroke="currentColor" stroke-width="0.45"/>
  <path d="${lkFoodsD}" fill="currentColor"/>`;

// ---- Write files -------------------------------------------------------------
const svg = (w, h, body, label, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" role="img" aria-label="${label}"${extra}>${body}\n</svg>\n`;
const colored = (color, body) => `<g color="${color}">${body}</g>`;
const outDir = path.join(repo, "public/brand");
fs.mkdirSync(outDir, { recursive: true });
const GOLD = "#C9A45C", NOIR = "#0E0C0A", INK = "#1B1712";

fs.writeFileSync(path.join(outDir, "crest.svg"), svg(240, 240, colored(GOLD, crestBody), "Prairie Crest Foods crest"));
fs.writeFileSync(path.join(outDir, "crest-ink.svg"), svg(240, 240, colored(INK, crestBody), "Prairie Crest Foods crest"));
fs.writeFileSync(path.join(outDir, "mark.svg"), svg(240, 240, colored(GOLD, markBody), "Prairie Crest mark"));
fs.writeFileSync(path.join(outDir, "wordmark.svg"), svg(wmW, wmH, colored(GOLD, wordmarkBody), "Prairie Crest Foods"));
fs.writeFileSync(path.join(outDir, "wordmark-ink.svg"), svg(wmW, wmH, colored(INK, wordmarkBody), "Prairie Crest Foods"));
fs.writeFileSync(path.join(outDir, "lockup.svg"), svg(lkW, lkH, colored(GOLD, lockupBody), "Prairie Crest Foods"));
fs.writeFileSync(path.join(outDir, "lockup-ink.svg"), svg(lkW, lkH, colored(INK, lockupBody), "Prairie Crest Foods"));
// Favicon: gold mark on a noir tile.
const icon = svg(240, 240, `<rect width="240" height="240" rx="52" fill="${NOIR}"/><g color="${GOLD}" transform="translate(18 18) scale(0.85)">${markBody}</g>`, "Prairie Crest");
fs.writeFileSync(path.join(repo, "src/app/icon.svg"), icon);

// React path data (kept in sync with the SVG files above).
const ts = `// Generated by the brand script (Cormorant Garamond + Inter Tight outlines). Do not edit by hand.

export const CREST_VIEWBOX = "0 0 240 240";
export const CREST_SVG = ${JSON.stringify(crestBody.trim())};
export const MARK_SVG = ${JSON.stringify(markBody.trim())};
export const WORDMARK_VIEWBOX = "0 0 ${r2(wmW)} ${r2(wmH)}";
export const WORDMARK_SVG = ${JSON.stringify(wordmarkBody.trim())};
`;
fs.mkdirSync(path.join(repo, "src/components/brand"), { recursive: true });
fs.writeFileSync(path.join(repo, "src/components/brand/brand-svg.ts"), ts);
console.log("wordmark", r2(wmW), r2(wmH), "lockup", r2(lkW), lkH, "mono bb", mono.bb);
