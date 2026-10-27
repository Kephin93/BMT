import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | Bite Me Tender",
  description: "Contact information for Bite Me Tender.",
};

const contact = {
  orders: "hello@bmt.example",
  business: "partnerships@bmt.example",
  instagram: "@bmt.demo",
  hours: "Monday–Friday, 09:00–18:00 (Taipei time)",
};

export default function ContactPage() {
  return (
    <div className="w-full bg-[#fffdf9] text-primary">
      <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <header>
          <h1 className="text-2xl font-semibold tracking-[0.14em]">CONTACT US</h1>
          <p className="mt-6 text-xl font-normal md:text-[22px]">
            聯絡我們 <span aria-hidden="true" className="mx-2">|</span> Contact Us
          </p>
          <p className="mt-5 text-sm leading-7 text-primary/80">
            A little sweetness, a conversation away.
            <br />
            We would love to hear from you.
          </p>
          <p className="mt-4 text-xs leading-6 text-primary/75">
            Sample contact information for preview only. These channels are not active yet.
          </p>
        </header>

        <section aria-labelledby="order-enquiries" className="mt-14 md:mt-20">
          <h2 id="order-enquiries" className="text-lg font-normal">Order enquiries</h2>
          <p className="mt-5 text-sm leading-7 text-primary/80">
            For questions about our products or your order, contact our customer care team.
          </p>
          <p className="mt-3 break-words text-sm leading-7">{contact.orders}</p>
          <p className="mt-3 text-sm leading-7 text-primary/80">
            Instagram <span className="ml-1 text-primary">{contact.instagram}</span>
          </p>
        </section>

        <section aria-labelledby="business-enquiries" className="mt-12 md:mt-16">
          <h2 id="business-enquiries" className="text-lg font-normal">Business collaborations</h2>
          <p className="mt-5 text-sm leading-7 text-primary/80">
            For gifting, events, or working together, get in touch with our team.
          </p>
          <p className="mt-3 break-words text-sm leading-7">{contact.business}</p>
        </section>

        <section aria-labelledby="service-hours" className="mt-12">
          <h2 id="service-hours" className="text-base font-normal">Customer service hours</h2>
          <p className="mt-4 text-sm leading-7 text-primary/80">{contact.hours}</p>
          <p className="mt-1 text-sm leading-7 text-primary/80">
            Closed on weekends and public holidays.
          </p>
        </section>
      </div>

      <footer className="border-t border-primary/10 bg-muted px-6 py-8">
        <nav aria-label="Contact page footer" className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm sm:gap-x-16 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
          <Link href="/home" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Home</Link>
          <Link href="/products" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Products</Link>
          <Link href="/contact" aria-current="page" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}
