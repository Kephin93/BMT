import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import LoginLayout from "@/components/Layouts/login-layout";
import { QueryClientProvider } from "@tanstack/react-query";
import Providers from "@/components/Layouts/query-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BMT-Login",
  description: "Bite Me Tender - Login",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // console.log("Firebase App:", app);
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased`}>
        <Providers>
          <LoginLayout>{children}</LoginLayout>
        </Providers>
      </body>
    </html>
  );
}
