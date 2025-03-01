
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import SpreadsheetUploader from "@/components/SpreadsheetUploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HookStructureUploaderProps {
  fetchHooksAndStructures: () => Promise<void>;
}

export function HookStructureUploader({ fetchHooksAndStructures }: HookStructureUploaderProps) {
  const { toast } = useToast();

  const handleHookUploadComplete = () => {
    fetchHooksAndStructures();
    toast.success("Hook data uploaded successfully");
  };

  const handleStructureUploadComplete = () => {
    fetchHooksAndStructures();
    toast.success("Structure data uploaded successfully");
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="upload-resources">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Hooks & Structures</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Upload Hooks</h4>
              <SpreadsheetUploader 
                type="hooks"
                functionName="process-spreadsheet"
                onUploadComplete={handleHookUploadComplete}
                additionalParams={{ type: 'hook' }}
                accept=".csv,.xlsx,.xls"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Upload Structures</h4>
              <SpreadsheetUploader 
                type="structures"
                functionName="process-spreadsheet"
                onUploadComplete={handleStructureUploadComplete}
                additionalParams={{ type: 'structure' }}
                accept=".csv,.xlsx,.xls"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
