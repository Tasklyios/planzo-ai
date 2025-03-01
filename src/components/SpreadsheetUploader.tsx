
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

interface SpreadsheetUploaderProps {
  type: "hooks" | "structures";
  functionName?: string; // Make this optional
  additionalParams?: Record<string, any>; // Add this prop
  accept?: string; // Add this prop
  onUploadComplete?: (data: any[]) => void;
}

const SpreadsheetUploader = ({ 
  type, 
  functionName = "process-spreadsheet", // Default value
  additionalParams = {}, 
  accept = ".csv,.xlsx,.xls",
  onUploadComplete 
}: SpreadsheetUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Check file type (accept .csv, .xlsx, .xls)
      const validTypes = [
        'text/csv', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Create form data to send to Supabase function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Get the user session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        throw new Error("You must be logged in to upload files");
      }
      
      // Call Supabase function to process the spreadsheet
      const { data, error } = await supabase.functions.invoke('process-spreadsheet', {
        body: formData
      });
      
      if (error) throw error;
      
      if (data.rows?.length) {
        toast({
          title: "Upload successful",
          description: `Successfully processed ${data.rows.length} ${type}`,
        });
        
        // Pass the processed data back to parent component
        if (onUploadComplete) {
          onUploadComplete(data.rows);
        }
      } else {
        throw new Error("No data found in spreadsheet");
      }
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to process spreadsheet"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor={`${type}-upload`}>
          Upload {type === "hooks" ? "Hooks" : "Video Structures"} Spreadsheet
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${type}-upload`}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className={file ? "hidden" : ""}
          />
          {file && (
            <div className="flex items-center gap-2 p-2 border rounded bg-muted w-full">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {file && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload {type === "hooks" ? "Hooks" : "Video Structures"}
            </span>
          )}
        </Button>
      )}
    </div>
  );
};

export default SpreadsheetUploader;
