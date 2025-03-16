
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clipboard, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateMagicLinkEmail } from "@/utils/emailTemplates/magicLinkEmail";
import { generateConfirmationEmail } from "@/utils/emailTemplates/confirmationEmail";
import { generateResetPasswordEmail } from "@/utils/emailTemplates/resetPasswordEmail";
import { generateInviteEmail } from "@/utils/emailTemplates/inviteEmail";
import { generateChangeEmailEmail } from "@/utils/emailTemplates/changeEmailEmail";

const EmailTemplateViewer = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Sample URLs for preview
  const sampleMagicLink = "https://planzoai.com/auth?token=sample-token";
  const sampleConfirmationLink = "https://planzoai.com/auth?token=sample-confirmation-token";
  const sampleResetLink = "https://planzoai.com/auth?type=recovery&token=sample-reset-token";
  const sampleInviteLink = "https://planzoai.com/auth?token=sample-invite-token";
  const sampleChangeEmailLink = "https://planzoai.com/auth?token=sample-email-change-token";
  
  const copyToClipboard = (template: string, type: string) => {
    navigator.clipboard.writeText(template)
      .then(() => {
        setCopied({...copied, [type]: true});
        toast({
          title: "Copied!",
          description: "Email template copied to clipboard",
        });
        setTimeout(() => setCopied({...copied, [type]: false}), 2000);
      })
      .catch(err => {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Unable to copy template to clipboard",
        });
      });
  };
  
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
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateMagicLinkEmail(sampleMagicLink, isDarkMode), 'magic-link')}
                className="flex items-center gap-1"
              >
                {copied['magic-link'] ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy HTML
              </Button>
              <div className="text-sm text-muted-foreground mt-1">
                Set in Supabase under: <strong>Authentication &gt; Email Templates &gt; Magic Link</strong>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="confirmation" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateConfirmationEmail(sampleConfirmationLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Confirmation Email Preview"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateConfirmationEmail(sampleConfirmationLink, isDarkMode), 'confirmation')}
                className="flex items-center gap-1"
              >
                {copied['confirmation'] ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy HTML
              </Button>
              <div className="text-sm text-muted-foreground mt-1">
                Set in Supabase under: <strong>Authentication &gt; Email Templates &gt; Confirm Signup</strong>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reset" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateResetPasswordEmail(sampleResetLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Password Reset Email Preview"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateResetPasswordEmail(sampleResetLink, isDarkMode), 'reset')}
                className="flex items-center gap-1"
              >
                {copied['reset'] ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy HTML
              </Button>
              <div className="text-sm text-muted-foreground mt-1">
                Set in Supabase under: <strong>Authentication &gt; Email Templates &gt; Reset Password</strong>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="invite" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateInviteEmail(sampleInviteLink, "John Doe", isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Invite Email Preview"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateInviteEmail(sampleInviteLink, "John Doe", isDarkMode), 'invite')}
                className="flex items-center gap-1"
              >
                {copied['invite'] ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy HTML
              </Button>
              <div className="text-sm text-muted-foreground mt-1">
                Set in Supabase under: <strong>Authentication &gt; Email Templates &gt; Invite User</strong>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="change-email" className="mt-4">
            <div className="border rounded-md mb-4 p-4 bg-white dark:bg-gray-950">
              <iframe 
                srcDoc={generateChangeEmailEmail(sampleChangeEmailLink, isDarkMode)}
                className="w-full h-[500px] border-0"
                title="Change Email Preview"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateChangeEmailEmail(sampleChangeEmailLink, isDarkMode), 'change-email')}
                className="flex items-center gap-1"
              >
                {copied['change-email'] ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy HTML
              </Button>
              <div className="text-sm text-muted-foreground mt-1">
                Set in Supabase under: <strong>Authentication &gt; Email Templates &gt; Change Email</strong>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <p>Copy these HTML templates and paste them in the corresponding Supabase Auth Email Templates section.</p>
          <p>Make sure to use the template provided by Supabase, replacing only the <code>&lt;body&gt;</code> content.</p>
        </div>
        <Button variant="default" asChild className="ml-auto">
          <a href="https://supabase.com/dashboard/project/hhkabxkelgabcsczsljf/auth/templates" target="_blank" rel="noopener noreferrer">
            Go to Supabase Templates
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailTemplateViewer;
