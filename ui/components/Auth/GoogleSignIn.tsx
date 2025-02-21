// components/Auth/GoogleSignIn.tsx
"use client";
import { signIn } from "next-auth/react";

const GoogleSignIn: React.FC = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg
        className="h-5 w-5 text-gray-500"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        <path d="M12 4c2.97 0 5.46 2.04 6.46 4.9C17.46 8.04 14.97 6 12 6c-3.86 0-7 3.14-7 7s3.14 7 7 7c1.66 0 3.14-.69 4.22-1.78l2.8 2.78c-.76 1.37-2.1 2.28-3.72 2.28-2.66 0-4.8-1.98-4.8-4.5 0-2.5 1.95-4.5 4.5-4.5 1.31 0 2.42.5 3.3.92l2.8-2.78C19.96 12.04 17 14 12 14c-2.97 0-5.46-2.04-6.46-4.9C6.54 5.04 9.03 4 12 4z" />
      </svg>
      <span className="ml-2">Sign in with Google</span>
    </button>
  );
};

export default GoogleSignIn;