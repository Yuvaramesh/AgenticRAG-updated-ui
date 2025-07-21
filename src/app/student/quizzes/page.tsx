"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

interface Question {
  question_text: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  created_at: string;
  created_by: string;
  is_enabled: boolean;
  section_id: string | null;
  updated_at: string;
}

export default function QuizApp() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitQuizResults = async (
    quizId: string,
    correctCount: number,
    wrongCount: number
  ) => {
    try {
      setSubmitting(true);
      const response = await fetch("http://127.0.0.1:5000/api/quiz-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: session?.user.id,
          topic_id: quizId, // Using quiz ID as topic ID, adjust as needed
          correct_answer: correctCount,
          wrong_answer: wrongCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz results");
      }

      const result = await response.json();
      console.log("Quiz results submitted successfully:", result);
      return result;
    } catch (error) {
      console.error("Error submitting quiz results:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchQuizzes();
    }
  }, [session]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:5000/api/quizzes", {
        headers: { "X-User-Email": session?.user?.email || "" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const data = await response.json();

      setQuizzes(data.filter((quiz: Quiz) => quiz.is_enabled));
    } catch (err) {
      setError("Failed to load quizzes. Please try again later.");

      console.error("Error fetching quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (
      selectedQuiz &&
      currentQuestionIndex < selectedQuiz.questions.length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Calculate results (assuming first option is correct for demo)
    // You should modify this logic based on your actual correct answers
    let correctCount = 0;
    let wrongCount = 0;

    selectedQuiz?.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (userAnswer) {
        // For demo: assuming first option is always correct
        // Replace this logic with your actual correct answer checking
        if (userAnswer === question.options[0]) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        wrongCount++; // Unanswered questions count as wrong
      }
    });

    try {
      await submitQuizResults(selectedQuiz!.id, correctCount, wrongCount);
      setIsSubmitted(true);
    } catch (error) {
      alert("Failed to submit quiz results. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProgress = () => {
    if (!selectedQuiz) return 0;
    return ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 text-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Available Quizzes
            </h1>
            <p className="text-gray-600">Select a quiz to get started</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleQuizSelect(quiz)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      {quiz.questions.length} Questions
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <CardDescription>{quiz.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(quiz.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      ID: {quiz.created_by.slice(-6)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Quiz Submitted!
            </CardTitle>
            <CardDescription>
              Thank you for completing "{selectedQuiz.title}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <p>
                <strong>Quiz:</strong> {selectedQuiz.title}
              </p>
              <p>
                <strong>Questions answered:</strong> {getAnsweredCount()} of{" "}
                {selectedQuiz.questions.length}
              </p>
              <p className="text-green-600">
                Your responses have been submitted successfully!
              </p>
            </div>
            <Button onClick={() => setSelectedQuiz(null)} className="w-full">
              Take Another Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedQuiz(null)}
            className="mb-4 text-gray-900"
          >
            ← Back to Quizzes
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedQuiz.title}
          </h1>
          {selectedQuiz.description && (
            <p className="text-gray-600 mb-4">{selectedQuiz.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Question {currentQuestionIndex + 1} of{" "}
                {selectedQuiz.questions.length}
              </span>
              <span>{getAnsweredCount()} answered</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 text-gray-800 ">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestionIndex] || ""}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestionIndex, value)
              }
              className="space-y-3"
            >
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = answers[currentQuestionIndex] === option;

                return (
                  <div
                    key={optionIndex}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer
        ${isSelected ? "bg-gray-400 border-gray-400" : "hover:bg-gray-50"}`}
                  >
                    <RadioGroupItem
                      value={option}
                      id={`option-${optionIndex}`}
                    />
                    <Label
                      htmlFor={`option-${optionIndex}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={getAnsweredCount() === 0 || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestionIndex]}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Quiz Info Footer */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Created: {formatDate(selectedQuiz.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Quiz ID: {selectedQuiz.id.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
