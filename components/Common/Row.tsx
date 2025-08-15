import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end" | "between";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  alignItems?: "start" | "center" | "end" | "baseline" | "stretch";
  isMobile?: boolean;
};

export const Row = forwardRef<HTMLDivElement, Props>(function Row(
  {
    children,
    className,
    align = "start",
    gap = "md",
    alignItems = "center",
    isMobile = true,
    ...props
  }: Props,
  ref
) {
  const gapVariants = {
    none: "gap-0",
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-4",
    xl: "gap-6",
  };

  const alignVariants = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  const alignItemsVariants = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    baseline: "items-baseline",
    stretch: "items-stretch",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full",
        { "flex-col md:flex-row": isMobile },
        gapVariants[gap],
        alignVariants[align],
        alignItemsVariants[alignItems],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
