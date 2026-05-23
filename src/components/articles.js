"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import moment from "moment";

const CASCADE_PER_ROW = 0.12;
const CASCADE_INTRA = 0.025;
const CASCADE_DURATION = 0.55;
const CASCADE_EASE = [0.22, 1, 0.36, 1];

function cascadeDelay(newOffset) {
  const row = Math.floor(newOffset / 2);
  const intra = (newOffset % 2) * CASCADE_INTRA;
  return row * CASCADE_PER_ROW + intra;
}

function cascadeTotalMs(count) {
  if (count <= 0) return 0;
  const lastRow = Math.max(0, Math.ceil(count / 2) - 1);
  return (lastRow * CASCADE_PER_ROW + CASCADE_DURATION) * 1000;
}

export default function HomePage({ articles, mostCommonTag }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [tabIndex, setTabIndex] = useState(0);

  const tabRefs = useRef([]);
  const [tabWidths, setTabWidths] = useState([]);
  const [tabPosition, setTabPosition] = useState(0);

  const prevVisibleCount = useRef(8);
  const firstNewCardRef = useRef(null);
  const searchWrapRef = useRef(null);

  useEffect(() => {
    if (tabIndex !== 2) {
      const t = setTimeout(() => {
        setSearchQuery("");
        setDebouncedQuery("");
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [tabIndex]);

  useEffect(() => {
    if (tabRefs.current.length > 0) {
      const raf = requestAnimationFrame(() => {
        const widths = tabRefs.current.map((el) => el.offsetWidth);
        setTabWidths(widths);
        setTabPosition(tabRefs.current[tabIndex]?.offsetLeft || 0);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [tabIndex]);

  useEffect(() => {
    if (tabIndex !== 2 || !searchWrapRef.current) return;
    const raf = requestAnimationFrame(() => {
      const node = searchWrapRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const navRem = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--nav-height"
        )
      );
      const navPx = Number.isFinite(navRem) ? navRem * 16 : 64;
      window.scrollTo({
        top: rect.top + window.pageYOffset - navPx - 8,
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [tabIndex]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 120);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const results = articles.filter((article) => {
      if (article.draft) return false;
      return (
        article.title.toLowerCase().includes(lower) ||
        article.description.toLowerCase().includes(lower) ||
        article.slug.toLowerCase().includes(lower) ||
        (article.tags || []).some((tag) => tag.toLowerCase().includes(lower))
      );
    });
    setSearchResults(results);
  }, [debouncedQuery, articles]);

  const featuredArticles = useMemo(
    () => articles.filter((article) => article.featured && !article.draft),
    [articles]
  );

  useLayoutEffect(() => {
    if (visibleCount === prevVisibleCount.current) return;
    const newCount = visibleCount - prevVisibleCount.current;
    const node = firstNewCardRef.current;
    if (node) {
      const totalMs = cascadeTotalMs(newCount);
      const timer = setTimeout(() => {
        const top =
          node.getBoundingClientRect().top +
          window.pageYOffset -
          window.innerHeight * 0.386;
        window.scrollTo({ top, behavior: "smooth" });
      }, totalMs);
      prevVisibleCount.current = visibleCount;
      return () => clearTimeout(timer);
    }
    prevVisibleCount.current = visibleCount;
  }, [visibleCount]);

  const filteredArticles = (filter) => {
    const featuredSlugs = featuredArticles.map((article) => article.slug);

    let baseArticles;
    if (filter === "search") {
      baseArticles = debouncedQuery.trim() ? searchResults : [];
    } else if (filter === "latest") {
      baseArticles = articles.filter(
        (article) => !featuredSlugs.includes(article.slug)
      );
    } else if (filter === "tag") {
      baseArticles = articles.filter(
        (article) =>
          article.tags.includes(mostCommonTag) &&
          !featuredSlugs.includes(article.slug)
      );
    } else {
      baseArticles = articles;
    }
    return baseArticles.slice(0, visibleCount);
  };

  const firstNewIndex = prevVisibleCount.current;

  const renderArticleCard = (article, index, mode) => {
    const isStatic = mode === "static";
    const isNew = mode === "loadmore" && index >= firstNewIndex;
    const isSearchResult = mode === "search";
    const isFirstNew = isNew && index === firstNewIndex;

    let initial = false;
    let transition = { duration: 0.18, ease: "easeOut" };

    if (isStatic) {
      initial = false;
      transition = { duration: 0 };
    } else if (isNew) {
      const offset = index - firstNewIndex;
      initial = { opacity: 0, y: 16 };
      transition = {
        duration: CASCADE_DURATION,
        delay: cascadeDelay(offset),
        ease: CASCADE_EASE,
      };
    } else if (isSearchResult) {
      initial = { opacity: 0, y: 12 };
      transition = {
        duration: CASCADE_DURATION,
        delay: cascadeDelay(index),
        ease: CASCADE_EASE,
      };
    }

    return (
      <motion.div
        key={article.slug}
        ref={isFirstNew ? firstNewCardRef : undefined}
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="py-4 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xs hover:shadow-md dark:shadow-zinc-700 transition px-6"
      >
        <Link href={article.slug}>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 py-1">
            {article.title}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-7">
            {article.description.length > 100
              ? article.description.substring(0, 100) + "..."
              : article.description}
          </p>
        </Link>
        <div className="py-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          <time>{moment(article.publishDate).format("LL")}</time>
          <span className="pl-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                className="py-4 hover:text-zinc-800 dark:hover:text-zinc-200"
                href={`/tags/${tag}`}
              >
                <span className="hover:bg-zinc-100 rounded-md px-1 py-1 transition duration-500 dark:hover:bg-zinc-800">
                  {tag}
                </span>
              </Link>
            ))}
          </span>
        </div>
      </motion.div>
    );
  };

  const renderArticles = (filter) => {
    const list = filteredArticles(filter).filter(
      (post) => post.draft === false
    );
    return list.map((article, index) =>
      renderArticleCard(article, index, "loadmore")
    );
  };

  const renderFeaturedArticles = () =>
    featuredArticles.map((article, index) =>
      renderArticleCard(article, index, "static")
    );

  const renderSearchArticles = (list) =>
    list.map((article, index) => renderArticleCard(article, index, "search"));

  const loadMoreButton = (filter) =>
    filteredArticles(filter).length >= visibleCount && (
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setVisibleCount((prev) => prev + 8)}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
        >
          加载更多  
        </button>
      </div>
    );

  const tabButtonClass = ({ selected }) =>
    `relative z-10 px-2 py-2 text-sm font-medium rounded-md ${
      selected
        ? "text-zinc-900 dark:text-white"
        : "text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-100"
    }`;

  const hasQuery = debouncedQuery.trim().length > 0;
  const searchList = filteredArticles("search").filter(
    (post) => post.draft === false
  );

  return (
    <div className="w-full max-w-4xl">
      {/* Featured Section - Standalone */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4 border-b dark:border-zinc-800 border-zinc-200 pb-2">
          Featured
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderFeaturedArticles()}
        </div>
      </div>

      {/* Main TabGroup for Latest, Tag, and Search */}
      <TabGroup selectedIndex={tabIndex} onChange={setTabIndex}>
        <div>
          <TabList className="flex border-b dark:border-zinc-800 border-zinc-200 pb-2 justify-between sticky top-0">
            {["Latest", mostCommonTag, "Search"].map((label, index) => (
              <Tab
                key={index}
                as="button"
                ref={(el) => (tabRefs.current[index] = el)}
                className={tabButtonClass}
                onClick={label === "Search" ? () => setIsSearching(true) : null}
              >
                {label}
              </Tab>
            ))}
            <div
              className="absolute bottom-0 h-1 bg-zinc-400 dark:bg-zinc-600 transition-all duration-300"
              style={{
                width: tabWidths[tabIndex] ? tabWidths[tabIndex] : "auto",
                transform: `translateX(${tabPosition}px)`,
              }}
            ></div>
          </TabList>
        </div>
        <TabPanels className="mt-6">
          {["latest", "tag"].map((filter, index) => (
            <TabPanel key={index} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderArticles(filter)}
              </div>
              {loadMoreButton(filter)}
            </TabPanel>
          ))}
          <TabPanel className="space-y-4 min-h-screen">
            {isSearching && (
              <div
                ref={searchWrapRef}
                className="sticky z-30 -mx-2 px-2 py-2 bg-white dark:bg-black"
                style={{ top: "calc(var(--nav-height) + 0.5rem)" }}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
                  />
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            )}
            <div className="min-h-[60vh] relative">
              <AnimatePresence mode="wait" initial={false}>
                {hasQuery && searchList.length > 0 && (
                  <motion.div
                    key={"results:" + debouncedQuery + ":" + searchList.length}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {renderSearchArticles(searchList)}
                  </motion.div>
                )}
                {hasQuery && searchList.length === 0 && (
                  <motion.p
                    key={"empty:" + debouncedQuery}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 py-6 text-center"
                  >
                    No results for &ldquo;{debouncedQuery}&rdquo;
                  </motion.p>
                )}
                {!hasQuery && (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center"
                  >
                    Start typing to search articles.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {hasQuery && loadMoreButton("search")}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
