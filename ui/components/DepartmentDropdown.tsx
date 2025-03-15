'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Check, ChevronDown } from 'lucide-react';

interface Department {
  ID: string;
  Name: string;
}

interface DepartmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select Department",
  disabled,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  const app_url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const BASE_URL = `${app_url}/api/v1`;
  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await axios.get(`${BASE_URL}/departments`);
        setDepartments(response.data);
      } catch (err) {
        setError('Failed to load departments. Please try again.');
        console.error('Error fetching departments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [BASE_URL]);

  // Filter departments based on search input
  const filteredDepartments = departments.filter((dept) =>
    dept.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center p-2 border rounded-lg bg-white shadow-sm ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        } focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          className="w-full bg-transparent border-none focus:outline-none text-sm"
          placeholder={placeholder}
          value={search || departments.find((d) => d.Name === value)?.Name || ''}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500 text-center">Loading departments...</div>
          ) : error ? (
            <div className="p-2 text-sm text-red-500 text-center">{error}</div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">No departments found</div>
          ) : (
            filteredDepartments.map((dept) => (
              <div
                key={dept.ID}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onChange(dept.Name);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                {value === dept.Name && <Check className="w-4 h-4 text-blue-500 mr-2" />}
                <span className="text-sm">{dept.Name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentDropdown;