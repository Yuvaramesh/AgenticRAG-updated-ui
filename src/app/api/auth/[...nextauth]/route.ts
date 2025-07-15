import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        );

        const user = await res.json();

        // ✅ Safer check
        if (res.ok && user && !user.error) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } else {
          throw new Error(user?.error || "Invalid credentials");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers (Google, GitHub)
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const backendResponse = await fetch(
            `${process.env.NEXT_PUBLIC_FLASK_API_URL}/oauth-sync-user`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image, // Pass profile image if available
              }),
            }
          );

          if (backendResponse.ok) {
            const syncedUser = await backendResponse.json();
            user.id = syncedUser.id; // Assign MongoDB _id (as string)
            user.role = syncedUser.role;
            user.preferred_languages = syncedUser.preferred_languages;
            console.log("OAuth user synced with backend:", syncedUser);
            return true;
          } else {
            console.error(
              "Failed to sync OAuth user with backend:",
              backendResponse.statusText
            );
            return false; // Prevent sign-in if backend sync fails
          }
        } catch (error) {
          console.error("Error syncing OAuth user with backend:", error);
          return false; // Prevent sign-in on error
        }
      }
      // For Credentials provider, the `authorize` function already handles backend authentication
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      if (token.preferred_languages) {
        session.user.preferred_languages = token.preferred_languages;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.preferred_languages = (user as any).preferred_languages;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
