'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '../../utils/authApi';
import Input from '../Input';
import Button from '../Button';

const SignUpForm: React.FC = () => {
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // Add confirm password field
    employeeNumber: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    role: 'employee', // Always set to "employee"
    startDate: '',
    contactNumber: '',
    officeLocation: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Convert start date to ISO format
      const formattedData = {
        ...userData,
        startDate: new Date(userData.startDate).toISOString(),
        role: 'employee', // Ensure role is always "employee"
      };

      // Remove unnecessary fields before sending to backend
      // delete formattedData.confirmPassword;

      const res = await signUp(formattedData);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Number */}
      <Input
        label="Employee Number"
        id="employeeNumber"
        type="text"
        value={userData.employeeNumber}
        onChange={(e) =>
          setUserData({ ...userData, employeeNumber: e.target.value })
        }
        required
      />

      {/* First Name */}
      <Input
        label="First Name"
        id="firstName"
        type="text"
        value={userData.firstName}
        onChange={(e) =>
          setUserData({ ...userData, firstName: e.target.value })
        }
        required
      />

      {/* Last Name */}
      <Input
        label="Last Name"
        id="lastName"
        type="text"
        value={userData.lastName}
        onChange={(e) =>
          setUserData({ ...userData, lastName: e.target.value })
        }
        required
      />

      {/* Department */}
      <Input
        label="Department"
        id="department"
        type="text"
        value={userData.department}
        onChange={(e) =>
          setUserData({ ...userData, department: e.target.value })
        }
        required
      />

      {/* Position */}
      <Input
        label="Position"
        id="position"
        type="text"
        value={userData.position}
        onChange={(e) =>
          setUserData({ ...userData, position: e.target.value })
        }
        required
      />

      {/* Email */}
      <Input
        label="Email"
        id="email"
        type="email"
        value={userData.email}
        onChange={(e) =>
          setUserData({ ...userData, email: e.target.value })
        }
        required
        autoComplete="email"
      />

      {/* Password */}
      <Input
        label="Password"
        id="password"
        type="password"
        value={userData.password}
        onChange={(e) =>
          setUserData({ ...userData, password: e.target.value })
        }
        required
        autoComplete="new-password"
      />

      {/* Confirm Password */}
      <Input
        label="Confirm Password"
        id="confirmPassword"
        type="password"
        value={userData.confirmPassword}
        onChange={(e) =>
          setUserData({ ...userData, confirmPassword: e.target.value })
        }
        required
      />

      {/* Start Date */}
      <Input
        label="Start Date"
        id="startDate"
        type="date"
        value={userData.startDate}
        onChange={(e) =>
          setUserData({ ...userData, startDate: e.target.value })
        }
        required
      />

      {/* Contact Number */}
      <Input
        label="Contact Number"
        id="contactNumber"
        type="tel"
        value={userData.contactNumber}
        onChange={(e) =>
          setUserData({ ...userData, contactNumber: e.target.value })
        }
        required
      />

      {/* Office Location */}
      <Input
        label="Office Location"
        id="officeLocation"
        type="text"
        value={userData.officeLocation}
        onChange={(e) =>
          setUserData({ ...userData, officeLocation: e.target.value })
        }
        required
      />

      {/* Error Message */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
};

export default SignUpForm;