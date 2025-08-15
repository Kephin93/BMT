import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end" | "between";
  gap?: "xs" | "sm" | "md" | "lg";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  alignItems?: "start" | "center" | "end" | "baseline" | "stretch" | "between";
};

export const Col = forwardRef<HTMLDivElement, Props>(function Col(
  {
    children,
    className,
    gap = "md",
    align = "center",
    alignItems = "center",
    ...props
  }: Props,
  ref
) {
  const gapVariants = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
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
    between: "justify-between",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col",
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
