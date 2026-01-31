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

  console.log("data -=>", data);

  return (
    <Col align="start" className="w-full h-[100vh] px-[10%]" gap="lg">
      <ProductShowcase items={data} showAdd={true} />
    </Col>
  );
}
