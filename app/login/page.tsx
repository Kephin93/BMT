"use client";

import { Col } from "@/components/Common/Col";
import { Row } from "@/components/Common/Row";
import LoginForm from "@/components/Forms/LoginForm";
import { Separator } from "@/components/ui/separator";
import React, { useRef } from "react";
import { Button } from "@/components/Common/Button";

import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperClass } from "swiper/types";
import "swiper/css";
import Login from "@/components/Forms/Login";

export default function Page() {
  const swiperRef = useRef<SwiperClass | null>(null);
  return (
    <div className="w-full md:w-lg rounded-xl md:rounded-3xl bg-white flex justify-center items-center p-4 md:py-10 md:px-8">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        spaceBetween={10}
        slidesPerView={1}
        centeredSlides={true}
        // modules={[EffectCoverflow]}
        // effect="coverflow"
        allowTouchMove={false}
        // coverflowEffect={{
        //   rotate: 50,
        //   stretch: 0,
        //   modifier: 1,
        // }}
        className={"w-full h-[80vh] md:h-[40vh]"}
      >
        <SwiperSlide>
          <Row
            className="w-full sm:w-sm md:w-full items-stretch gap-10 md:gap-6 h-full"
            locked
          >
            <Login swiperRef={swiperRef} type="user" />
          </Row>
        </SwiperSlide>
        <SwiperSlide>
          <Row
            className="w-full sm:w-sm md:w-full items-stretch gap-10 md:gap-6 h-full"
            locked
          >
            <Login swiperRef={swiperRef} type="admin" />
          </Row>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
