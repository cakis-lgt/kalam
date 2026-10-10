"use client";

import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const AuthField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="mb-3.5">
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-[12.5px] font-semibold text-ink-secondary"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`w-full rounded-[10px] border bg-white px-[13px] py-[11px] text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            error ? "border-error" : "border-border-light"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

AuthField.displayName = "AuthField";
