"use client";
import { AnimatedTestimonials } from "@/components/aceternity/animated-testimonials";
import { Col } from "@/components/Common/Col";
import { testimonials } from "@/constant/staticValue";

export default function Home() {
  return (
    <Col align="start" className="w-full h-[200vh]" gap="sm">
      <div className=" w-full h-48 overflow-hidden bg-[url(/banner.jpg)] bg-cover" />
      <AnimatedTestimonials testimonials={testimonials} />
    </Col>
  );
}
