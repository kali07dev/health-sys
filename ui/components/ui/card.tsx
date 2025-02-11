import type React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  color?: "red" | "blue" | "white"
}

export function Card({ title, color = "white", children, className, ...props }: CardProps) {
  const colorClasses = {
    red: "bg-red-500 text-white",
    blue: "bg-blue-800 text-white",
    white: "bg-white text-gray-800",
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${className}`} {...props}>
      <div className={`px-6 py-4 ${colorClasses[color]}`}>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-6 bg-white">{children}</div>
    </div>
  )
}

