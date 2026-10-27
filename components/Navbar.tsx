"use client";

import CustomNavbar from "./Common/CustomNavbar";

export default function Navbar({ className }: { className?: string }) {
  return (
    <CustomNavbar
      className={className}
      menus={[
        { label: "Home", href: "/home" },
        { label: "Products", href: "/products" },
        { label: "Contact Us", href: "/contact" },
      ]}
    />
  );
}
