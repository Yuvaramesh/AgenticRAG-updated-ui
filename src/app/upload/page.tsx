"use client";

import type React from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, File, X } from "lucide-react";

export default function UploadPage() {
  const [uploadSummary, setUploadSummary] = useState<{
    chunks: number;
    images: number;
    totalFiles: number;
  } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageExtensions = [".png", ".jpg", ".jpeg"];
        const imageCount = files.filter((file) =>
          imageExtensions.includes(file.name.toLowerCase().slice(-4))
        ).length;

        setUploadSummary({
          chunks: parseInt(data.message.match(/\d+/)?.[0] || "0"),
          images: imageCount,
          totalFiles: files.length,
        });

        setFiles([]);
      } else {
        const errorData = await res.json();
        alert("Upload failed: " + errorData.error);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 text-gray-900">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-gray-900" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-gray-900">
        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>
              Drag and drop files here or click to select files to upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here to upload
              </p>
              <p className="text-gray-500 mb-4">
                or click the button below to select files
              </p>

              {/* ✅ FIXED input trigger */}
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                className="text-gray-900 border-2 border-dashed border-gray-300"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Select Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Selected Files</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                className="border-2 border-dashed border-gray-400"
                onClick={handleUpload}
              >
                Upload {files.length} file{files.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
        {uploadSummary && (
          <Card className="mt-6 bg-green-50 border-green-300 text-green-900 w-[830px] h-[130px]">
            <CardHeader>
              <CardTitle className="text-green-800">
                ✅ Upload Successful
              </CardTitle>
              <CardDescription>
                {uploadSummary.totalFiles} file
                {uploadSummary.totalFiles > 1 ? "s" : ""} uploaded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-green-800">
                📄 {uploadSummary.chunks} chunk
                {uploadSummary.chunks !== 1 ? "s" : ""} embedded
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
