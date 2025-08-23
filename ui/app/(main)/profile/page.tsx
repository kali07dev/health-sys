"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { userService, type ProfileUpdateRequest } from "@/utils/userAPI"
import { Loader2 } from "lucide-react"
import { showErrorToast, showSuccessToast } from "@/lib/error-handling"

type EmployeeProfile = {
  ID: string
  FirstName: string
  LastName: string
  Department: string
  Position: string
  Role: string
  EmergencyContact: Record<string, string>
  ContactNumber: string
  OfficeLocation: string
  Email: string
}

export default function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<EmployeeProfile>({
    ID: "",
    FirstName: "",
    LastName: "",
    Department: "",
    Position: "",
    Role: "",
    EmergencyContact: {},
    ContactNumber: "",
    OfficeLocation: "",
    Email: "",
  })

  const [updateData, setUpdateData] = useState<ProfileUpdateRequest>({
    ID: "",
    FirstName: "",
    LastName: "",
    EmergencyContact: {},
    ContactNumber: "",
    Password: "",
    ConfirmPassword: "",
    UserID: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await userService.getUserProfile()
      setProfile(data)
      setUpdateData({
        ID: data.ID,
        FirstName: data.FirstName,
        LastName: data.LastName,
        EmergencyContact: data.EmergencyContact || {},
        ContactNumber: data.ContactNumber,
        Password: "",
        ConfirmPassword: "",
        UserID: data.ID,
      })
    } catch (error) {
      showErrorToast(error, "Unable to load your profile information")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (updateData.Password && updateData.Password !== updateData.ConfirmPassword) {
      showErrorToast({ code: 'PASSWORDS_MISMATCH' })
      return
    }

    setSaving(true)
    try {
      await userService.updateUserProfile(updateData)
      showSuccessToast("Profile updated successfully", "Your changes have been saved")
      // Reload profile to clear password fields
      await loadProfile()
    } catch (error) {
      showErrorToast(error, "Unable to update your profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUpdateData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUpdateData((prev) => ({
      ...prev,
      EmergencyContact: {
        ...prev.EmergencyContact,
        [name]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-red-50 min-h-screen">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-medium text-red-900">My Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-red-100">
            <h2 className="mb-6 text-xl font-medium text-red-800">Personal Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="FirstName"
                  value={updateData.FirstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="LastName"
                  value={updateData.LastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Department</label>
                <input
                  type="text"
                  value={profile.Department}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 text-gray-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Position</label>
                <input
                  type="text"
                  value={profile.Position}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 text-gray-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Role</label>
                <input
                  type="text"
                  value={profile.Role}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 text-gray-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.Email}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 text-gray-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg border border-red-100">
            <h2 className="mb-6 text-xl font-medium text-red-800">Contact Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  name="ContactNumber"
                  value={updateData.ContactNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Office Location</label>
                <input
                  type="text"
                  value={profile.OfficeLocation}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 text-gray-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg border border-red-100">
            <h2 className="mb-6 text-xl font-medium text-red-800">Emergency Contact</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={updateData.EmergencyContact?.name || ""}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  value={updateData.EmergencyContact?.relationship || ""}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-red-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={updateData.EmergencyContact?.phone || ""}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg border border-red-100">
            <h2 className="mb-6 text-xl font-medium text-red-800">Change Password</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="Password"
                  value={updateData.Password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="ConfirmPassword"
                  value={updateData.ConfirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => loadProfile()}
              className="rounded-full bg-red-100 px-6 py-3 text-red-700 font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

