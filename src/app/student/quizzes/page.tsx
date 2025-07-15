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
import { Loader2, ArrowLeft, Play, CheckCircle } from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Section {
  id: string; // Changed to string
  name: string;
}

interface Question {
  id?: string; // Changed to string (if MongoDB generates _id for embedded docs)
  question_text: string;
  options: string[];
}

interface Quiz {
  id: string; // Changed to string
  title: string;
  section_id: string; // Changed to string
  is_enabled: boolean;
  questions?: Question[];
}

export default function StudentQuizzesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<{
    [key: string]: string;
  }>({}); // Key changed to string
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total_questions: number;
    attempt_id: string;
  } | null>(
    // attempt_id changed to string
    null
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "student") {
      router.push("/dashboard");
      return;
    }
    fetchSections();
    fetchQuizzes();
  }, [session, status, router]);

  const fetchSections = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/sections", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch sections");
      const data = await response.json();
      setSections(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/quizzes", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      const data = await response.json();
      setQuizzes(data.filter((q: Quiz) => q.is_enabled)); // Students only see enabled quizzes
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId: string) => {
    // Changed quizId type to string
    setError(null);
    setQuizResult(null);
    setStudentAnswers({});
    try {
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quizId}`,
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to fetch quiz: ${response.statusText}`
        );
      }
      const data = await response.json();
      setActiveQuiz(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    // Changed questionId type to string
    setStudentAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    setError(null);
    if (!activeQuiz) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${activeQuiz.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": session?.user?.email || "",
          },
          body: JSON.stringify({ answers: studentAnswers }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to submit quiz: ${response.statusText}`
        );
      }

      const result = await response.json();
      setQuizResult(result);
      setActiveQuiz(null); // Go back to quiz list
      fetchQuizzes(); // Refresh quiz list to reflect submission
    } catch (err: any) {
      setError(err.message);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
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

          {quizResult && (
            <Card className="mb-6 border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" /> Quiz Submitted!
                </CardTitle>
                <CardDescription>
                  You scored {quizResult.score} out of{" "}
                  {quizResult.total_questions}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setQuizResult(null)}>Close</Button>
              </CardContent>
            </Card>
          )}

          {activeQuiz ? (
            <Card>
              <CardHeader>
                <CardTitle>{activeQuiz.title}</CardTitle>
                <CardDescription>
                  Section:{" "}
                  {sections.find((s) => s.id === activeQuiz.section_id)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeQuiz.questions?.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="border p-4 rounded-md space-y-3"
                  >
                    <p className="font-semibold text-lg">
                      {qIndex + 1}. {q.question_text}
                    </p>
                    <RadioGroup
                      onValueChange={(value) =>
                        handleAnswerChange(q.id || String(qIndex), value)
                      } // Use q.id or index as fallback
                      value={studentAnswers[q.id || String(qIndex)] || ""}
                    >
                      {q.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option}
                            id={`q${q.id || qIndex}-o${oIndex}`}
                          />
                          <Label htmlFor={`q${q.id || qIndex}-o${oIndex}`}>
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={
                    Object.keys(studentAnswers).length !==
                    (activeQuiz.questions?.length || 0)
                  }
                >
                  Submit Quiz
                </Button>
                <Button
                  variant="outline"
                  className="ml-2 bg-transparent"
                  onClick={() => setActiveQuiz(null)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Available Quizzes</CardTitle>
                <CardDescription>Select a quiz to start.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : quizzes.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No quizzes available at the moment.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>{quiz.id}</TableCell>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>
                            {sections.find((s) => s.id === quiz.section_id)
                              ?.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startQuiz(quiz.id)}
                            >
                              <Play className="h-4 w-4 mr-2" /> Start Quiz
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
