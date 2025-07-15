import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      preferred_languages?: string[];
      id?: string; // Changed from number to string for MongoDB _id
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    preferred_languages?: string[];
    id?: string; // Changed from number to string for MongoDB _id
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    preferred_languages?: string[];
    id?: string; // Changed from number to string for MongoDB _id
  }
}
