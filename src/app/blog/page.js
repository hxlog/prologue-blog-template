import { allPosts } from "contentlayer/generated"
import { compareDesc } from "date-fns";
import PostsLayout from "./bloglistlayout"
import siteMetadata from "../../../data/sitemetadata"
import { tagCounts, sortedTags } from "../../lib/tag-counts"
import PageTransition from "../../components/page-transition"

export default function Blog() 
{
  const posts = allPosts.sort((a, b) => {
    return compareDesc(new Date(a.publishDate), new Date(b.publishDate))
  })

  const pagination = {
    currentPage: 1,
    totalPages: Math.ceil(posts.length / 10),
  }
  const initialDisplayPosts = posts.slice(0, 10)

  return (
    <PageTransition>
      <PostsLayout posts={posts} pagination={pagination} initialDisplayPosts={initialDisplayPosts} tagCounts={tagCounts} sortedTags={sortedTags} />
    </PageTransition>
  )
}

export const metadata = {
  title: `Blog - ${siteMetadata.publishName}`,
  description: "All posts here! 所有文章在这里！",
  openGraph: {
    title: `Blog - ${siteMetadata.publishName}`,
    description: "All posts here! 所有文章在这里！",
    url: `${siteMetadata.siteUrl}/blog`,
    images: [siteMetadata.cover],
    authors: [siteMetadata.author],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog - ${siteMetadata.publishName}`,
    description: "All posts here! 所有文章在这里！",
    images: [siteMetadata.cover],
  },
  locale: siteMetadata.language,
  type: "website",
};
