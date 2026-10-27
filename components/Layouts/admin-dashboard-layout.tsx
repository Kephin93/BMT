"use client";
import { cn } from "@/lib/utils";
import Navbar from "../Navbar";
import AdminNavbar from "@/components/Admin/AdminNavbar";
import CustomNavbar from "../Common/CustomNavbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({ children }: LayoutProps) {
  const menus = [
    {
      label: "Products",
      href: "/admin/products",
      desc: "Page for Products",
    },
    {
      label: "Orders",
      desc: "order page",
      submenu: [
        { label: "Ongoing", href: "/admin/products" },
        { label: "History", href: "/admin/products" },
      ],
    },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <div className=" w-full h-48 overflow-hidden bg-[url(/adminHeroBG.jpg)] bg-cover" />
      <CustomNavbar menus={menus} />
      <main
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] ease-in-out",
          "duration-300 bg-background",
        )}
      >
        <div className="flex-grow flex justify-center">
          <div className="w-full max-w-[90vw] md:max-w-[70vw] bg-white p-2 md:p-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
