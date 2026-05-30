/**
 * Shared Mermaid helpers used by both the build-time rasterizer
 * (scripts/build-feed-assets.mjs) and the runtime feed pipeline
 * (src/lib/feed/mermaid.js). Keeping the extraction and hashing logic in one
 * place guarantees the PNG filenames produced at build time match the lookups
 * performed when the feed is serialized.
 *
 * This is a .mjs module so it can be imported both by the plain-node build
 * script and by the Next bundler.
 */
import { createHash } from "node:crypto";

/** Matches a single Contentlayer-rendered Mermaid diagram. */
export const MERMAID_SVG_RE = /<svg[^>]*\bid="mermaid-[^"]*"[^>]*>[\s\S]*?<\/svg>/gi;

/** Stable short content hash used as the PNG filename. */
export function hashSvg(svg) {
  return createHash("sha1").update(svg).digest("hex").slice(0, 16);
}

/** Read the logical pixel size from the SVG viewBox. */
export function sizeFromViewBox(svg) {
  const viewBox = (svg.match(/viewBox="([\d.\s-]+)"/) || [])[1];
  if (!viewBox) return { width: 720, height: 480 };

  const parts = viewBox.trim().split(/\s+/).map(Number);
  return {
    width: Math.round(parts[2] || 720),
    height: Math.round(parts[3] || 480),
  };
}

/**
 * Produce a standalone SVG document with an explicit pixel size (derived from
 * the viewBox) so it rasterizes at the correct dimensions. The scoped <style>
 * and <foreignObject> labels are preserved untouched; a real browser renders
 * them faithfully.
 */
export function toStandaloneSvg(svg) {
  const { width, height } = sizeFromViewBox(svg);
  const openEnd = svg.indexOf(">");
  const openTag = svg
    .slice(0, openEnd + 1)
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "")
    .replace(/\sstyle="[^"]*"/i, "")
    .replace(/<svg/i, `<svg width="${width}" height="${height}"`);
  return { svg: openTag + svg.slice(openEnd + 1), width, height };
}
