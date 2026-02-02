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
import { useLogin } from "@/app/login/hooks/use-login";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Login({
  swiperRef,
  type = "user",
}: {
  swiperRef: any;
  type: "user" | "admin";
}) {
  const [hidePass, setHidePass] = useState(true);
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const router = useRouter();

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const username = "admin";
    loginMutation.mutate(
      {
        username,
        password,
      },
      {
        onSuccess: (data) => {
          // queryClient.invalidateQueries({ queryKey: ["me"] });
          router.push("/admin");
        },
        onError: (err: any) => {
          console.error(err);
        },
      },
    );
  }
  if (type == "user") {
    return (
      <Col>
        <Row className="font-semibold" locked>
          User Login:
        </Row>
        <Col className="h-full" align="center" alignItems="center">
          <Row className="md:px-4" align="center" locked fluid>
            <Button className="bg-green-400 hover:bg-green-300 text-base flex gap-2 font-bold py-6">
              Continue with LINE
              <IconBrandLine className="size-5 md:size-6" />
            </Button>
          </Row>
        </Col>
        <Row locked align="end" alignItems="center">
          or, login as
          <Button
            variant="link"
            onClick={() => swiperRef.current?.slideTo(1)}
            className="text-blue-500"
          >
            Admin
          </Button>
        </Row>
      </Col>
    );
  }

  return (
    <Col>
      <Row className="font-semibold" locked>
        Admin Login:
      </Row>
      <form onSubmit={handleSubmit} className="h-full w-full">
        <Col className="h-full" align="center" alignItems="center">
          <Row className="md:px-4 w-[80%]" align="center" locked>
            <Input
              label={"Password"}
              placeholder="Enter Password"
              type={hidePass ? "password" : "text"}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
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
          {loginMutation.isError && (
            <Row locked align="center" className="text-red-500 text-sm mt-2">
              Invalid password
            </Row>
          )}
          <Row align="center" locked>
            <div>
              <Button className="text-base" type="submit">
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </Row>
        </Col>
      </form>
      <Row locked align="end" alignItems="center">
        or, go back as
        <Button
          variant="link"
          onClick={() => swiperRef.current?.slideTo(0)}
          className="text-blue-500"
        >
          User
        </Button>
      </Row>
    </Col>
  );
}
