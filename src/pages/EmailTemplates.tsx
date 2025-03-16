
import EmailTemplateViewer from "@/components/email-templates/EmailTemplateViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleInfo as InfoCircleIcon } from "lucide-react";

const EmailTemplates = () => {
  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-3xl font-bold">Email Templates</h1>
      <Alert>
        <InfoCircleIcon className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          These email templates use the PlanzoAI branding and are designed to be used with Supabase Auth. 
          To use them, copy the HTML and paste it into the corresponding template in your Supabase Auth settings.
          Make sure to use the correct placeholders as specified in the Supabase Auth documentation.
        </AlertDescription>
      </Alert>
      <EmailTemplateViewer />
    </div>
  );
};

export default EmailTemplates;
