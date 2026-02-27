import siteMetadata from "../../data/sitemetadata";
import { format } from "date-fns";

/**
 * Get MIME type based on file extension
 */
export function getMimeType(url) {
  const urlPath = url.split("?")[0].toLowerCase();
  if (urlPath.endsWith(".jpg") || urlPath.endsWith(".jpeg")) return "image/jpeg";
  if (urlPath.endsWith(".png")) return "image/png";
  if (urlPath.endsWith(".gif")) return "image/gif";
  if (urlPath.endsWith(".webp")) return "image/webp";
  if (urlPath.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg"; // default
}

/**
 * Convert relative URLs to absolute URLs in HTML content
 */
export function convertToAbsoluteUrls(htmlContent) {
  if (!htmlContent) return htmlContent;

  // Convert relative URLs in href attributes
  htmlContent = htmlContent.replace(
    /href=["'](?!["']*(?:https?:|mailto:|#|tel:))([^"']+)["']/gi,
    (match, path) => {
      const absoluteUrl = path.startsWith("/")
        ? `${siteMetadata.siteUrl}${path}`
        : `${siteMetadata.siteUrl}/${path}`;
      return `href="${absoluteUrl}"`;
    }
  );

  // Convert relative URLs in src attributes
  htmlContent = htmlContent.replace(
    /src=["'](?!["']*(?:https?:|data:))([^"']+)["']/gi,
    (match, path) => {
      const absoluteUrl = path.startsWith("/")
        ? `${siteMetadata.siteUrl}${path}`
        : `${siteMetadata.siteUrl}/${path}`;
      return `src="${absoluteUrl}"`;
    }
  );

  return htmlContent;
}

/**
 * Fix HTML issues for RSS feed validity
 */
export function sanitizeHtmlForFeed(htmlContent) {
  if (!htmlContent) return htmlContent;

  // Fix self-closing br tags (HTML5 compatible)
  htmlContent = htmlContent.replace(/<br\s*\/>/gi, "<br>");

  // Fix self-closing hr tags
  htmlContent = htmlContent.replace(/<hr\s*\/>/gi, "<hr>");

  return htmlContent;
}

export function optimizeImagesForFeed(htmlContent) {
  if (!htmlContent) return htmlContent;

  const imgRegex = /<img\s+([^>]*?)>/gi;

  return htmlContent.replace(imgRegex, (match, attributes) => {
    const srcMatch = attributes.match(/src=["']([^"']*?)["']/i);

    if (!srcMatch) return match;

    const originalSrc = srcMatch[1];

    let optimizedSrc = originalSrc;
    if (originalSrc.startsWith("/")) {
      const encodedUrl = encodeURIComponent(originalSrc);
      optimizedSrc = `${siteMetadata.siteUrl}/_next/image?url=${encodedUrl}&w=1920&q=75`;
    } else if (originalSrc.startsWith("./") || !originalSrc.includes("://")) {
      const absolutePath = originalSrc.startsWith("./")
        ? originalSrc.slice(2)
        : originalSrc;
      const encodedUrl = encodeURIComponent(`/${absolutePath}`);
      optimizedSrc = `${siteMetadata.siteUrl}/_next/image?url=${encodedUrl}&w=1920&q=75`;
    }

    const newAttributes = attributes.replace(
      /src=["']([^"']*?)["']/i,
      `src="${optimizedSrc}"`
    );

    return `<img ${newAttributes}>`;
  });
}

export function enhanceFeedContent(post) {
  let optimizedHtml = optimizeImagesForFeed(post.body.html);
  optimizedHtml = convertToAbsoluteUrls(optimizedHtml);
  optimizedHtml = sanitizeHtmlForFeed(optimizedHtml);

  return `<p>${post.description}</p><hr>${optimizedHtml}<hr><a href="${siteMetadata.siteUrl}">${siteMetadata.title}</a><p>${siteMetadata.description}</p><p>作者${siteMetadata.author}</p><p>${format(new Date(post.publishDate), "yyyy MMMM do")}发布</p>`;
}
