import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        critical: "border-transparent bg-red-600 text-white shadow hover:bg-red-600/80", // Critical severity
        high: "border-transparent bg-orange-500 text-white shadow hover:bg-orange-500/80", // High severity
        medium: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80", // Medium severity
        low: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80", // Low severity
        warning: "border-transparent bg-yellow-100 text-yellow-800 shadow hover:bg-yellow-100/80", // Investigating status
        resolved: "border-transparent bg-green-100 text-green-800 shadow hover:bg-green-100/80", // Resolved status
        closed: "border-transparent bg-gray-100 text-gray-800 shadow hover:bg-gray-100/80", // Closed status
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

