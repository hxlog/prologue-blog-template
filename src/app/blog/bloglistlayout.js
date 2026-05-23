"use client";

import PostCard from "../../components/postcard";
import Pagination from "../../components/pagination";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { lazy } from "react";

const POSTS_PER_PAGE = 10;
const SearchBar = lazy(() => import("../../components/searchbar"));

const PostsLayout = ({
  pagination,
  initialDisplayPosts,
  posts,
  tagCounts = {},
  sortedTags = [],
}) => {
  const displayPosts =
    initialDisplayPosts && initialDisplayPosts.length > 0
      ? initialDisplayPosts
      : posts || [];
  const pathname = usePathname();
  return (
    <>
      <div className="max-w-6xl relative">
        <div className="py-16">
          <SearchBar />
        </div>
        <div className="lg:grid lg:grid-cols-6">
          <div className="max-w-lg mx-auto lg:col-span-1">
            <div className="sticky top-0 py-4 lg:pt-14">
              {sortedTags.map((tag) => (
                <Link
                  key={tag}
                  className={`inline-flex lg:block rounded-lg px-3 py-2 font-normal hover:bg-zinc-50 hover:text-cyan-500 dark:hover:bg-slate-800 transition trasnform duration-400 select-none ${
                    pathname == "/tags/" + tag
                      ? "text-cyan-500 "
                      : "text-zinc-500 dark:text-zinc-300"
                  }`}
                  href={`/tags/${tag}`}
                >
                  {tag}({tagCounts[tag]})
                </Link>
              ))}
            </div>
          </div>
          <div className="col-span-5">
            <div className="max-w-3xl mx-auto pt-8 md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
              {displayPosts
                .filter((post) => post.draft === false)
                .slice(0, POSTS_PER_PAGE)
                .map((post) => (
                  <article key={post._id || post.slug} className="">
                    <PostCard
                      title={post.title}
                      slug={post.slug}
                      description={post.description}
                      publishDate={post.publishDate}
                      readingTime={post.readingTime.text}
                      tags={post.tags}
                    />
                  </article>
                ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default PostsLayout;
