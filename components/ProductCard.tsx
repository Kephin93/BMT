"use client";
import React from "react";
import { Col } from "./Common/Col";
import { IconShoppingBag, IconStar, IconStarFilled } from "@tabler/icons-react";
import { Row } from "./Common/Row";
import { formatPrice } from "@/lib/helper";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export default function ProductCard({
  img,
  title,
  recommended,
  subTitle,
  price,
  showAdd = false,
  onClick,
  className,
}: {
  img: string;
  title: string;
  subTitle: string;
  recommended: boolean;
  price: number;
  showAdd?: boolean;
  onClick?: () => void;
  className?: string; // NEW
}) {
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col overflow-hidden rounded-2xl bg-secondary text-secondary-foreground shadow-2xl drop-shadow-2xl hover:-translate-y-2 transition-all",
        className,
      )}
    >
      {/* Image: fixed aspect so all cards start with same height */}
      <div className="relative w-full aspect-[4/3] overflow-hidden border border-primary/70 rounded-t-2xl">
        <img
          src={img}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        {recommended ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 md:gap-2 rounded-full bg-primary/90 px-2 md:px-4 py-1 text-[11px] md:text-lg font-medium text-primary-foreground">
            <IconStarFilled className="size-3 md:size-4 text-amber-400" />{" "}
            Recommended
          </span>
        ) : null}
      </div>

      {/* Content: grows and keeps consistent space for text */}
      <Col className="flex-1 p-4 lg:p-6">
        <Row align="between" alignItems="center" className="gap-2">
          {/* Reserve title height to avoid wrapping pushing card taller */}
          <div className="font-bold text-xl md:text-2xl leading-snug line-clamp-1 min-h-[1.75rem] cursor-default">
            {title}
          </div>
          {/* {recommended ? (
            <IconStarFilled className="size-4 shrink-0 opacity-80" />
          ) : (
            <IconStar className="size-4 shrink-0 opacity-60" />
          )} */}
        </Row>

        {/* Reserve subtitle space to 2 lines max */}
        <Row className="mt-1 text-sm md:text-lg text-muted-foreground line-clamp-2 min-h-[2.5rem] cursor-default">
          {subTitle}
        </Row>

        {/* Pin price/button to bottom so all cards align at baseline */}
        <Row className="mt-auto pt-3" align="between" alignItems="center">
          <div className="font-bold text-base md:text-lg">
            {formatPrice(price, "TW")}
          </div>
          {showAdd && (
            <Button
              onClick={onClick}
              className="cursor-pointer"
              size="icon"
              variant="default"
            >
              <IconShoppingBag className="size-5" />
            </Button>
          )}
        </Row>
      </Col>
    </div>
  );
}
