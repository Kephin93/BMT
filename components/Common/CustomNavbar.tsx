"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HoveredLink,
  Menu,
  MenuItem,
} from "@/components/aceternity/navbar-menu";
import { cn } from "@/lib/utils";

export type menuType =
  | {
      label: string;
      desc?: string;
      href: string;
      submenu?: never;
    }
  | {
      label: string;
      desc?: string;
      href?: never;
      submenu: {
        label: string;
        href: string;
      }[];
    };

interface AdminNavbarProps {
  menus: menuType[];
  className?: string;
}

export default function CustomNavbar({ menus, className }: AdminNavbarProps) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "fixed inset-x-2 top-10 z-50 mx-auto text-sm max-w-2xl rounded-3xl border-2 border-primary bg-background/80 backdrop-blur-sm sm:rounded-full",
        className,
      )}
    >
      <Menu setActive={setActive}>
        {menus.map((menu) => {
          if ("submenu" in menu) {
            return (
              <MenuItem
                key={menu.label}
                setActive={setActive}
                active={active}
                item={menu.label}
              >
                <div className="flex flex-col text-sm">
                  {menu?.submenu?.map((sub) => (
                    <HoveredLink key={sub.href} href={sub.href}>
                      {sub.label}
                    </HoveredLink>
                  ))}
                </div>
              </MenuItem>
            );
          }

          return (
            <Link
              key={menu.label}
              href={menu.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 text-sm text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-primary"
            >
              {menu.label}
            </Link>
          );
        })}
      </Menu>
    </div>
  );
}
