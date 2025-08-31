"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import ProductCard from "./ProductCard";

type Item = {
  link?: string;
  title: string;
  img: string;
  recommended: boolean;
  subTitle: string;
  price: number;
};

export function ProductShowcase({
  items,
  className,
}: {
  items: Item[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-10",
        className
      )}
    >
      {items.map((item, idx) => {
        const key = `${item.title}-${idx}`;
        return (
          <a
            key={key}
            href={item.link ?? "#"}
            className="relative group block p-2 h-full w-full focus:outline-none"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(idx)}
            onBlur={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  layoutId="hoverBackground"
                  className="pointer-events-none absolute inset-0 block h-full w-full rounded-2xl bg-primary/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>

            {/* Keep the card above the animated background */}
            <div className="relative z-10">
              <ProductCard {...item} />
            </div>
          </a>
        );
      })}
    </div>
  );
}
