import { api } from "@/lib/http";
import { BaseProductType, InputProductType } from "@/types";

// export type Product = { id: string; title: string; price: number };

export async function fetchProducts() {
  const res = await api.get<{ data: BaseProductType[] }>("/products");
  return res.data.data;
}

export async function createProduct(payload: Omit<InputProductType, "id">) {
  const res = await api.post<{ data: { id: string } }>("/products", payload);
  return res.data.data;
}

export async function updateProduct(id: string, payload: InputProductType) {
  const res = await api.patch<{ data: { id: string } }>(`/products/${encodeURIComponent(id)}`, payload);
  return res.data.data;
}
