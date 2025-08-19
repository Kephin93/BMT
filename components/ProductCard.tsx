"use client";
import React from "react";
import { Col } from "./Common/Col";
import { IconStars, IconStarsFilled } from "@tabler/icons-react";
import { Row } from "./Common/Row";
import { formatPrice } from "@/lib/helper";

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
      className={`w-full bg-secondary rounded-lg shadow-2xl text-secondary-foreground`}
    >
      <Col className="p-2 lg:p-4">
        <img src={img} className="w-full aspect-video" />
        <Row align="between" alignItems="center">
          <div className="font-bold text-2xl">{title}</div>
          {recommended ? (
            <IconStarsFilled className="size-6" />
          ) : (
            <IconStars className="size-6" />
          )}
        </Row>
        <Row>{subTitle}</Row>
        <Row className="font-bold text-xl">{formatPrice(price, "TW")}</Row>
      </Col>
    </div>
  );
}
