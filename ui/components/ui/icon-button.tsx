import type React from "react"
import type { LucideIcon } from "lucide-react"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  color?: "red" | "blue" | "gray"
}

export function IconButton({ icon: Icon, color = "gray", className, ...props }: IconButtonProps) {
  const colorClasses = {
    red: "text-red-500 hover:bg-red-50",
    blue: "text-blue-800 hover:bg-blue-50",
    gray: "text-gray-500 hover:bg-gray-50",
  }

  return (
    <button
      className={`p-2 rounded-full ${colorClasses[color]} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}

