"use client";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className=" w-full overflow-hidden" />
      <main
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] ease-in-out",
          "duration-300 bg-background ",
        )}
      >
        <div className="flex-grow h-screen w-full bg-[url(/BG.png)] bg-cover bg-center">
          <div className="h-screen px-4 w-full bg-white/60 flex items-center justify-center">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
