import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

type ColProps = HTMLAttributes<HTMLDivElement> & {
  gap?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "between" | "stretch";
  alignItems?: "start" | "center" | "end" | "between" | "stretch";
  fluid?: boolean;
};

export const Col = forwardRef<HTMLDivElement, ColProps>(
  (
    {
      gap = "md",
      align = "start",
      alignItems = "start",
      className,
      fluid = false,
      children,
      ...props
    },
    ref
  ) => {
    const cnFromGap = {
      sm: "gap-1",
      md: "gap-2",
      lg: "gap-4",
      xl: "gap-6",
    };

    const cnFromAlign = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      stretch: "justify-stretch",
    };

    const cnFromAlignItems = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      between: "items-between",
      stretch: "items-stretch",
    };

    return (
      <div
        className={cn(
          "flex w-full flex-col",
          // { 'md:w-auto': fluid },
          { "w-auto": fluid },
          cnFromGap[gap],
          cnFromAlign[align],
          cnFromAlignItems[alignItems],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Col.displayName = "Col";
