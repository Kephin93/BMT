"use client";

import { useRef, useState, type FormEvent } from "react";
import { productSchema, type ProductValues } from "@/schemas/product";
import ProductImages, { type ProductImage } from "./ProductImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type EditableProduct = ProductValues & { id: string };

export default function ProductForm({ product }: {
  product?: EditableProduct;
}) {
  const [images, setImages] = useState<ProductImage[]>(() => product
    ? [...new Set((product.img ?? []).filter(Boolean))].map((url, index) => ({
      id: `stored-${index}`, url, name: `${product.title} — image ${index + 1}`,
    })) : []);
  const processing = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing.current) return;
    const data = new FormData(event.currentTarget);
    const parsed = productSchema.omit({ img: true }).safeParse({
      title: data.get("title"),
      subTitle: data.get("subTitle"),
      price: data.get("price") === "" ? NaN : Number(data.get("price")),
      recommended: data.get("recommended") === "on",
    });
    setError("");
    setStatus("");
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!images.length) {
      setError("Choose at least one picture.");
      return;
    }
    processing.current = true;
    setSaving(true);
    try {
      const newImages = images.filter((image) => image.file);
      if (newImages.length) {
        const { encodeLocalImage } = await import("@/lib/images/encode-webp");
        for (const image of newImages) {
          const file = image.file!;
          setStatus(`Encoding ${file.name}…`);
          const webp = await encodeLocalImage(file);
          console.log("Product image WebP sizes", {
            name: file.name,
            beforeBytes: file.size,
            afterBytes: webp.size,
            beforeKB: Number((file.size / 1024).toFixed(2)),
            afterKB: Number((webp.size / 1024).toFixed(2)),
          });
        }
      }
      setStatus(newImages.length
        ? `Prepared ${newImages.length} picture(s). Nothing uploaded or saved.`
        : "No new pictures selected. Nothing uploaded or saved.");
    } catch (error) {
      setStatus("");
      setError(error instanceof Error ? error.message : "Pictures could not be encoded. Please try again.");
    } finally {
      processing.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ProductImages images={images} disabled={saving} onChange={(next) => { setImages(next); setStatus(""); setError(""); }} />
      <fieldset disabled={saving} className="min-w-0 space-y-4 border-t pt-6">
        <legend className="sr-only">{product ? "Edit product details" : "New product details"}</legend>
        <h2 className="text-lg font-semibold">Product details</h2>
        <div className="space-y-2">
          <Label htmlFor="product-title">Product name</Label>
          <Input id="product-title" name="title" defaultValue={product?.title} required maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Textarea id="product-description" name="subTitle" defaultValue={product?.subTitle} maxLength={5000} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">Price (TWD)</Label>
          <Input id="product-price" name="price" defaultValue={product?.price} type="number" min={0} step="0.01" required />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="product-recommended" name="recommended" defaultChecked={product?.recommended ?? false} />
          <Label htmlFor="product-recommended">Recommended</Label>
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {status && <p role="status">{status}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Encoding…" : "Prepare images"}</Button>
      </div>
    </form>
  );
}

