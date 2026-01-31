"use client";

import { Col } from "@/components/Common/Col";
import { Row } from "@/components/Common/Row";
import LoginForm from "@/components/Forms/Login";
import { Separator } from "@/components/ui/separator";
import React from "react";

export default function page() {
  return (
    <div className="w-full md:w-2xl rounded-xl md:rounded-3xl bg-white flex justify-center items-center p-4 md:py-10 md:px-8">
      {/* <Row className="w-full sm:w-sm md:w-md items-stretch"> */}
      <LoginForm />
      {/* </Row> */}
    </div>
  );
}
