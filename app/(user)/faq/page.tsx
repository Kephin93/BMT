import type { Metadata } from "next";
import Link from "next/link";
import { faqs } from "@/constant/faq";

export const metadata: Metadata = {
  title: "FAQ | Bite Me Tender",
  description:
    "Questions about homemade cake pre-orders, LINE confirmations, pickup, Taipei delivery requests, bank transfers, order changes, and refunds.",
};

export default function FAQPage() {
  return (
    <div className="w-full bg-[#fffdf9] text-primary">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-6 md:py-20">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em]">A little cake talk</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-[0.14em]">FAQ</h1>
          <p className="mt-5 text-sm leading-7 text-primary/80">
            Homemade cakes, made for your sweet moments.
            <br />
            Here is what to know before you pre-order.
          </p>
        </header>

        <section aria-label="Frequently asked questions" className="mt-10 overflow-hidden rounded-3xl border border-primary/10 bg-background/50 sm:mt-14">
          <div className="border-b border-primary/10 bg-muted/60 px-5 py-4 sm:px-7">
            <p className="font-medium">Bite Me Tender</p>
            <p className="mt-1 text-xs text-primary/75">Your pre-order questions, answered</p>
          </div>

          <dl className="space-y-9 px-4 py-7 sm:px-7 sm:py-9">
            {faqs.map(({ id, question, answer }) => (
              <div key={id} id={id} className="flex scroll-mt-28 flex-col gap-3">
                <dt className="max-w-[90%] self-end rounded-2xl rounded-br-sm bg-primary px-5 py-4 text-sm leading-7 text-primary-foreground sm:max-w-[80%]">
                  <span className="mb-1 block text-xs font-semibold">Q · You</span>
                  {question}
                </dt>
                <dd className="max-w-[90%] self-start rounded-2xl rounded-bl-sm border border-primary/10 bg-white px-5 py-4 text-sm leading-7 sm:max-w-[85%]">
                  <span className="mb-1 block text-xs font-semibold">A · Bite Me Tender</span>
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-8 text-center text-sm leading-7 text-primary/80">
          Ready for something sweet?{" "}
          <Link href="/products" className="rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Explore our cakes
          </Link>
        </p>
      </div>
    </div>
  );
}
