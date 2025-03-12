// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.token = user.token;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (!session.user) {
        session.user = {};
      }
      
      session.user.id = token.id;
      session.user.email = token.email;
      session.token = token.token;
      session.role = token.role;
      return session;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };