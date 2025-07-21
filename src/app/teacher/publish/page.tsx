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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Play,
  Pause,
  Calendar,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Section {
  id: string;
  name: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  section_id: string;
  is_enabled: boolean;
  questions?: any[];
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  section_id: string;
  is_published: boolean;
  activity_type: string;
  content: string;
  due_date?: string;
  created_at: string;
}

interface PublishSchedule {
  quiz_id?: string;
  activity_id?: string;
  publish_date: string;
  unpublish_date?: string;
  target_sections: string[];
}

export default function TeacherPublishPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishSchedule, setPublishSchedule] = useState<PublishSchedule>({
    publish_date: "",
    target_sections: [],
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "quiz" | "activity";
    item: Quiz | Activity;
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (
      !session ||
      (session.user?.role !== "teacher" && session.user?.role !== "admin")
    ) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sections
      const sectionsResponse = await fetch(
        "http://localhost:5000/api/sections",
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!sectionsResponse.ok) throw new Error("Failed to fetch sections");
      const sectionsData = await sectionsResponse.json();
      setSections(sectionsData);

      // Fetch quizzes
      const quizzesResponse = await fetch("http://localhost:5000/api/quizzes", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });
      if (!quizzesResponse.ok) throw new Error("Failed to fetch quizzes");
      const quizzesData = await quizzesResponse.json();
      setQuizzes(quizzesData);

      // Fetch activities
      const activitiesResponse = await fetch(
        "http://localhost:5000/api/activities",
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!activitiesResponse.ok) throw new Error("Failed to fetch activities");
      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (
    type: "quiz" | "activity",
    id: string,
    currentStatus: boolean
  ) => {
    setError(null);
    try {
      const endpoint =
        type === "quiz"
          ? `http://localhost:5000/api/quizzes/${id}/${
              currentStatus ? "disable" : "enable"
            }`
          : `http://localhost:5000/api/activities/${id}/${
              currentStatus ? "unpublish" : "publish"
            }`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "X-User-Email": session?.user?.email || "" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSchedulePublish = async () => {
    if (!selectedItem) return;

    setError(null);
    try {
      const response = await fetch(
        "http://localhost:5000/api/publish-schedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": session?.user?.email || "",
          },
          body: JSON.stringify({
            ...publishSchedule,
            [selectedItem.type === "quiz" ? "quiz_id" : "activity_id"]:
              selectedItem.item.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to schedule publish");
      }

      setShowScheduleDialog(false);
      setSelectedItem(null);
      setPublishSchedule({
        publish_date: "",
        target_sections: [],
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getSectionName = (sectionId: string) => {
    return sections.find((s) => s.id === sectionId)?.name || "Unknown Section";
  };

  if (
    status === "loading" ||
    !session ||
    (session.user?.role !== "teacher" && session.user?.role !== "admin")
  ) {
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
          <h1 className="text-2xl font-bold text-gray-900">Publish Content</h1>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Quizzes Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Quiz Publishing
              </CardTitle>
              <CardDescription>
                Manage the publication status of your quizzes.
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
                      <TableHead>Title</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">
                          {quiz.title}
                        </TableCell>
                        <TableCell>{getSectionName(quiz.section_id)}</TableCell>
                        <TableCell>{quiz.questions?.length || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={quiz.is_enabled ? "default" : "secondary"}
                            className={
                              quiz.is_enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {quiz.is_enabled ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {quiz.is_enabled ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handlePublishToggle(
                                  "quiz",
                                  quiz.id,
                                  quiz.is_enabled
                                )
                              }
                            >
                              {quiz.is_enabled ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({ type: "quiz", item: quiz });
                                setShowScheduleDialog(true);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Activities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Activity Publishing
              </CardTitle>
              <CardDescription>
                Manage the publication status of your activities and
                assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No activities created yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {activity.activity_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getSectionName(activity.section_id)}
                        </TableCell>
                        <TableCell>
                          {activity.due_date ? (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(activity.due_date).toLocaleDateString()}
                            </div>
                          ) : (
                            "No due date"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              activity.is_published ? "default" : "secondary"
                            }
                            className={
                              activity.is_published
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {activity.is_published ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {activity.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handlePublishToggle(
                                  "activity",
                                  activity.id,
                                  activity.is_published
                                )
                              }
                            >
                              {activity.is_published ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({
                                  type: "activity",
                                  item: activity,
                                });
                                setShowScheduleDialog(true);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Schedule Publishing Dialog */}
          <Dialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Publishing</DialogTitle>
                <DialogDescription>
                  Set a schedule for when this {selectedItem?.type} should be
                  published.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="publish_date">Publish Date & Time</Label>
                  <Input
                    id="publish_date"
                    type="datetime-local"
                    value={publishSchedule.publish_date}
                    onChange={(e) =>
                      setPublishSchedule({
                        ...publishSchedule,
                        publish_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unpublish_date">
                    Unpublish Date & Time (Optional)
                  </Label>
                  <Input
                    id="unpublish_date"
                    type="datetime-local"
                    value={publishSchedule.unpublish_date || ""}
                    onChange={(e) =>
                      setPublishSchedule({
                        ...publishSchedule,
                        unpublish_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowScheduleDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSchedulePublish}>
                    Schedule Publish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
