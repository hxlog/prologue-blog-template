import Image from 'next/image';

export function OptimizedHTMLRenderer({ htmlContent }) {
  const processHTMLWithImages = (html) => {
    const parts = [];
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = imgRegex.exec(html)) !== null) {
      const fullMatch = match[0];
      const attributes = match[1];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const beforeContent = html.substring(lastIndex, matchIndex);
        parts.push(
          <div
            key={`html-${keyIndex++}`}
            dangerouslySetInnerHTML={{ __html: beforeContent }}
          />
        );
      }

      const srcMatch = attributes.match(/src=["']([^"']*?)["']/i);
      const altMatch = attributes.match(/alt=["']([^"']*?)["']/i);
      const titleMatch = attributes.match(/title=["']([^"']*?)["']/i);
      const classMatch = attributes.match(/class=["']([^"']*?)["']/i);

      if (srcMatch) {
        const src = srcMatch[1];
        const alt = altMatch ? altMatch[1] : '';
        const title = titleMatch ? titleMatch[1] : '';
        const className = classMatch ? classMatch[1] : '';

        parts.push(
          <Image
            key={`img-${keyIndex++}`}
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            title={title}
            className={`drop-shadow-xs rounded-sm ${className}`.trim()}
            style={{ height: 'auto', width: '100%' }}
          />
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < html.length) {
      const remainingContent = html.substring(lastIndex);
      parts.push(
        <div
          key={`html-${keyIndex++}`}
          dangerouslySetInnerHTML={{ __html: remainingContent }}
        />
      );
    }

    if (parts.length === 0) {
      return (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      );
    }

    return parts;
  };

  const processedContent = processHTMLWithImages(htmlContent);

  return <>{processedContent}</>;
}
