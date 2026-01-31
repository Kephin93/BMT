"use client";

import React, {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { Col } from "./Col";
import { cn } from "@/lib/utils";
import { IconLoader2 } from "@tabler/icons-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  error?: string;
  required?: boolean;
  icon?: ReactNode;
  isLoading?: boolean;
  triggerOnly?: boolean;
  formatValue?: (value: any) => string;
  inputClassName?: string;
  rightSection?: ReactNode;
};
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  props,
  forwardedRef
) {
  // --------------------------
  // Destructure props
  // --------------------------
  const {
    label,
    disabled,
    className,
    error,
    required,
    icon,
    isLoading,
    triggerOnly,
    readOnly,
    formatValue,
    value,
    type = "text",
    inputClassName,
    rightSection,
    step,
    min,
    max,
    onChange,
    ...rest
  } = props;

  // --------------------------
  // State / refs
  // --------------------------
  const isReadOnly = triggerOnly || readOnly;
  const localRef = useRef<HTMLInputElement>(null);

  // Forward ref
  useEffect(() => {
    if (!forwardedRef) return;
    if (typeof forwardedRef === "function") forwardedRef(localRef.current);
    else
      (
        forwardedRef as React.MutableRefObject<HTMLInputElement | null>
      ).current = localRef.current;
  }, [forwardedRef]);

  // --------------------------
  // Computed values
  // --------------------------

  const baseInputClasses =
    "h-10 w-full rounded-full border border-none bg-gray-100 px-3 py-2 text-sm outline-none placeholder:text-muted";

  return (
    <Col className={className}>
      {label && typeof label === "string" ? (
        <label className="text-sm font-semibold">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      ) : (
        label
      )}

      {/* Input container */}
      <div className="relative w-full">
        {/* Icon */}
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {icon}
          </span>
        )}

        {/* Input */}
        <input
          ref={localRef}
          type={type}
          disabled={disabled}
          readOnly={isReadOnly}
          value={value}
          className={cn(
            baseInputClasses,
            !triggerOnly
              ? "ring-foreground ring-offset-background ring-offset-2 "
              : "",
            triggerOnly ? "shadow hover:shadow-dark cursor-pointer" : "",
            icon ? "pl-9" : "",
            rightSection || isLoading ? "pr-9" : "",
            {
              "border-danger": error,
              "pointer-events-none opacity-50": disabled,
            },
            inputClassName
          )}
          onChange={onChange}
          {...rest}
        />

        {/* Loading indicator */}
        {isLoading && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <IconLoader2 size={16} className="text-muted animate-spin" />
          </span>
        )}

        {/* Right section */}
        {rightSection && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            {rightSection}
          </span>
        )}
      </div>
    </Col>
  );
});

Input.displayName = "Input";

export { Input };
