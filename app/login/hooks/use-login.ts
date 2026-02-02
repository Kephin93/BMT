// hooks/use-login.ts
import { useMutation } from "@tanstack/react-query";
import { userLogin } from "@/lib/api/auth";
import { LoginPayload } from "../type";

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => userLogin(payload),
  });
}
