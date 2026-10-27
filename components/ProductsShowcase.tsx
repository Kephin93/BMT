"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { getDB } from "@/lib/firebase";
import { collection, orderBy, query } from "firebase/firestore";
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

  const q = useMemo(() => {
    return query(
      collection(db, "product"),
      // where("recommended", "==", true),
      orderBy("recommended", "desc"),
    );
  }, [db]);

  const { data: products } = useCollectionLive<Product & { id: string }>(
    ["products"],
    q,
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 items-stretch gap-4 py-10 w-full", // ← items-stretch + gap
        className,
      )}
    >
      {(products ?? []).map((item, idx) => {
        return (
          <Link
            key={item.id}
            href={`/products/${encodeURIComponent(item.id)}`}
            prefetch={false}
            className="relative group block p-2 h-full w-full focus:outline-none"
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
              <ProductCard {...item} index={idx} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
