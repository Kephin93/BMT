import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Layouts/query-provider";
import AdminDashboardLayout from "@/components/Layouts/admin-dashboard-layout";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BMT-A",
  description: "Bite Me Tender - Admin",
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
          <AdminDashboardLayout>{children}</AdminDashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
