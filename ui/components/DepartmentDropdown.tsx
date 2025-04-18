"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface Department {
  Id: number
  Name: string
}

interface DepartmentDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select a department",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch("https://dummyjson.com/products/categories")
        const data = await response.json()

        // Assuming the API returns an array of strings, convert them to the Department interface
        const formattedDepartments: Department[] = data.map((category: string, index: number) => ({
          Id: index + 1,
          Name: category,
        }))

        setDepartments(formattedDepartments)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching departments:", error)
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredDepartments = search
    ? departments.filter((dept) => dept.Name.toLowerCase().includes(search.toLowerCase()))
    : departments

  const handleSelect = (dept: Department) => {
    onChange(dept.Name)
    setIsOpen(false)
    setSearch(null)
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900"
          placeholder={placeholder}
          value={search || departments.find((d) => d.Name === value)?.Name || ""}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {loading ? (
            <div className="p-2 text-sm text-gray-700 text-center">Loading departments...</div>
          ) : filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => (
              <div
                key={dept.Id}
                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => handleSelect(dept)}
              >
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{dept.Name}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-700 text-center">No departments found</div>
          )}
        </div>
      )}
    </div>
  )
}

export default DepartmentDropdown
