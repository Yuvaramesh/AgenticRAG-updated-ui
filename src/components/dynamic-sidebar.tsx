"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  Upload,
  MessageCircle,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  FileText,
  Calendar,
} from "lucide-react";

export function DynamicSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user?.role;

  // Common items for all users
  const commonItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
  ];

  // Admin-specific items - Full Access
  const adminItems = [
    {
      title: "Manage Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Upload Files",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Chat Assistant",
      url: "/chat",
      icon: MessageCircle,
    },
    {
      title: "Manage Quizzes",
      url: "/teacher/quizzes",
      icon: BookOpen,
    },
    {
      title: "Publish Content",
      url: "/teacher/publish",
      icon: Calendar,
    },
    {
      title: "View Analytics",
      url: "/student/report",
      icon: BarChart3,
    },
  ];

  // Teacher-specific items - Quiz, Upload, Publish, Analytics
  const teacherItems = [
    {
      title: "Manage Quizzes",
      url: "/teacher/quizzes",
      icon: BookOpen,
    },
    {
      title: "Upload Files",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Publish Content",
      url: "/teacher/publish",
      icon: Calendar,
    },
    {
      title: "Analytics",
      url: "/student/report",
      icon: BarChart3,
    },
  ];

  // Student-specific items - Only Chat and Quiz
  const studentItems = [
    {
      title: "Chat Assistant",
      url: "/chat",
      icon: MessageCircle,
    },
    {
      title: "Take Quizzes",
      url: "/student/quizzes",
      icon: FileText,
    },
  ];

  // Build navigation items based on role
  let navigationItems = [...commonItems];

  if (role === "admin") {
    navigationItems = [...navigationItems, ...adminItems];
  } else if (role === "teacher") {
    navigationItems = [...navigationItems, ...teacherItems];
  } else if (role === "student") {
    navigationItems = [...navigationItems, ...studentItems];
  }

  return (
    <Sidebar className="bg-white text-black">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
