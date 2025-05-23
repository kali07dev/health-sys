import React, { useState, useCallback } from 'react';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';

export interface Employee {
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
  onSelect: (employee: Employee) => void;
}

export const SearchEmployee: React.FC<SearchEmployeeProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const searchEmployees = useCallback(async (query: string) => {
    if (query.length < 1) return;
    
    setIsLoading(true);
    try {
      // const response = await fetch(`http://localhost:8000/api/v1/employees/search?query=${encodeURIComponent(query)}`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/employees/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error searching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 0) {
      searchEmployees(query);
    } else {
      setEmployees([]);
    }
  };

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsOpen(false);
    onSelect(employee);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span className="text-sm text-gray-700">
          {selectedEmployee 
            ? `${selectedEmployee.FirstName} ${selectedEmployee.LastName} (${selectedEmployee.EmployeeNumber})`
            : 'Search employees...'}
        </span>
        <div className="flex items-center">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type at least 3 characters..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 text-sm text-black bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {employees.length === 0 && searchQuery.length >= 3 && !isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500">No employees found</div>
            )}
            
            {employees.map((employee) => (
              <button
                key={employee.ID}
                type="button"
                onClick={() => handleSelect(employee)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">
                    {`${employee.FirstName} ${employee.LastName}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {`${employee.EmployeeNumber} • ${employee.Department} • ${employee.Position}`}
                  </span>
                </div>
                {selectedEmployee?.ID === employee.ID && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
            
            {searchQuery.length < 3 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                Type at least 3 characters to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};