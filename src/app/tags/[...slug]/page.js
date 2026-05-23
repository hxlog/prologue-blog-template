import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";
import PostsLayout from "../../blog/bloglistlayout";
import { tagCounts, sortedTags } from "../../../lib/tag-counts";
import PageTransition from "../../../components/page-transition";

export default async function Tag(props) {
  const params = await props.params;
  const slug = params?.slug?.join("/");
  const filterPosts = allPosts.filter((post) => post.tags.includes(slug));
  if (!filterPosts || filterPosts == '') {
    notFound();
  }

  const initialDisplayPosts = filterPosts.slice(0, 10)
  return (
    <PageTransition className="mx-auto">
      <PostsLayout posts={filterPosts} initialDisplayPosts={initialDisplayPosts} tagCounts={tagCounts} sortedTags={sortedTags} />
    </PageTransition>
  );
}
