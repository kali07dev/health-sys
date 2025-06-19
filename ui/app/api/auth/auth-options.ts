import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

interface CustomSession extends Session {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    phone?: string | null;
  };
  token: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
          
          // Prepare the request body
          const requestBody: Record<string, string> = {
            password: credentials?.password || ''
          };
          
          if (credentials?.email) {
            requestBody.email = credentials.email;
          } else if (credentials?.phone) {
            requestBody.phone = credentials.phone;
          } else {
            throw new Error("Email or phone is required");
          }

          const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
          });

          if (!res.ok) {
            const errorData = await res.text();
            console.error('Login failed:', errorData);
            throw new Error(errorData);
          }

          const data = await res.json();
          
          if (res.ok && data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || null,
              role: data.user.role,
              token: data.token,
              expiresAt: data.expiresAt,
            };
          }
          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        
        try {
          const response = await fetch(`${BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              credential: account.id_token,
              email: profile?.email,
              name: profile?.name,
            }),
          });

          if (!response.ok) {
            console.error('Backend Google authentication failed');
            return false;
          }

          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google') {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // token.phone = user.phone || null;
        token.token = user.token;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }): Promise<CustomSession> {
      if (!session.user) {
        session.user = { id: '', email: '', role: '' };
      }
      
      const customSession: CustomSession = {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          phone: token.phone as string || null,
          role: token.role as string,
        },
        token: token.token as string,
        role: token.role as string,
      };
      
      return customSession;
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60, // 1 hour (shorter than backend)
  },
  jwt: {
    maxAge: 60 * 60, // Match session maxAge
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
};