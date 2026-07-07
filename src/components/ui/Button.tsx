import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass =
    variant === "secondary" ? "secondary" : variant === "danger" ? "bg-[var(--danger)]" : "";

  return <button className={`app-button ${variantClass} ${className}`} {...props} />;
}
