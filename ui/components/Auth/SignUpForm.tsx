'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "../../utils/authApi"
import { setToken } from "../../utils/auth"
import Input from "../Input"
import Button from "../Button"

const SignUpForm: React.FC = () => {
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { token } = await signUp(userData)
      setToken(token)
      router.push('/')
    } catch (err) {
      setError('Sign-up failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Name"
        id="name"
        type="text"
        value={userData.name}
        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
        required
        autoComplete="name"
      />
      <Input
        label="Email"
        id="email"
        type="email"
        value={userData.email}
        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        id="password"
        type="password"
        value={userData.password}
        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
        required
        autoComplete="new-password"
      />
      <div className="mb-6">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="role"
          value={userData.role}
          onChange={(e) => setUserData({ ...userData, role: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="safety_officer">Safety Officer</option>
        </select>
      </div>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  )
}

export default SignUpForm