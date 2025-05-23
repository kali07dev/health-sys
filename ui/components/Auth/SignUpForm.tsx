"use client";
import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { signUp } from "../../utils/authApi";
import Input from "../Input";
import Button from "../Button";
import LocationDropdown from "@/components/locationDropDown";
import DepartmentDropdown from "@/components/DepartmentDropdown";
import axios from "axios";

const SignUpForm: React.FC = () => {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    confirmPassword: "", // Add confirm password field
    // employeeNumber: '',
    firstName: "",
    lastName: "",
    department: "",
    position: "",
    role: "employee", // Always set to "employee"
    startDate: "",
    contactNumber: "",
    officeLocation: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate company email domain
      if (!userData.email.endsWith("@huaxincem.com")) {
        throw new Error("Your Email is not allowed to create an account on the system, use a company email");
      }

      // Convert start date to ISO format
      const formattedData = {
        ...userData,
        startDate: new Date(userData.startDate).toISOString(),
        role: "employee",
      };

      // Call the sign-up API
      await signUp(formattedData);
      router.push("/auth/login"); // Redirect to home page after successful sign-up
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // Handle backend error response
        const backendError = err.response?.data?.error;
        if (backendError) {
          setError(backendError);
        } else {
          setError(`Request failed: ${err.response?.status} ${err.response?.statusText}`);
        }
      } else if (err instanceof Error) {
        // Handle frontend validation errors
        setError(err.message);
      } else {
        setError("Sign-up failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Number */}
      {/* <Input
        label="Employee Number"
        // id="employeeNumber"
        type="text"
        // value={userData.employeeNumber}
        onChange={(e) =>
          // setUserData({ ...userData, employeeNumber: e.target.value })
        }
        required
      /> */}

      {/* First Name */}
      <Input
        label={t('firstName')}
        id="firstName"
        type="text"
        value={userData.firstName}
        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
        required
      />

      {/* Last Name */}
      <Input
        label={t('lastName')}
        id="lastName"
        type="text"
        value={userData.lastName}
        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
        required
      />

      {/* Department */}
      <div className="space-y-2">
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          {t('department')}
        </label>
        <DepartmentDropdown
          value={userData.department}
          onChange={(value) => setUserData({ ...userData, department: value })}
          placeholder={t('selectDepartment')}
        />
      </div>

      {/* Position */}
      <Input
        label={t('position')}
        id="position"
        type="text"
        value={userData.position}
        onChange={(e) => setUserData({ ...userData, position: e.target.value })}
        required
      />

      {/* Email */}
      <Input
        label={t('email')}
        id="email"
        type="email"
        value={userData.email}
        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
        required
        autoComplete="email"
      />

      {/* Password */}
      <Input
        label={t('password')}
        id="password"
        type="password"
        value={userData.password}
        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
        required
        autoComplete="new-password"
      />

      {/* Confirm Password */}
      <Input
        label={t('confirmPassword')}
        id="ConfirmPassword"
        type="password"
        value={userData.confirmPassword}
        onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
        required
      />

      {/* Start Date */}
      <Input
        label={t('startDate')}
        id="startDate"
        type="date"
        value={userData.startDate}
        onChange={(e) => setUserData({ ...userData, startDate: e.target.value })}
        required
      />

      {/* Contact Number */}
      <Input
        label={t('contactNumber')}
        id="contactNumber"
        type="tel"
        value={userData.contactNumber}
        onChange={(e) => setUserData({ ...userData, contactNumber: e.target.value })}
        required
      />

      {/* Office Location */}
      <div className="space-y-2">
        <label htmlFor="officeLocation" className="block text-sm font-medium text-gray-700">
          {t('officeLocation')}
        </label>
        <LocationDropdown
          id="officeLocation"
          name="officeLocation"
          value={userData.officeLocation}
          onChange={(e) => setUserData({ ...userData, officeLocation: e.target.value })}
          required
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('signingUp') : t('signUp')}
      </Button>
    </form>
  );
};

export default SignUpForm;