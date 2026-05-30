/**
 * Build-time Mermaid rasterizer (Route A).
 *
 * RSS readers (Folo, Feedly, NetNewsWire, ...) sanitize away inline <svg> and
 * `data:` URIs, so feed diagrams must be hosted raster images. This script
 * renders every Mermaid diagram found in the generated post HTML to a PNG via
 * headless Chromium (which renders the original <foreignObject> HTML labels
 * faithfully, including CJK text), writing:
 *
 *   - public/static/feed/mermaid/<hash>.png   (committed, served statically)
 *   - data/feed/mermaid-manifest.json         (hash -> { src, w, h })
 *
 * Run locally (Windows has the CJK fonts) after changing any diagram:
 *   npm run assets
 * then commit the generated PNGs and manifest. Deployment needs no Chromium.
 */
import { mkdirSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { allPosts } from "../.contentlayer/generated/index.mjs";
import { MERMAID_SVG_RE, hashSvg, toStandaloneSvg } from "../src/lib/feed/mermaid-shared.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/static/feed/mermaid");
const MANIFEST_DIR = path.join(ROOT, "src/lib/feed");
const MANIFEST_PATH = path.join(MANIFEST_DIR, "mermaid-manifest.json");
const PUBLIC_PREFIX = "/static/feed/mermaid";
const SCALE = 2; // retina-crisp output

function collectDiagrams() {
  const diagrams = new Map(); // hash -> svg
  for (const post of allPosts) {
    for (const svg of post.body.html.match(MERMAID_SVG_RE) || []) {
      diagrams.set(hashSvg(svg), svg);
    }
  }
  return diagrams;
}

async function render() {
  const diagrams = collectDiagrams();
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(MANIFEST_DIR, { recursive: true });

  const manifest = {};
  let rendered = 0;
  let cached = 0;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ deviceScaleFactor: SCALE });
    const page = await context.newPage();

    for (const [hash, rawSvg] of diagrams) {
      const { svg, width, height } = toStandaloneSvg(rawSvg);
      manifest[hash] = { src: `${PUBLIC_PREFIX}/${hash}.png`, w: width, h: height };

      const file = path.join(OUT_DIR, `${hash}.png`);
      if (existsSync(file)) {
        cached += 1;
        continue;
      }

      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8">` +
          `<style>html,body{margin:0;padding:0;background:#fff}</style></head>` +
          `<body>${svg}</body></html>`,
        { waitUntil: "networkidle" }
      );
      await page.locator("svg").first().screenshot({ path: file });
      rendered += 1;
    }
  } finally {
    await browser.close();
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  // Prune orphaned PNGs no longer referenced by any post.
  let pruned = 0;
  for (const file of readdirSync(OUT_DIR)) {
    if (file.endsWith(".png") && !manifest[file.replace(/\.png$/, "")]) {
      rmSync(path.join(OUT_DIR, file));
      pruned += 1;
    }
  }

  console.log(
    `mermaid assets: ${diagrams.size} diagram(s) | rendered ${rendered}, cached ${cached}, pruned ${pruned}`
  );
  console.log(`manifest -> ${path.relative(ROOT, MANIFEST_PATH)}`);
}

render().catch((error) => {
  console.error("build-feed-assets failed:", error);
  process.exit(1);
});
