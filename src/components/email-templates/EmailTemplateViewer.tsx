
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generateMagicLinkEmail } from "@/utils/emailTemplates/magicLinkEmail";
import { generateConfirmationEmail } from "@/utils/emailTemplates/confirmationEmail";
import { generateResetPasswordEmail } from "@/utils/emailTemplates/resetPasswordEmail";
import { generateInviteEmail } from "@/utils/emailTemplates/inviteEmail";
import { generateChangeEmailEmail } from "@/utils/emailTemplates/changeEmailEmail";

const EmailTemplateViewer = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Sample URLs for preview
  const sampleMagicLink = "https://planzoai.com/auth?token=sample-token";
  const sampleConfirmationLink = "https://planzoai.com/auth?token=sample-confirmation-token";
  const sampleResetLink = "https://planzoai.com/auth?type=recovery&token=sample-reset-token";
  const sampleInviteLink = "https://planzoai.com/auth?token=sample-invite-token";
  const sampleChangeEmailLink = "https://planzoai.com/auth?token=sample-email-change-token";
  
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>
          Preview and copy HTML for custom Supabase email templates
        </CardDescription>
        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="dark-mode"
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
          />
          <Label htmlFor="dark-mode">Dark Mode</Label>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="magic-link" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
            <TabsTrigger value="reset">Password Reset</TabsTrigger>
            <TabsTrigger value="invite">Invitation</TabsTrigger>
            <TabsTrigger value="change-email">Change Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="magic-link" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateMagicLinkEmail(sampleMagicLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Magic Link Email Preview"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(generateMagicLinkEmail(sampleMagicLink, isDarkMode))}
            >
              Copy HTML
            </Button>
          </TabsContent>
          
          <TabsContent value="confirmation" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateConfirmationEmail(sampleConfirmationLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Confirmation Email Preview"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(generateConfirmationEmail(sampleConfirmationLink, isDarkMode))}
            >
              Copy HTML
            </Button>
          </TabsContent>
          
          <TabsContent value="reset" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateResetPasswordEmail(sampleResetLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Password Reset Email Preview"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(generateResetPasswordEmail(sampleResetLink, isDarkMode))}
            >
              Copy HTML
            </Button>
          </TabsContent>
          
          <TabsContent value="invite" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateInviteEmail(sampleInviteLink, "John Doe", isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Invite Email Preview"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(generateInviteEmail(sampleInviteLink, "John Doe", isDarkMode))}
            >
              Copy HTML
            </Button>
          </TabsContent>
          
          <TabsContent value="change-email" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateChangeEmailEmail(sampleChangeEmailLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Change Email Preview"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(generateChangeEmailEmail(sampleChangeEmailLink, isDarkMode))}
            >
              Copy HTML
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Copy these HTML templates and paste them in the Supabase Auth Email Templates section.
        </p>
        <Button variant="default" asChild>
          <a href="https://supabase.com/dashboard/project/hhkabxkelgabcsczsljf/auth/templates" target="_blank" rel="noopener noreferrer">
            Go to Supabase Templates
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailTemplateViewer;
