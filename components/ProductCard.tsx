"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export default function ProductCard({
  img,
  title,
  className,
  index = 0,
}: {
  img: string;
  title: string;
  className?: string; // NEW
  index?: number;
}) {
  return (
    <motion.div
      className={cn(
        "group/card w-full h-full motion-reduce:!transform-none motion-reduce:!opacity-100",
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.08, 0.24),
        ease: "easeOut",
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-[#fffaf4] text-primary shadow-sm transition-transform duration-300 ease-out group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background motion-safe:group-hover/card:-translate-y-1 motion-safe:group-focus-within/card:-translate-y-1 motion-safe:group-focus-visible:-translate-y-1">
        {/* Image: fixed aspect so all cards start with same height */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={img}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.03] motion-safe:group-focus-within/card:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]"
            loading="lazy"
          />
        </div>

        {/* Content: grows and keeps consistent space for text */}
        <div className="flex flex-1 items-center justify-center p-3 text-center">
          {/* Keep long names within two lines. */}
          <div className="line-clamp-2 font-serif text-lg font-normal leading-6 tracking-tight">
            {title}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
