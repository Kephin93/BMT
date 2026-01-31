import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

type RowProps = HTMLAttributes<HTMLDivElement> & {
  gap?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "between" | "stretch";
  alignItems?: "start" | "center" | "end" | "between" | "stretch";
  locked?: boolean;
  fluid?: boolean;
};

export const Row = forwardRef<HTMLDivElement, RowProps>(
  (
    {
      gap = "md",
      align = "start",
      alignItems = "start",
      locked = false,
      fluid = false,
      className,
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
          "flex w-full",
          // { 'md:w-auto': fluid },
          { "w-auto": fluid },
          { "flex-col md:flex-row": !locked },
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

Row.displayName = "Row";
