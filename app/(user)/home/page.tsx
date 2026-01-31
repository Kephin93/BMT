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
    <Col align="start" className="w-full h-full px-[10%] pb-[10%]" gap="lg">
      <div className="flex justify-center w-full py-32 font-bold text-8xl text-primary">
        Our Products
      </div>
      <ProductShowcase items={data} showAdd={true} />
      <div className="flex justify-center w-full py-32 font-bold text-8xl text-primary">
        Our Testimonies
      </div>
      <AnimatedTestimonials testimonials={testimonials} />
    </Col>
  );
}
