"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import ProductCard from "./ProductCard";
import { getDB } from "@/lib/firebase";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useCollectionLive } from "@/hooks/use-firestore";
import { Product } from "@/interfaces";
import { BaseProductType } from "@/types";

export function ProductShowcase({
  items,
  className,
  showAdd,
}: {
  items: BaseProductType[];
  className?: string;
  showAdd: boolean;
}) {
  const db = getDB();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const q = useMemo(() => {
    return query(
      collection(db, "product"),
      // where("recommended", "==", true),
      orderBy("recommended", "desc"),
    );
  }, [db]);

  const { data: todos, isLoading } = useCollectionLive<Product>(
    ["products"],
    q,
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 items-stretch gap-4 py-10 w-full", // ← items-stretch + gap
        className,
      )}
    >
      {(todos ?? []).map((item, idx) => {
        const key = `${item.title}-${idx}`;
        return (
          <a
            key={key}
            href={item?.link ?? undefined}
            className="relative group block p-2 h-full w-full focus:outline-none"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(idx)}
            onBlur={() => setHoveredIndex(null)}
          >
            {/* <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  layoutId="hoverBackground"
                  className="pointer-events-none absolute inset-0 block h-full w-full rounded-2xl bg-primary/80 -translate-y-2"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15 },
                  }}
                />
              )}
            </AnimatePresence> */}

            {/* Make the content fill the grid cell */}
            <div className="relative z-10 h-full">
              {/* if ProductCard accepts className, pass h-full down */}
              <ProductCard {...item} />
            </div>
          </a>
        );
      })}
    </div>
  );
}
