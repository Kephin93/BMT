"use client";
import React, { useState } from "react";
import { Eye, EyeClosedIcon, EyeIcon } from "lucide-react";
import { Col } from "@/components/Common/Col";
import { Row } from "@/components/Common/Row";
import { Input } from "@/components/Common/Inputs";
import { Separator } from "@/components/ui/separator";
import { IconBrandLine, IconLine } from "@tabler/icons-react";
import { Button } from "../Common/Button";
import { Icon } from "../Common/Icon";

export default function LoginForm() {
  const [hidePass, setHidePass] = useState(true);
  return (
    <Row className="w-full sm:w-sm md:w-full items-stretch gap-10 md:gap-6">
      <Col>
        <Row className="font-semibold">Admin Login:</Row>
        <Row>
          <Input
            label={"Password"}
            placeholder="place"
            type={hidePass ? "password" : "text"}
            rightSection={
              <Icon
                className=" size-6"
                icon={hidePass ? EyeIcon : EyeClosedIcon}
                onClick={() => {
                  setHidePass((prev) => !prev);
                }}
              />
            }
          />
        </Row>
        <Row align="end" locked>
          <div>
            <Button className="text-base">Login</Button>
          </div>
        </Row>
      </Col>

      {/* Mobile: horizontal divider */}
      <Separator className="block sm:hidden w-full h-px" />

      {/* Desktop+: vertical divider */}
      <Separator
        orientation="vertical"
        className="hidden sm:block h-auto w-px self-stretch"
      />

      <Col>
        <Row className="font-semibold">Other Login:</Row>
        <Row className="md:px-4" align="center" locked>
          <Button className="bg-green-400 hover:bg-green-300 text-base flex gap-2 font-bold py-6">
            <IconBrandLine className="size-5 md:size-6" />
            LINE
          </Button>
        </Row>
      </Col>
    </Row>
  );
}
