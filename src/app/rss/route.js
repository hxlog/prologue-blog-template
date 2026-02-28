import { Feed } from "feed";
import siteMetadata from "../../../data/sitemetadata";
import { allPosts } from "contentlayer/generated";
import { compareDesc } from "date-fns";
import { enhanceFeedContent } from "../../components/feed-optimizer";

export async function GET() {
  const feed = new Feed({
    title: siteMetadata.title,
    description: siteMetadata.description,
    id: siteMetadata.siteUrl,
    link: siteMetadata.siteUrl,
    favicon: `${siteMetadata.siteUrl}/static/favicons/favicon.png`,
    language: siteMetadata.language,
    copyright: "CC BY-NC-SA 4.0",
    updated: new Date(),
    image: `${siteMetadata.siteUrl}/static/favicons/avatar.png`,
    generator: "Feed",
    feedLinks: {
      rss: `${siteMetadata.siteUrl}/rss`,
      json: `${siteMetadata.siteUrl}/jsonfeed`,
      atom: `${siteMetadata.siteUrl}/atomfeed`,
    },
    author: {
      name: "槐序",
      email: "hello@prologue.dev",
      link: `${siteMetadata.siteUrl}/about`,
    },
  });
  const posts = allPosts.sort((a, b) => {
    return compareDesc(new Date(a.publishDate), new Date(b.publishDate));
  });
  posts
    .filter((post) => post.draft === false)
    .forEach((post) => {
      const imageUrl = post.image
        ? `${siteMetadata.siteUrl}${post.image.trim()}`
        : `${siteMetadata.siteUrl}/og?title=${encodeURIComponent(post.title)}`;

      feed.addItem({
        title: post.title,
        description: post.description,
        content: enhanceFeedContent(post),
        author: {
          name: "槐序",
          email: "hello@prologue.dev",
          link: `${siteMetadata.siteUrl}/about`,
        },
        id: `${siteMetadata.siteUrl}${post.slug}`,
        link: `${siteMetadata.siteUrl}${post.slug}`,
        date: new Date(post.publishDate),
        image: imageUrl,
      });
    });

  const rssFeed = feed.rss2().trim();

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=0",
    },
  });
}
