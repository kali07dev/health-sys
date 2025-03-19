// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { userService, EmployeeUpdateData } from '@/utils/userAPI';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<EmployeeUpdateData>({
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    contactNumber: '',
    officeLocation: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getUserProfile();
      setProfile(data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateUserProfile(profile);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setProfile((prev: EmployeeUpdateData) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setProfile((prev: EmployeeUpdateData) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-medium text-gray-900">My Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-medium text-gray-900">Personal Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Position</label>
                <input
                  type="text"
                  name="position"
                  value={profile.position}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>
          </div>
  
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-medium text-gray-900">Contact Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={profile.contactNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Office Location</label>
                <input
                  type="text"
                  name="officeLocation"
                  value={profile.officeLocation}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
  
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-medium text-gray-900">Emergency Contact</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input
                  type="text"
                  name="emergency.name"
                  value={profile.emergencyContact.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Relationship</label>
                <input
                  type="text"
                  name="emergency.relationship"
                  value={profile.emergencyContact.relationship}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="emergency.phone"
                  value={profile.emergencyContact.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
  
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => loadProfile()}
              className="rounded-full bg-gray-200 px-6 py-3 text-gray-700 font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}