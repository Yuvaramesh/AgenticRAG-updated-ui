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
import { Loader2, ArrowLeft, BarChart, CalendarDays } from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface QuizAttempt {
  id: string; // Changed to string
  student_id: string; // Changed to string
  quiz_id: string; // Changed to string
  score: number;
  total_questions: number;
  attempt_date: string; // ISO string
  answers: { [key: string]: string };
}

interface Quiz {
  id: string; // Changed to string
  title: string;
  section_id: string; // Changed to string
}

interface Section {
  id: string; // Changed to string
  name: string;
}

export default function StudentReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "student") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch attempts
      const attemptsResponse = await fetch(
        "http://localhost:5000/api/quiz_attempts",
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!attemptsResponse.ok)
        throw new Error("Failed to fetch quiz attempts");
      const attemptsData = await attemptsResponse.json();
      setAttempts(attemptsData);

      // Fetch quizzes (all, to map titles)
      const quizzesResponse = await fetch("http://localhost:5000/api/quizzes", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });
      if (!quizzesResponse.ok) throw new Error("Failed to fetch quizzes");
      const quizzesData = await quizzesResponse.json();
      setQuizzes(quizzesData);

      // Fetch sections (all, to map names)
      const sectionsResponse = await fetch(
        "http://localhost:5000/api/sections",
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!sectionsResponse.ok) throw new Error("Failed to fetch sections");
      const sectionsData = await sectionsResponse.json();
      setSections(sectionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getQuizTitle = (quizId: string) => {
    // Changed quizId type to string
    return quizzes.find((q) => q.id === quizId)?.title || `Quiz ${quizId}`;
  };

  const getSectionName = (quizId: string) => {
    // Changed quizId type to string
    const quiz = quizzes.find((q) => q.id === quizId);
    return sections.find((s) => s.id === quiz?.section_id)?.name || "N/A";
  };

  if (status === "loading" || !session || session.user?.role !== "student") {
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
          <h1 className="text-2xl font-bold text-gray-900">My Quiz Report</h1>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2" /> Your Quiz Performance
              </CardTitle>
              <CardDescription>
                Overview of your past quiz attempts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : attempts.length === 0 ? (
                <p className="text-center text-gray-500">
                  You haven't attempted any quizzes yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz Title</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>{getQuizTitle(attempt.quiz_id)}</TableCell>
                        <TableCell>{getSectionName(attempt.quiz_id)}</TableCell>
                        <TableCell>
                          {attempt.score} / {attempt.total_questions}
                        </TableCell>
                        <TableCell className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1 text-gray-500" />
                          {new Date(attempt.attempt_date).toLocaleDateString()}
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
