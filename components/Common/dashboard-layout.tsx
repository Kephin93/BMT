"use client";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar className="top-2 bg-primary text-primary-foreground" />
      {/* <div
        className="w-full h-[200px] bg-secondary text-red-500"
        style={
          {
            // backgroundColor: "rgb(var(--color-secondary))",
            // color: "rgb(var(--color-secondary-foreground))",
          }
        }
      >
        Test
      </div> */}
      <main
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] ease-in-out",
          "duration-300 bg-background"
        )}
      >
        <div className="flex-grow">{children}</div>
        {/* <Footer /> */}
      </main>
    </div>
  );
}
