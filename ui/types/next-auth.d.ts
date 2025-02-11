// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string | null;
      email?: string | null;
      name?: string | null;
    };
    role?: string;
    token?: string;
  }

  interface User {
    id: string;
    email: string;
    role: string;
    token?: string;
  }
}