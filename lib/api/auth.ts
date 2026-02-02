import { LoginPayload } from "@/app/login/type";
import { api } from "../http";

export async function userLogin(payload: LoginPayload) {
  console.log("payload -=>", payload);
  const res = await api.post("/login", payload);
  return res.data;
}
