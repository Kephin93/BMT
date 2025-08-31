"use client";
import React from "react";
import { Col } from "./Common/Col";
import {
  IconShoppingBag,
  IconStars,
  IconStarsFilled,
} from "@tabler/icons-react";
import { Row } from "./Common/Row";
import { formatPrice } from "@/lib/helper";
import { Button } from "./ui/button";

export default function ProductCard({
  img,
  title,
  recommended,
  subTitle,
  price,
}: {
  img: string;
  title: string;
  subTitle: string;
  recommended: boolean;
  price: number;
}) {
  return (
    <div
      className={`w-full bg-secondary rounded-lg shadow-2xl drop-shadow-2xl inset-10 text-secondary-foreground`}
    >
      <Col className="p-2 lg:p-4">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md border border-primary">
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>

        <Row align="between" alignItems="center">
          <div className="font-bold text-2xl">{title}</div>
          {recommended ? (
            <IconStarsFilled className="size-6" />
          ) : (
            <IconStars className="size-6" />
          )}
        </Row>
        <Row>{subTitle}</Row>
        <Row className="font-bold text-xl" align="between">
          {formatPrice(price, "TW")}
          <Button className=" cursor-pointer">
            <IconShoppingBag className="size-6" />
          </Button>
        </Row>
      </Col>
    </div>
  );
}
