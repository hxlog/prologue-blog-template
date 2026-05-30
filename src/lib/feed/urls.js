import siteMetadata from "../../../data/sitemetadata";

const SITE = String(siteMetadata.siteUrl || "").replace(/\/+$/, "");

/** Absolute site origin without a trailing slash. */
export function siteUrl() {
  return SITE;
}

/**
 * Turn a relative path into an absolute URL.
 * Leaves already-absolute, protocol-relative, data:, mailto:, tel: and
 * in-page anchors untouched.
 */
export function absolutize(path) {
  if (!path) return path;
  const value = String(path).trim();
  if (/^(https?:|mailto:|tel:|data:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("#")) return value;
  return value.startsWith("/") ? `${SITE}${value}` : `${SITE}/${value}`;
}

/** Canonical, permanent URL for a post. Used as both id and link. */
export function postUrl(slug) {
  const value = String(slug || "");
  return `${SITE}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** Dynamic OG image endpoint with a properly encoded title. */
export function ogImageUrl(title) {
  return `${SITE}/og?title=${encodeURIComponent(title || "")}`;
}

/** Resolve a post cover image, falling back to the OG image generator. */
export function coverImageUrl(post) {
  const image = String(post.image || "").trim();
  if (!image) return ogImageUrl(post.title);
  return absolutize(image);
}
