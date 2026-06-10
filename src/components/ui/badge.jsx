import * as React from "react"

function Badge({ className, variant = "default", ...props }) {
  const baseStyles = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
    secondary: "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",
    destructive: "border-transparent bg-[var(--danger)] text-[var(--danger-foreground)]",
    outline: "text-[var(--foreground)] border-[var(--border)]",
    success: "border-transparent bg-[var(--success)] text-[var(--success-foreground)]",
    warning: "border-transparent bg-[var(--warning)] text-[var(--warning-foreground)]",
    confirmed: "border-transparent bg-[var(--confirmed)] text-[var(--confirmed-foreground)]",
    outForDelivery: "border-transparent bg-[var(--out-for-delivery)] text-[var(--out-for-delivery-foreground)]",
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className || ""}`} {...props} />
  )
}

export { Badge }
