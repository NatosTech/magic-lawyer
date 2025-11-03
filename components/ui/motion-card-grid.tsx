"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { containerVariants, cardVariants } from "./motion-presets";

interface MotionCardGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function MotionCardGrid({
  children,
  className = "",
  columns = 4,
}: MotionCardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <motion.div
      className={`grid ${gridCols[columns]} ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={cardVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

