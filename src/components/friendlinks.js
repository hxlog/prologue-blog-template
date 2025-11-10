"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Comments from "./comments";

// Small, fast, deterministic PRNG (mulberry32) — pure function, safe to use during render
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function FriendLinks({ friends }) {
  const [seed, setSeed] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => setSeed(Math.floor(Math.random() * 2 ** 31)), 0);
    return () => clearTimeout(id);
  }, []);

  const shuffledFriends = useMemo(() => {
    const arr = [...(friends || [])];
    if (seed === null) return arr;
    const rnd = mulberry32(seed);
    return arr
      .map((f) => ({ f, key: Math.floor(rnd() * 2 ** 31) }))
      .sort((a, b) => a.key - b.key)
      .map((x) => x.f);
  }, [friends, seed]);

  return (
    <div className="container mx-auto p-4 py-12">
      <h2 className="text-2xl font-bold pb-8 text-center">
        友情链接 Friend Links
      </h2>
      <p className="text-center text-zinc-500 dark:text-zinc-400 pb-12">
        但愿十年后的某天，这些链接仍存活，与各位作者共勉。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shuffledFriends.map((friend) => (
          <Link
            key={friend.name}
            href={friend.blog_url}
            target="_blank"
            className="p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-zinc-200 dark:border-zinc-700  dark:shadow-zinc-700  px-6"
          >
            <Image
              src={friend.avatar}
              height={80}
              width={80}
              alt={friend.name}
              className="w-20 h-20 object-cover rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-center">{friend.name}</h3>
            <p className="text-sm pt-1 text-zinc-500 dark:text-zinc-300 text-center mb-4">
              {friend.description}
            </p>
          </Link>
        ))}
      </div>
      <p className="py-8 mt-4 text-center text-zinc-500 prose-sm dark:text-zinc-400">
        如有意交换友链，请
        <Link
          className="underline"
          href="https://github.com/hxlog/prologue.dev/edit/master/data/links.yaml"
        >
          在Github上编辑links.yaml提PR
        </Link>
        或在评论区告知：）
      </p>
      <Comments />
    </div>
  );
}
