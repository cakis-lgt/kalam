"use client";

import { forwardRef } from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
};

export const AuthSelectField = forwardRef<HTMLSelectElement, Props>(
  (
    { label, error, id, className = "", options, placeholder, ...props },
    ref,
  ) => {
    const fieldId = id ?? props.name;

    return (
      <div className="mb-3.5">
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-[12.5px] font-semibold text-ink-secondary"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          className={`w-full rounded-[10px] border bg-white px-[13px] py-[11px] text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${
            error ? "border-error" : "border-border-light"
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

AuthSelectField.displayName = "AuthSelectField";
