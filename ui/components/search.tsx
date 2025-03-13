"use client"
import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { searchEmployees } from "@/api/employees"
import { Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface Employee {
  ID: string
  FirstName: string
  LastName: string
  EmployeeNumber: string
  Department: string
  Position: string
  UserID: string
  Role: string
}

interface SearchEmployeeProps {
  onSelect: (employee: Employee) => void
}

export const SearchEmployee: React.FC<SearchEmployeeProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const {
    data: employees,
    isLoading,
    
  } = useQuery({
    queryKey: ["employees", value],
    queryFn: () => searchEmployees(value),
    enabled: value.length > 2,
  })

  const handleSelect = useCallback(
    (employee: Employee) => {
      setValue(`${employee.FirstName} ${employee.LastName}`)
      setOpen(false)
      onSelect(employee)
    },
    [onSelect],
  )

  // Debug logging
  useEffect(() => {
    if (employees) {
      console.log('Employees data:', employees)
      console.log('Is array:', Array.isArray(employees))
    }
  }, [employees])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value || "Search employees..."}
          <Loader2 className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${isLoading ? "animate-spin" : "hidden"}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search employees..." value={value} onValueChange={setValue} />
          <CommandList>
            {!employees || employees.length === 0 ? (
              <CommandEmpty>No employees found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {Array.isArray(employees) && employees.map((employee: Employee) => (
                  <CommandItem key={employee.ID} onSelect={() => handleSelect(employee)}>
                    <div>
                      <div>{`${employee.FirstName} ${employee.LastName}`}</div>
                      <div className="text-sm text-gray-500">{`${employee.EmployeeNumber} - ${employee.Department}`}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}