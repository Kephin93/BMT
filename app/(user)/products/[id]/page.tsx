import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/helper";
import { getProduct } from "@/lib/server/products";
import ProductGallery from "@/components/ProductGallery";
import ProductOrderForm from "@/components/Forms/ProductOrderForm";
import { getTaipeiDate } from "@/lib/pickup";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-[1248px] px-4 py-6 sm:px-6 md:py-14">
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to products
      </Link>
      <article className="mt-7 grid items-start gap-8 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <ProductGallery
          key={product.id}
          img={product.img}
          images={product.images}
          title={product.title}
        />
        <div className="min-w-0 md:pt-2">
          <h1 className="break-words font-serif text-3xl font-normal leading-snug text-primary md:text-[32px]">
            {product.title}
          </h1>
          <p className="mt-4 whitespace-pre-line break-words border-t border-primary/10 pt-5 text-sm font-normal leading-7 text-primary/80">
            {product.subTitle}
          </p>
          {/* <div className="mt-7 border-t border-primary/10 pt-5">
            <p className="text-xl font-normal tabular-nums text-primary">
              {formatPrice(product.price, "TW")}
            </p>
            {product.recommended && (
              <p className="mt-2 text-xs font-normal text-primary/75">House favorite</p>
            )}
          </div> */}
          <ProductOrderForm
            key={product.id}
            product={{
              id: product.id,
              title: product.title,
              img: product.img,
              price: product.price,
            }}
            today={getTaipeiDate()}
          />
        </div>
      </article>
    </div>
  );
}
