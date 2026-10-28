import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/server/products";
import ProductForm from "../../components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <Link href="/admin/products" className="inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">
        Back to products
      </Link>
      <h1 className="text-2xl font-semibold text-primary">Edit product</h1>
      <ProductForm key={product.id} product={{
        id: product.id, title: product.title, subTitle: product.subTitle,
        price: product.price, img: product.img,
        recommended: product.recommended,
      }} />
    </div>
  );
}
