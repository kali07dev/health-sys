import React from 'react';

// Define the type for the props
interface LocationDropdownProps {
  id: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  required = false,
}) => {
  // List of locations
  const locations = ['Balaka', 'Lunzu', 'Makata'];

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="" disabled>
        Select a location
      </option>
      {locations.map((location) => (
        <option key={location} value={location}>
          {location}
        </option>
      ))}
    </select>
  );
};

export default LocationDropdown;