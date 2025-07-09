"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageCircle, User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) router.push("/login");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2 " />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Welcome back, {session.user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-gray-600">
            Choose an action to get started with your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Upload Card */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push("/upload")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Upload Files
              </CardTitle>
              <CardDescription className="text-gray-900">
                Upload and manage your documents, images, and other files
                securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full text-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/upload");
                }}
              >
                Start Uploading
              </Button>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card
            className="hover:shadow-lg transition-shadow text-gray-900 cursor-pointer group"
            onClick={() => router.push("/chat")}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Chat Assistant
              </CardTitle>
              <CardDescription className="text-gray-900">
                Start a conversation with our AI assistant to get help and
                answers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full text-gray-900"
                onClick={() => router.push("/chat")}
              >
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
