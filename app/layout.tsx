import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import app from "@/firebase/clientApp";
import DashboardLayout from "@/components/Common/dashboard-layout";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BMT",
  description: "Bite Me Tender",
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
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
