import React, { useState, useEffect } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Department } from '@/utils/departmentAPI';
import axios from 'axios'; // Assuming you're using Axios for API calls

// Base Dropdown Props
interface BaseDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface Employee {
  ID: string;
  FirstName: string;
  LastName: string;
  EmployeeNumber: string;
  Department: string;
  Position: string;
  UserID: string;
  Role: string;
}

// Department Dropdown
interface DepartmentDropdownProps extends BaseDropdownProps {
  departments: Department[];
}

export const DepartmentDropdown = ({
  departments,
  value,
  onChange,
  placeholder = "Select Department",
  disabled,
}: DepartmentDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

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
          {filteredDepartments.map((dept) => (
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
          ))}
          {filteredDepartments.length === 0 && (
            <div className="p-2 text-sm text-gray-500 text-center">No departments found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Employee Dropdown Base
interface EmployeeDropdownProps extends BaseDropdownProps {
  employees: Employee[];
  filterRole?: string;
}

const EmployeeDropdown = ({
  employees,
  value,
  onChange,
  placeholder,
  filterRole,
  disabled,
}: EmployeeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEmployees = employees
    .filter((emp) => (filterRole ? emp.Role === filterRole : true))
    .filter((emp) =>
      `${emp.FirstName} ${emp.LastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.EmployeeNumber.toLowerCase().includes(search.toLowerCase())
    );

  const selectedEmployee = employees.find((emp) => emp.ID === value);

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
          value={search || (selectedEmployee ? `${selectedEmployee.FirstName} ${selectedEmployee.LastName}` : '')}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.ID}
              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onChange(emp.ID);
                setSearch('');
                setIsOpen(false);
              }}
            >
              {value === emp.ID && <Check className="w-4 h-4 text-blue-500 mr-2" />}
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {emp.FirstName} {emp.LastName}
                </span>
                <span className="text-xs text-gray-500">
                  {emp.EmployeeNumber} • {emp.Department}
                </span>
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="p-2 text-sm text-gray-500 text-center">No employees found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Specific Employee Dropdowns
export const InvestigatorDropdown = (props: Omit<EmployeeDropdownProps, 'placeholder' | 'filterRole'>) => (
  <EmployeeDropdown {...props} placeholder="Select Investigator" filterRole="safety_officer" />
);

export const ManagerDropdown = (props: Omit<EmployeeDropdownProps, 'placeholder' | 'filterRole'>) => (
  <EmployeeDropdown {...props} placeholder="Select Manager" filterRole="manager" />
);

// User Role Dropdown
interface RoleDropdownProps extends BaseDropdownProps {
  roles?: string[];
}

export const RoleDropdown = ({
  value,
  onChange,
  placeholder = "Select Role",
  roles = ["safety_officer", "manager", "employee"],
  disabled,
}: RoleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative w-full">
      <div
        className={`flex items-center p-2 border rounded-lg bg-white shadow-sm ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        } focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="flex-1 text-sm">{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {roles.map((role) => (
            <div
              key={role}
              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onChange(role);
                setIsOpen(false);
              }}
            >
              {value === role && <Check className="w-4 h-4 text-blue-500 mr-2" />}
              <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
const App = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Fetch Departments
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('/api/departments'); // Replace with your API endpoint
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    // Fetch Employees
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/employees'); // Replace with your API endpoint
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchDepartments();
    fetchEmployees();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Department and Employee Search</h1>

      <DepartmentDropdown
        departments={departments}
        value=""
        onChange={(dept) => console.log('Selected Department:', dept)}
      />

      <InvestigatorDropdown
        employees={employees}
        value=""
        onChange={(empId) => console.log('Selected Investigator:', empId)}
      />

      <ManagerDropdown
        employees={employees}
        value=""
        onChange={(empId) => console.log('Selected Manager:', empId)}
      />

      <RoleDropdown
        value=""
        onChange={(role) => console.log('Selected Role:', role)}
      />
    </div>
  );
};

export default App;