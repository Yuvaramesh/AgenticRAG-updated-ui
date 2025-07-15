"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, Check, X, ArrowLeft } from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string; // Changed from number to string for MongoDB _id
  email: string;
  name: string;
  role: string;
  preferred_languages: string[];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "student",
    preferred_languages: [] as string[],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          "X-User-Email": session?.user?.email || "", // Mock header for backend auth
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": session?.user?.email || "",
        },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create user: ${response.statusText}`
        );
      }
      setNewUser({
        email: "",
        name: "",
        role: "student",
        preferred_languages: [],
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (user: User) => {
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": session?.user?.email || "",
          },
          body: JSON.stringify(user),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update user: ${response.statusText}`
        );
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Changed userId type to string
    setError(null);
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "X-User-Email": session?.user?.email || "",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete user: ${response.statusText}`
        );
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (status === "loading" || !session || session.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DynamicSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system with a specific role.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <Input
                placeholder="Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Preferred Languages (comma-separated, e.g., en,hi)"
                value={newUser.preferred_languages.join(",")}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    preferred_languages: e.target.value
                      .split(",")
                      .map((lang) => lang.trim())
                      .filter(Boolean),
                  })
                }
                className="md:col-span-2"
              />
              <Button onClick={handleCreateUser} className="md:col-span-1">
                <Plus className="mr-2 h-4 w-4" /> Create User
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage all users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Languages</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>
                          {editingUser?.id === user.id ? (
                            <Input
                              value={editingUser.email}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  email: e.target.value,
                                })
                              }
                              disabled // Email usually not editable
                            />
                          ) : (
                            user.email
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser?.id === user.id ? (
                            <Input
                              value={editingUser.name}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  name: e.target.value,
                                })
                              }
                            />
                          ) : (
                            user.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser?.id === user.id ? (
                            <Select
                              value={editingUser.role}
                              onValueChange={(value) =>
                                setEditingUser({ ...editingUser, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            user.role
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser?.id === user.id ? (
                            <Input
                              value={editingUser.preferred_languages.join(",")}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  preferred_languages: e.target.value
                                    .split(",")
                                    .map((lang) => lang.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          ) : (
                            user.preferred_languages.join(", ") || "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingUser?.id === user.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateUser(editingUser)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(null)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
