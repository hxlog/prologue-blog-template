"use client";

import { motion } from "framer-motion";

/**
 * On-mount fade for body content. Intentionally opacity-only:
 * - `transform`, `filter`, `will-change: transform`, etc. all create a CSS
 *   containing block, which breaks `position: fixed` / `position: sticky` for
 *   descendants (e.g. the homepage's pinned search bar). Opacity does not.
 */
export default function PageTransition({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
