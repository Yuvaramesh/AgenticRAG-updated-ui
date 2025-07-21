"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Upload,
  MessageCircle,
  Calendar,
  BarChart3,
} from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
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

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 bg-white items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 text-black" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="ml-auto text-black"
          >
            Sign Out
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </header>

        <main className="flex-1 text-black py-8 bg-white px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {session.user?.name || session.user?.email}!
            </h2>
            <p className="text-gray-600">
              Choose an action to get started with your workspace.
            </p>
          </div>

          {/* Admin Dashboard - Full Access */}
          {session.user?.role === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/admin/users")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Manage Users
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Create, edit, and manage user accounts.
                  </p>
                  <Button onClick={() => router.push("/admin/users")}>
                    View Users
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/upload")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Files
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Upload and manage documents, images, and files.
                  </p>
                  <Button onClick={() => router.push("/upload")}>
                    Start Uploading
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/chat")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chat Assistant
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Start a conversation with our AI assistant.
                  </p>
                  <Button onClick={() => router.push("/chat")}>
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/teacher/quizzes")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Manage Quizzes
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Create, edit, and manage all quizzes.
                  </p>
                  <Button onClick={() => router.push("/teacher/quizzes")}>
                    View Quizzes
                  </Button>
                </CardContent>
              </Card>

              {/* <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/teacher/publish")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Publish Content
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Manage quiz and activity publishing.
                  </p>
                  <Button onClick={() => router.push("/teacher/publish")}>
                    Publish Content
                  </Button>
                </CardContent>
              </Card> */}

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/student/report")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    View Analytics
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    View all student reports and analytics.
                  </p>
                  <Button onClick={() => router.push("/student/report")}>
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Teacher Dashboard - Limited Access */}
          {session.user?.role === "teacher" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/teacher/quizzes")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Manage Quizzes
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Create, edit, and manage your quizzes.
                  </p>
                  <Button onClick={() => router.push("/teacher/quizzes")}>
                    View Quizzes
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/upload")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Files
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Upload and manage your course materials.
                  </p>
                  <Button onClick={() => router.push("/upload")}>
                    Start Uploading
                  </Button>
                </CardContent>
              </Card>

              {/* <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/teacher/publish")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Publish Content
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Manage quiz and activity publishing.
                  </p>
                  <Button onClick={() => router.push("/teacher/publish")}>
                    Publish Content
                  </Button>
                </CardContent>
              </Card> */}

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/student/report")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analytics
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    View student performance analytics.
                  </p>
                  <Button onClick={() => router.push("/student/report")}>
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Dashboard - Most Limited Access */}
          {session.user?.role === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/chat")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chat Assistant
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Get help with your studies from our AI assistant.
                  </p>
                  <Button onClick={() => router.push("/chat")}>
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/student/quizzes")}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Take Quizzes
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Access published quizzes and track your status.
                  </p>
                  <Button onClick={() => router.push("/student/quizzes")}>
                    View Quizzes
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
