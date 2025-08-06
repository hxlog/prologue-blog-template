import siteMetadata from "../../data/sitemetadata";
import { format } from "date-fns";

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
  const optimizedHtml = optimizeImagesForFeed(post.body.html);

  return `<p>${post.description}</p> <hr> ${optimizedHtml} <hr> <a href=${siteMetadata.siteUrl}>${siteMetadata.title}</a> <p>${siteMetadata.description}</p>  <p>作者${siteMetadata.author}</p> <p>${format(new Date(post.publishDate), "yyyy MMMM do")}发布</p>`;
}
