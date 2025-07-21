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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  BarChart,
  CalendarDays,
  Trophy,
  Target,
  TrendingUp,
  Activity,
  Users,
  FileText,
  PieChartIcon,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { DynamicSidebar } from "@/components/dynamic-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizResult {
  _id: {
    $oid: string;
  };
  correct_answer: number;
  wrong_answer: number;
  total_questions: number;
  score_percentage: number;
  submitted_at: {
    $date: string;
  };
  created_at: {
    $date: string;
  };
  updated_at: {
    $date: string;
  };
  student_name: string;
  quiz_title: string;
  student_id?: string;
  topic_id?: string;
}

interface OverviewStats {
  total_students: number;
  total_quizzes: number;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  completion_rate: number;
}

interface QuizStats {
  quiz_title: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
}

export default function TeacherReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<QuizResult[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(
    null
  );
  const [quizStats, setQuizStats] = useState<QuizStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
    fetchQuizResults();
  }, [session, status, router]);

  useEffect(() => {
    filterAndSortResults();
  }, [quizResults, searchTerm, selectedQuiz, sortBy]);

  const fetchQuizResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/quiz-results", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch quiz results");

      const data = await response.json();
      setQuizResults(data);
      calculateStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (results: QuizResult[]) => {
    if (results.length === 0) return;

    // Overview Statistics
    const uniqueStudents = new Set(results.map((r) => r.student_name)).size;
    const uniqueQuizzes = new Set(results.map((r) => r.quiz_title)).size;
    const totalAttempts = results.length;
    const averageScore =
      results.reduce((sum, r) => sum + r.score_percentage, 0) / totalAttempts;
    const passRate =
      (results.filter((r) => r.score_percentage >= 60).length / totalAttempts) *
      100;
    const completionRate =
      (results.filter((r) => r.total_questions > 0).length / totalAttempts) *
      100;

    setOverviewStats({
      total_students: uniqueStudents,
      total_quizzes: uniqueQuizzes,
      total_attempts: totalAttempts,
      average_score: averageScore,
      pass_rate: passRate,
      completion_rate: completionRate,
    });

    // Quiz-wise Statistics
    const quizGroups = results.reduce((acc, result) => {
      if (!acc[result.quiz_title]) {
        acc[result.quiz_title] = [];
      }
      acc[result.quiz_title].push(result);
      return acc;
    }, {} as Record<string, QuizResult[]>);

    const quizStatsData = Object.entries(quizGroups).map(
      ([quizTitle, attempts]) => ({
        quiz_title: quizTitle,
        total_attempts: attempts.length,
        average_score:
          attempts.reduce((sum, a) => sum + a.score_percentage, 0) /
          attempts.length,
        highest_score: Math.max(...attempts.map((a) => a.score_percentage)),
        lowest_score: Math.min(...attempts.map((a) => a.score_percentage)),
        pass_rate:
          (attempts.filter((a) => a.score_percentage >= 60).length /
            attempts.length) *
          100,
      })
    );

    setQuizStats(quizStatsData);
  };

  const filterAndSortResults = () => {
    let filtered = [...quizResults];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.student_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.quiz_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by quiz
    if (selectedQuiz !== "all") {
      filtered = filtered.filter(
        (result) => result.quiz_title === selectedQuiz
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.submitted_at.$date).getTime() -
            new Date(a.submitted_at.$date).getTime()
          );
        case "score":
          return b.score_percentage - a.score_percentage;
        case "student":
          return a.student_name.localeCompare(b.student_name);
        case "quiz":
          return a.quiz_title.localeCompare(b.quiz_title);
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return { grade: "A", variant: "default" as const };
    if (percentage >= 80) return { grade: "B", variant: "secondary" as const };
    if (percentage >= 70) return { grade: "C", variant: "secondary" as const };
    if (percentage >= 60)
      return { grade: "D", variant: "destructive" as const };
    return { grade: "F", variant: "destructive" as const };
  };

  const gradeDistributionData = [
    {
      name: "A (90-100%)",
      value: quizResults.filter((r) => r.score_percentage >= 90).length,
      color: "#10B981",
    },
    {
      name: "B (80-89%)",
      value: quizResults.filter(
        (r) => r.score_percentage >= 80 && r.score_percentage < 90
      ).length,
      color: "#3B82F6",
    },
    {
      name: "C (70-79%)",
      value: quizResults.filter(
        (r) => r.score_percentage >= 70 && r.score_percentage < 80
      ).length,
      color: "#F59E0B",
    },
    {
      name: "D (60-69%)",
      value: quizResults.filter(
        (r) => r.score_percentage >= 60 && r.score_percentage < 70
      ).length,
      color: "#F97316",
    },
    {
      name: "F (<60%)",
      value: quizResults.filter((r) => r.score_percentage < 60).length,
      color: "#EF4444",
    },
  ];

  const performanceOverTimeData = quizResults
    .sort(
      (a, b) =>
        new Date(a.submitted_at.$date).getTime() -
        new Date(b.submitted_at.$date).getTime()
    )
    .reduce((acc, result, index) => {
      const date = new Date(result.submitted_at.$date).toLocaleDateString();
      const existingEntry = acc.find((entry) => entry.date === date);

      if (existingEntry) {
        existingEntry.average_score =
          (existingEntry.average_score + result.score_percentage) / 2;
        existingEntry.attempts += 1;
      } else {
        acc.push({
          date,
          average_score: result.score_percentage,
          attempts: 1,
        });
      }

      return acc;
    }, [] as { date: string; average_score: number; attempts: number }[]);

  const exportToCSV = () => {
    const headers = [
      "Student Name",
      "Quiz Title",
      "Score",
      "Percentage",
      "Grade",
      "Date",
      "Correct Answers",
      "Wrong Answers",
    ];
    const csvData = filteredResults.map((result) => [
      result.student_name,
      result.quiz_title,
      `${result.correct_answer}/${result.total_questions}`,
      `${result.score_percentage}%`,
      getGradeBadge(result.score_percentage).grade,
      new Date(result.submitted_at.$date).toLocaleDateString(),
      result.correct_answer,
      result.wrong_answer,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session || session.user?.role !== "teacher") {
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
        <header className="flex bg-white text-black h-16 shrink-0 items-center gap-2 border-b px-4">
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
          <h1 className="text-2xl font-bold text-gray-900">
            Quiz Results Report
          </h1>
        </header>

        <main className="flex-1 py-8 bg-white text-black px-4 sm:px-6 lg:px-8">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Statistics */}
              {overviewStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Students
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.total_students}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Quizzes
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.total_quizzes}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Attempts
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.total_attempts}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Average Score
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.average_score.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Pass Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.pass_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-indigo-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Completion Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {overviewStats.completion_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Grade Distribution
                    </CardTitle>
                    <CardDescription>
                      Distribution of student grades across all quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={gradeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {gradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart className="h-5 w-5 mr-2" />
                      Performance Trend
                    </CardTitle>
                    <CardDescription>
                      Average quiz scores over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="average_score"
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Quiz Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Quiz Performance Summary
                  </CardTitle>
                  <CardDescription>
                    Performance statistics for each quiz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={quizStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quiz_title" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="average_score" fill="#3B82F6" />
                      <Bar dataKey="pass_rate" fill="#10B981" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      Detailed Results
                    </div>
                    <Button
                      onClick={exportToCSV}
                      className=" bg-white"
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 text-black mr-2" />
                      Export CSV
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute bg-white left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search by student name or quiz title..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <Select
                      value={selectedQuiz}
                      onValueChange={setSelectedQuiz}
                    >
                      <SelectTrigger className="w-48 bg-white text-black">
                        <SelectValue placeholder="Filter by quiz" />
                      </SelectTrigger>
                      <SelectContent className=" bg-white text-black">
                        <SelectItem className=" text-black " value="all">
                          All Quizzes
                        </SelectItem>
                        {Array.from(
                          new Set(quizResults.map((r) => r.quiz_title))
                        ).map((quiz) => (
                          <SelectItem key={quiz} value={quiz}>
                            {quiz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 text-black bg-white">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className=" text-black bg-white">
                        <SelectItem value="date">
                          Date (Newest First)
                        </SelectItem>
                        <SelectItem value="score">
                          Score (Highest First)
                        </SelectItem>
                        <SelectItem value="student">Student Name</SelectItem>
                        <SelectItem value="quiz">Quiz Title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredResults.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No quiz results found matching your criteria.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Quiz Title</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Correct</TableHead>
                          <TableHead>Wrong</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.map((result) => {
                          const gradeBadge = getGradeBadge(
                            result.score_percentage
                          );
                          return (
                            <TableRow key={result._id.$oid}>
                              <TableCell className="font-medium">
                                {result.student_name}
                              </TableCell>
                              <TableCell>{result.quiz_title}</TableCell>
                              <TableCell>
                                {result.correct_answer} /{" "}
                                {result.total_questions}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress
                                    value={result.score_percentage}
                                    className="w-16"
                                  />
                                  <span
                                    className={`font-medium ${getGradeColor(
                                      result.score_percentage
                                    )}`}
                                  >
                                    {result.score_percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={gradeBadge.variant}>
                                  {gradeBadge.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-green-600"
                                >
                                  {result.correct_answer}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  {result.wrong_answer}
                                </Badge>
                              </TableCell>
                              <TableCell className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-1 text-gray-500" />
                                {new Date(
                                  result.submitted_at.$date
                                ).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
