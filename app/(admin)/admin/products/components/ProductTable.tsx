"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Star } from "lucide-react";
import Link from "next/link";
import AddProductDialog from "./AddProductDialog";
import { fetchProducts } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function updateRecommendation() {
  // TODO: Call the product update API here.
}

export default function ProductTable() {
  // shortcut: recommendation toggles stay local until the update API is wired.
  const [recommendations, setRecommendations] = useState<Record<string, boolean>>({});
  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });

  return (
    <section className="space-y-6 py-4" aria-labelledby="products-heading">
      <div className="flex items-center justify-between gap-4">
        <h1 id="products-heading" className="text-2xl font-semibold text-primary">
          Products
        </h1>
        <AddProductDialog />
      </div>

      {isPending ? (
        <p role="status">Loading products…</p>
      ) : isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p>Could not load products.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption className="sr-only">All products returned by the product API</TableCaption>
            <TableHeader className="[&_th]:text-center [&_th]:font-bold [&_th]:text-primary-foreground">
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead scope="col">Image</TableHead>
                <TableHead scope="col">Product</TableHead>
                <TableHead scope="col">Description</TableHead>
                <TableHead scope="col">Price</TableHead>
                <TableHead scope="col">Recommended</TableHead>
                <TableHead scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const recommended = recommendations[product.id] ?? Boolean(product.recommended);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.img?.[0] ? (
                          <img
                            src={product.img[0]}
                            alt={String(product.title)}
                            width={64}
                            height={64}
                            loading="lazy"
                            className="mx-auto size-16 rounded-md object-cover"
                          />
                        ) : (
                          <span className="block text-center text-xs">Currently 0 images for this product.</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{String(product.title)}</TableCell>
                      <TableCell className="min-w-48 whitespace-normal">
                        {String(product.subTitle)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.price} TWD
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Toggle recommendation for ${product.title}`}
                          aria-pressed={recommended}
                          onClick={() => {
                            setRecommendations((current) => ({ ...current, [product.id]: !recommended }));
                            updateRecommendation();
                          }}
                        >
                          <Star aria-hidden="true" className="text-primary" fill={recommended ? "currentColor" : "none"} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/products/${encodeURIComponent(product.id)}/edit`} aria-label={`Edit ${product.title}`}>
                            <Pencil aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
