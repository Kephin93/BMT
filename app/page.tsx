"use client";
import { AnimatedTestimonials } from "@/components/aceternity/animated-testimonials";
import { Col } from "@/components/Common/Col";
import { Row } from "@/components/Common/Row";
import ProductCard from "@/components/ProductCard";
import { testimonials } from "@/constant/staticValue";

export default function Home() {
  const products = [
    {
      img: "/CC1.jpg",
      title: "Cheese Cake",
      recommended: true,
      subTitle: "Home-made lovely Cheese Cake",
      price: 1200,
    },
    {
      img: "/CC2.jpg",
      title: "Basque Cheese Cake",
      recommended: true,
      subTitle: "Home-made Basque Cheese Cake",
      price: 1200,
    },
    {
      img: "/BR1.jpg",
      title: "Brownies",
      recommended: true,
      subTitle: "Home-made lovely Brownies",
      price: 1200,
    },
    {
      img: "/CC1.jpg",
      title: "Cheese Cake1",
      recommended: false,
      subTitle: "Home-made lovely Cheese Cake",
      price: 1200,
    },
    {
      img: "/CC2.jpg",
      title: "Basque Cheese Cake1",
      recommended: false,
      subTitle: "Home-made Basque Cheese Cake",
      price: 1200,
    },
    {
      img: "/BR1.jpg",
      title: "Brownies1",
      recommended: false,
      subTitle: "Home-made lovely Brownies",
      price: 1200,
    },
  ];
  return (
    <Col align="start" className="w-full h-[200vh] px-[10%]" gap="lg">
      <div className="py-16 font-bold text-3xl">Our Products</div>
      <div className="p-4 grid gap-8 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 ">
        {products.map((prd, index) => (
          <ProductCard {...prd} key={`item-${index}`} />
        ))}
      </div>
      <div className="py-16 font-bold text-3xl">Our Testimonies</div>
      <AnimatedTestimonials testimonials={testimonials} />
    </Col>
  );
}
