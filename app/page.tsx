"use client";
import { AnimatedTestimonials } from "@/components/aceternity/animated-testimonials";
import { Col } from "@/components/Common/Col";
import { testimonials } from "@/constant/staticValue";

export default function Home() {
  return (
    <Col className="w-full py-24" gap="sm">
      <AnimatedTestimonials testimonials={testimonials} />
    </Col>
  );
}
