"use client";
import { AnimatedTestimonials } from "@/components/aceternity/animated-testimonials";
import { Col } from "@/components/Common/Col";
import { ProductShowcase } from "@/components/ProductsShowcase";
import { testimonials } from "@/constant/staticValue";
import { fetchProducts } from "@/lib/api/products";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 30_000, // 30s: prevents refetch spam
  });

  return (
    <Col align="start" className="mx-auto h-full w-full min-w-0 px-4 pb-12 sm:px-6 lg:px-12 lg:pb-24" gap="lg">
      <h1 className="w-full py-8 text-center text-2xl font-bold leading-tight text-primary sm:py-12 sm:text-3xl lg:text-4xl">
        Our Products
      </h1>
      <ProductShowcase items={data} showAdd={true} className="mx-auto lg:w-[70vw] lg:max-w-full" />
      <h2 className="w-full py-8 text-center text-2xl font-bold leading-tight text-primary sm:py-12 sm:text-3xl lg:text-4xl">
        Our Testimonies
      </h2>
      <AnimatedTestimonials testimonials={testimonials} />
    </Col>
  );
}
