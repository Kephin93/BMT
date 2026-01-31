import { ButtonHTMLAttributes, forwardRef } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "primary2"
  | "secondary"
  | "success"
  | "danger"
  | "link"
  | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  locked?: boolean;
  isFull?: boolean;
  circular?: boolean;
  square?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      isLoading = false,
      locked = false,
      isFull = false,
      circular = false,
      square = false,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-none font-medium ring-foreground ring-offset-2 ring-offset-background focus:outline-none focus-visible:ring-2 cursor-pointer";

    const cnFromVariant: Record<ButtonVariant, string> = {
      primary: "text-background bg-primary px-4 py-2 text-sm h-10",
      primary2: "text-background bg-primary2 px-4 py-2 text-sm h-10",
      secondary: "text-foreground bg-secondary px-4 py-2 text-sm h-10",
      success: "text-background bg-success px-4 py-2 text-sm h-10",
      danger: "text-white bg-danger px-4 py-2 text-sm h-10",
      link: "h-auto border-none bg-transparent px-0 py-0 text-sm text-foreground shadow-none",
      icon: "h-10 w-10 md:w-10 px-0 py-0 border-none shadow-none hover:shadow",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          cnFromVariant[variant],
          {
            "w-full md:w-auto":
              !locked && variant !== "icon" && variant !== "link",
            "w-full md:w-full":
              isFull && variant !== "icon" && variant !== "link",
            "rounded-full": circular,
            "h-10 w-10 px-0 py-0 md:w-10": square,
            "pointer-events-none opacity-50": props.disabled || isLoading,
          },
          className,
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <IconLoader2 className="mr-2 animate-spin" size={16} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
