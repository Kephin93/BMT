import { cn } from "@/lib/utils";
import { ElementType } from "react";

type IconProps = {
  icon: ElementType;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fill?: string;
  stroke?: string;
  onClick?: () => void;
  leading?: boolean; // Add leading prop to the IconProps type
};

export function Icon({
  icon: Icon,
  size = "md",
  className,
  onClick,
  leading, // Destructure leading
  // fill = 'none',
  // stroke = 'currentColor',
}: IconProps) {
  return (
    <Icon
      className={cn(
        "shrink-0",
        {
          "h-2 w-2": size === "sm",
          "h-4 w-4": size === "md",
          "h-5 w-5": size === "lg",
          "h-10 w-10": size === "xl",
          "mr-2": leading, // Conditionally apply the mr-2 class
        },
        className,
      )}
      onClick={onClick}
      // fill={fill}
      // stroke={stroke}
    />
  );
}
