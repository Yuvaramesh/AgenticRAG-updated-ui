"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BackgroundPaths from "@/components/ui/backgroundpaths";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // ✅ still correct
import { FaGoogle } from "react-icons/fa";
import Google from "next-auth/providers/google";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <BackgroundPaths title="Welcome to Agentic RAG">
        <Card className="w-full max-w-md bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 border-2 border-pink-300 ">
          <CardHeader className="text-center text-gray-900">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to Agentic RAG
            </CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 ">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 border-2 border-pink-300 text-gray-900 font-medium"
              onClick={() => handleSignIn("google")}
              disabled={isLoading === "google"}
            >
              {isLoading === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaGoogle className="mr-2 text-2xl text-blue-600" />
              )}
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </BackgroundPaths>
    </div>
  );
}
