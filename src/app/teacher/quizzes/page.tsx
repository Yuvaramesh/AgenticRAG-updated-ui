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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Edit,
  Check,
  X,
  ArrowLeft,
  Play,
  Pause,
  Eye,
} from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/text-area";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Import Alert components

interface Section {
  id: string;
  name: string;
}

interface Question {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface Quiz {
  id: string;
  title: string;
  section_id: string | null; // section_id can now be null
  is_enabled: boolean;
  questions?: Question[];
}

export default function TeacherQuizzesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    section_id: null as string | null, // Initialize as null for select
    questions: [
      { question_text: "", options: ["", "", "", ""], correct_answer: "" },
    ] as Question[],
  });
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (
      !session ||
      (session.user?.role !== "teacher" && session.user?.role !== "admin")
    ) {
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
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    setError(null);
    try {
      const quizDataToSend = {
        ...newQuiz,
        section_id: newQuiz.section_id === "" ? null : newQuiz.section_id, // Send null if "No Section" is selected
      };
      const response = await fetch("http://localhost:5000/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": session?.user?.email || "",
        },
        body: JSON.stringify(quizDataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create quiz: ${response.statusText}`
        );
      }
      setNewQuiz({
        title: "",
        section_id: null,
        questions: [
          { question_text: "", options: ["", "", "", ""], correct_answer: "" },
        ],
      });
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateQuiz = async (quiz: Quiz) => {
    setError(null);
    try {
      const quizDataToSend = {
        ...quiz,
        section_id: quiz.section_id === "" ? null : quiz.section_id, // Send null if "No Section" is selected
      };
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quiz.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": session?.user?.email || "",
          },
          body: JSON.stringify(quizDataToSend),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update quiz: ${response.statusText}`
        );
      }
      setEditingQuiz(null);
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnableDisableQuiz = async (quizId: string, enable: boolean) => {
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quizId}/${
          enable ? "enable" : "disable"
        }`,
        {
          method: "POST",
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to change quiz status: ${response.statusText}`
        );
      }
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddQuestion = () => {
    if (editingQuiz) {
      setEditingQuiz({
        ...editingQuiz,
        questions: [
          ...(editingQuiz.questions || []),
          { question_text: "", options: ["", "", "", ""], correct_answer: "" },
        ],
      });
    } else {
      setNewQuiz({
        ...newQuiz,
        questions: [
          ...newQuiz.questions,
          { question_text: "", options: ["", "", "", ""], correct_answer: "" },
        ],
      });
    }
  };

  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: string | string[]
  ) => {
    const target = editingQuiz || newQuiz;
    const setter = editingQuiz ? setEditingQuiz : setNewQuiz;
    const updatedQuestions = [...(target.questions || [])];
    (updatedQuestions[index] as any)[field] = value;
    setter({ ...target, questions: updatedQuestions } as any);
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    const target = editingQuiz || newQuiz;
    const setter = editingQuiz ? setEditingQuiz : setNewQuiz;
    const updatedQuestions = [...(target.questions || [])];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[oIndex] = value;
    updatedQuestions[qIndex].options = updatedOptions;
    setter({ ...target, questions: updatedQuestions } as any);
  };

  const handleRemoveQuestion = (index: number) => {
    const target = editingQuiz || newQuiz;
    const setter = editingQuiz ? setEditingQuiz : setNewQuiz;
    const updatedQuestions = (target.questions || []).filter(
      (_, i) => i !== index
    );
    setter({ ...target, questions: updatedQuestions } as any);
  };

  const handleViewQuiz = async (quizId: string) => {
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quizId}`,
        {
          headers: { "X-User-Email": session?.user?.email || "" },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch quiz details");
      const data = await response.json();
      setViewingQuiz(data);
    } catch (err: any) {
      setError(err.message);
    }
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
          <h1 className="text-2xl font-bold text-white">Manage Quizzes</h1>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <strong className="font-bold">Error!</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Quiz</CardTitle>
              <CardDescription>
                Design and add a new quiz for your sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Quiz Title"
                value={newQuiz.title}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, title: e.target.value })
                }
              />
              <Select
                value={newQuiz.section_id || "none"} // Use "none" string for Select component if null
                onValueChange={(value) =>
                  setNewQuiz({
                    ...newQuiz,
                    section_id: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Section (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Section (Optional)</SelectItem>{" "}
                  {/* Added optional empty value */}
                  {sections.map((section, index) => (
                    <SelectItem key={index} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <h3 className="text-lg font-semibold mt-4">Questions</h3>
              {newQuiz.questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="border p-4 rounded-md space-y-3 relative"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveQuestion(qIndex)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                  <Textarea
                    placeholder={`Question ${qIndex + 1} Text`}
                    value={q.question_text}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "question_text",
                        e.target.value
                      )
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((option, oIndex) => (
                      <Input
                        key={oIndex}
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                      />
                    ))}
                  </div>
                  <Input
                    placeholder="Correct Answer (must match one of the options)"
                    value={q.correct_answer}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "correct_answer",
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}
              <Button variant="outline" onClick={handleAddQuestion}>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
              <Button onClick={handleCreateQuiz} className="ml-2">
                Create Quiz
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Quizzes</CardTitle>
              <CardDescription>
                View, edit, and manage the status of your quizzes.
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
                      <TableHead>Title</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell>{quiz.id}</TableCell>
                        <TableCell>
                          {editingQuiz?.id === quiz.id ? (
                            <Input
                              value={editingQuiz.title}
                              onChange={(e) =>
                                setEditingQuiz({
                                  ...editingQuiz,
                                  title: e.target.value,
                                })
                              }
                            />
                          ) : (
                            quiz.title
                          )}
                        </TableCell>
                        <TableCell>
                          {editingQuiz?.id === quiz.id ? (
                            <Select
                              value={editingQuiz.section_id || "none"} // Use "none" string for Select component if null
                              onValueChange={(value) =>
                                setEditingQuiz({
                                  ...editingQuiz,
                                  section_id: value === "none" ? null : value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  No Section (Optional)
                                </SelectItem>{" "}
                                {/* Added optional empty value */}
                                {sections.map((section) => (
                                  <SelectItem
                                    key={section.id}
                                    value={section.id}
                                  >
                                    {section.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : quiz.section_id ? (
                            sections.find((s) => s.id === quiz.section_id)
                              ?.name || "N/A"
                          ) : (
                            "No Section"
                          )}
                        </TableCell>
                        <TableCell>
                          {quiz.is_enabled ? (
                            <span className="text-green-600 font-medium">
                              Enabled
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Disabled
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingQuiz?.id === quiz.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuiz(editingQuiz)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingQuiz(null)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewQuiz(quiz.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingQuiz(quiz)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEnableDisableQuiz(
                                    quiz.id,
                                    !quiz.is_enabled
                                  )
                                }
                              >
                                {quiz.is_enabled ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
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

          {/* Quiz Viewing Dialog */}
          <Dialog
            open={!!viewingQuiz}
            onOpenChange={() => setViewingQuiz(null)}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Viewing Quiz: {viewingQuiz?.title}</DialogTitle>
                <DialogDescription>
                  Section:{" "}
                  {viewingQuiz?.section_id
                    ? sections.find((s) => s.id === viewingQuiz?.section_id)
                        ?.name
                    : "No Section"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {viewingQuiz?.questions?.map((q, qIndex) => (
                  <div key={qIndex} className="border p-4 rounded-md space-y-2">
                    <p className="font-semibold">
                      Question {qIndex + 1}: {q.question_text}
                    </p>
                    <ul className="list-disc pl-5">
                      {q.options.map((option, oIndex) => (
                        <li
                          key={oIndex}
                          className={
                            option === q.correct_answer
                              ? "text-green-600 font-medium"
                              : ""
                          }
                        >
                          {option} {option === q.correct_answer && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
