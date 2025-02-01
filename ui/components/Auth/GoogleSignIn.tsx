'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin } from '@react-oauth/google'
import { googleLogin } from '../../utils/authApi'
import { setToken } from '../../utils/auth'

const GoogleSignIn: React.FC = () => {
  const router = useRouter()

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const { token } = await googleLogin(credentialResponse.credential)
      setToken(token)
      router.push('/')
    } catch (err) {
      console.error('Google login failed:', err)
    }
  }

  const handleError = () => {
    console.error('Google login failed')
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="100%"
      />
    </div>
  )
}

export default GoogleSignIn