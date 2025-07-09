"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  MessageSquare,
  Languages,
  Database,
  FileText,
  Trash2,
  Download,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  agent_type?: string;
  user_email?: string;
  translated?: boolean;
  original_text?: string;
}

interface ChatHistory {
  id: string;
  query: string;
  answer: string;
  timestamp: Date;
  agent_type: string;
  user_email?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI assistant. I can help you query your uploaded documents and provide relevant answers. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
      agent_type: "general",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("ta");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send query to Flask backend
      const response = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: currentQuery,
          selectedFile: selectedFile,
          chat_history: chatHistory.map((h) => ({
            query: h.query,
            answer: h.answer,
          })),
          user_email: session?.user?.email || "anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          data.answer || "I couldn't process your request. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        agent_type: data.agent_type,
        user_email: data.user_email,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Add to chat history for sidebar (only if it's a Qdrant retrieval)
      if (data.answer && data.agent_type) {
        const historyItem: ChatHistory = {
          id: Date.now().toString(),
          query: currentQuery,
          answer: data.answer,
          timestamp: new Date(),
          agent_type: data.agent_type,
          user_email: data.user_email,
        };
        setChatHistory((prev) => [historyItem, ...prev]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          "Sorry, I encountered an error while processing your request. Please make sure the backend server is running and try again.",
        sender: "bot",
        timestamp: new Date(),
        agent_type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (messageId: string, text: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch("http://localhost:5000/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          target_lang: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: data.translated_text,
                translated: true,
                original_text: text,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const exportChatHistory = () => {
    const dataStr = JSON.stringify(chatHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-history-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case "database":
        return <Database className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getAgentColor = (agentType?: string) => {
    switch (agentType) {
      case "database":
        return "bg-blue-100 text-blue-800";
      case "document":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen text-gray-900 bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Query History
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportChatHistory}
                disabled={chatHistory.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChatHistory}
                disabled={chatHistory.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Translation Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {chatHistory.length} queries from Qdrant DB
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No queries yet</p>
              <p className="text-xs mt-1">
                Your Qdrant database queries will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((item) => (
                <Card
                  key={item.id}
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.query}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${getAgentColor(item.agent_type)}`}
                      >
                        <div className="flex items-center">
                          {getAgentIcon(item.agent_type)}
                          <span className="ml-1 text-xs">
                            {item.agent_type}
                          </span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {item.answer}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.answer, item.id)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {item.user_email && (
                      <div className="mt-2">
                        <img
                          src={item.user_email || "/placeholder.svg"}
                          alt="Generated content"
                          className="max-w-full h-auto rounded border"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center">
                <Bot className="h-6 w-6 mr-2 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Chat Assistant
                </h1>
              </div>
            </div>
            <div className="flex items-centerspace-x-4">
              <Badge
                variant="outline"
                className="flex items-center text-gray-900 "
              >
                <Database className="h-3 w-3 mr-1 text-gray-900 " />
                Qdrant Connected
              </Badge>
              <div className="text-sm text-gray-600">{session?.user?.name}</div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {message.sender === "user" ? (
                        <User className="h-4 w-4 mr-2" />
                      ) : (
                        getAgentIcon(message.agent_type)
                      )}
                      <span className="text-xs font-medium">
                        {message.sender === "user" ? "You" : "AI Assistant"}
                      </span>
                      {message.agent_type && message.sender === "bot" && (
                        <Badge
                          variant="secondary"
                          className={`ml-2 text-xs ${getAgentColor(
                            message.agent_type
                          )}`}
                        >
                          {message.agent_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {message.sender === "bot" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleTranslate(
                                message.id,
                                message.original_text || message.content
                              )
                            }
                            disabled={isTranslating}
                            className="h-6 w-6 p-0"
                          >
                            <Languages className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(message.content, message.id)
                            }
                            className="h-6 w-6 p-0"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.translated && message.original_text && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Original:</p>
                      <p className="text-xs opacity-75">
                        {message.original_text}
                      </p>
                    </div>
                  )}

                  {message.user_email && (
                    <div className="mt-3">
                      <img
                        src={message.user_email || "/placeholder.svg"}
                        alt="Generated content"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  )}

                  <div className="text-xs opacity-75 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Bot className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">AI Assistant</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      processing
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your uploaded documents..."
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Connected to Qdrant Vector Database</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
