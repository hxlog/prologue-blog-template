/**
 * Feed renderer for Mermaid diagrams.
 *
 * Primary path: replace each Contentlayer-rendered inline <svg> with the
 * pre-rendered, hosted PNG produced by scripts/build-feed-assets.mjs (looked up
 * by content hash in mermaid-manifest.json). Hosted raster images are the only
 * format that survives every RSS reader's HTML sanitizer (inline SVG and
 * `data:` URIs are routinely stripped, e.g. by Folo).
 *
 * Fallback path (manifest miss, e.g. a diagram added but assets not yet
 * rebuilt): convert the SVG's <foreignObject> labels to native <text> and embed
 * a self-contained data-URI SVG so dev/preview still shows something.
 */
import { siteUrl } from "./urls";
import { MERMAID_SVG_RE, hashSvg, sizeFromViewBox } from "./mermaid-shared.mjs";
import manifest from "./mermaid-manifest.json";

const DEFAULT_LABEL_COLOR = "#1e293b";
const LINE_HEIGHT = 16;
const FONT_SIZE = 14;
const MAX_IMG_WIDTH = 720;

function decodeBasicEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function escapeXmlText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXmlAttr(text) {
  return escapeXmlText(text).replace(/"/g, "&quot;");
}

/** Pull readable, line-split text out of a foreignObject's inner HTML. */
function extractLabelLines(innerHtml) {
  const withBreaks = innerHtml
    .replace(/<br\s*\/?>(\s*<\/br>)?/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n");
  const text = decodeBasicEntities(withBreaks.replace(/<[^>]+>/g, ""));
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** All label lines in a diagram, for use as image alt text. */
function collectLabels(svg) {
  const labels = [];
  for (const match of svg.matchAll(/<foreignObject[^>]*>([\s\S]*?)<\/foreignObject>/gi)) {
    extractLabelLines(match[1]).forEach((line) => labels.push(line));
  }
  return [...new Set(labels)];
}

function altFor(svg) {
  const labels = collectLabels(svg);
  return escapeXmlAttr(labels.length ? `图表：${labels.join(" / ")}` : "图表");
}

// --- Fallback (data-URI SVG) helpers -------------------------------------

function extractColor(innerHtml) {
  const match = innerHtml.match(/color\s*:\s*([^;"'!]+)/i);
  return match ? match[1].trim() : DEFAULT_LABEL_COLOR;
}

function convertForeignObjects(svg) {
  return svg.replace(
    /<foreignObject([^>]*)>([\s\S]*?)<\/foreignObject>/gi,
    (_match, attrs, inner) => {
      const width = Number((attrs.match(/width="([\d.]+)"/) || [])[1] || 0);
      const height = Number((attrs.match(/height="([\d.]+)"/) || [])[1] || 0);
      const lines = extractLabelLines(inner);
      if (!width || !height || lines.length === 0) return "";

      const color = escapeXmlAttr(extractColor(inner));
      const cx = width / 2;
      const startY = height / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2;
      const tspans = lines
        .map((line, i) => {
          const y = (startY + i * LINE_HEIGHT).toFixed(1);
          return `<tspan x="${cx}" y="${y}" fill="${color}" style="fill:${color}">${escapeXmlText(line)}</tspan>`;
        })
        .join("");

      return (
        `<text x="${cx}" text-anchor="middle" dominant-baseline="central" ` +
        `font-family="arial,sans-serif" font-size="${FONT_SIZE}" ` +
        `fill="${color}" style="fill:${color}">${tspans}</text>`
      );
    }
  );
}

function stripLabelStyleRules(svg) {
  return svg.replace(/<style>([\s\S]*?)<\/style>/i, (_match, css) => {
    const kept = css
      .split("}")
      .map((rule) => rule.trim())
      .filter(Boolean)
      .filter((rule) => {
        const selector = rule.split("{")[0];
        if (/\bt?span\b/.test(selector)) return false;
        if (/(^|[\s,>])text\b/.test(selector)) return false;
        return true;
      })
      .map((rule) => `${rule}}`)
      .join("");
    return `<style>${kept}</style>`;
  });
}

function makeSvgSelfContained(svg) {
  const { width, height } = sizeFromViewBox(svg);
  const openEnd = svg.indexOf(">");
  const openTag = svg
    .slice(0, openEnd + 1)
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "")
    .replace(/\sstyle="[^"]*"/i, "")
    .replace(/<svg/i, `<svg width="${width}" height="${height}"`);
  return { svg: openTag + svg.slice(openEnd + 1), width };
}

function buildDataUriFallback(svg, alt) {
  const sized = makeSvgSelfContained(stripLabelStyleRules(convertForeignObjects(svg)));
  const base64 = Buffer.from(sized.svg, "utf8").toString("base64");
  const width = Math.min(sized.width, MAX_IMG_WIDTH);
  return (
    `<figure><img src="data:image/svg+xml;base64,${base64}" alt="${alt}" ` +
    `width="${width}" /></figure>`
  );
}

// --- Public API ----------------------------------------------------------

/** Replace every Mermaid <svg> with a hosted PNG figure (or SVG fallback). */
export function transformMermaidSvgs(html) {
  if (!html || !html.includes("mermaid")) return html;

  const pattern = new RegExp(MERMAID_SVG_RE.source, "gi");
  return html.replace(pattern, (svg) => {
    try {
      const alt = altFor(svg);
      const entry = manifest[hashSvg(svg)];
      if (entry) {
        const width = Math.min(entry.w, MAX_IMG_WIDTH);
        const height = Math.round((width / entry.w) * entry.h);
        return (
          `<figure><img src="${siteUrl()}${entry.src}" alt="${alt}" ` +
          `width="${width}" height="${height}" loading="lazy" /></figure>`
        );
      }
      return buildDataUriFallback(svg, alt);
    } catch {
      return svg;
    }
  });
}
