// Pulls the latin Cormorant Garamond and Inter Tight faces that `next build` downloaded
// (.next/static/media/*.woff2) into scripts/brand/fonts/*.ttf for make-brand.mjs.
// Usage: node scripts/brand/extract-fonts.mjs .next/static/media
import fs from "node:fs";
import path from "node:path";
import wawoff2 from "wawoff2";
import opentype from "opentype.js";

const dir = process.argv[2] ?? ".next/static/media";
const out = new URL("./fonts/", import.meta.url);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".woff2"))) {
  const ttf = await wawoff2.decompress(fs.readFileSync(path.join(dir, f)));
  const font = opentype.parse(Buffer.from(ttf).buffer.slice(0));
  const family = font.names.fontFamily?.en ?? "";
  const sub = font.names.fontSubfamily?.en ?? "";
  const latin = font.charToGlyphIndex("P") > 0 && font.charToGlyphIndex("a") > 0;
  if (!latin) continue;
  const name = `${family}-${sub}`.replace(/\s+/g, "") + ".ttf";
  fs.writeFileSync(new URL(name, out), Buffer.from(ttf));
  console.log("wrote", name);
}
