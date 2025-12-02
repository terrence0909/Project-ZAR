import { useState, useRef, DragEvent } from "react";
import { Link } from "react-router-dom";
import { Upload, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DataImport = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [recordCount, setRecordCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".xml")) {
      toast.error("Invalid file type. Only XML files are allowed.");
      return false;
    }
    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadStatus("idle");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadStatus("idle");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      // Convert file to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data URL prefix (everything before the comma)
          const base64 = reader.result as string;
          const base64Content = base64.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Send as JSON (not FormData)
      const response = await fetch(
        "https://4yhpt4dlwe.execute-api.us-east-1.amazonaws.com/dev/upload-xml",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: base64String,
            filename: selectedFile.name
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setRecordCount(0);
      setUploadStatus("success");
      toast.success(`XML uploaded successfully. Processing started.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
      setUploadStatus("error");
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-secondary">
      {/* Header */}
      <header className="border-b border-border/50 bg-glass backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="glass-card p-8 rounded-lg border border-border/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Upload XML Data
            </h2>
            <p className="text-muted-foreground">
              Import wallet and transaction data from XML files for analysis
            </p>
          </div>

          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-border"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Drag and drop your XML file here
                  </p>
                  <p className="text-sm text-muted-foreground">or</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Browse Files
              </Button>

              <p className="text-xs text-muted-foreground">
                Only .xml files are accepted
              </p>
            </div>
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="min-w-[140px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload XML
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-success font-medium">
                  ✓ XML loaded successfully
                </p>
                <p className="text-success/80 text-sm mt-1">
                  {recordCount} records imported
                </p>
              </div>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-medium">Upload failed</p>
                <p className="text-destructive/80 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DataImport;