
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  // Force light mode on legal pages for better readability
  useEffect(() => {
    // Save current theme preference
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    
    // Force light mode
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Restore original theme when component unmounts
    return () => {
      if (originalTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p>Welcome to Planzo AI. These Terms of Service ("Terms") govern your access to and use of the Planzo AI website and services (the "Services"). Please read these Terms carefully before using our Services.</p>
              <p>By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Definitions</h2>
              <p>"Content" means text, graphics, images, music, software, audio, video, and other material.</p>
              <p>"User Content" means Content that users submit, transfer, or otherwise provide to the Services.</p>
              <p>"Planzo AI Content" means Content that we create or provide in connection with the Services.</p>
              <p>"Generated Content" means Content created using our AI tools and services.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
              <p>To use certain features of the Services, you must register for an account. When you register, you agree to:</p>
              <ul className="list-disc pl-6">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account and password</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p>We reserve the right to terminate or suspend your account at any time for any reason without notice.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Subscriptions and Payments</h2>
              <p>Some of our Services are available on a subscription basis. By subscribing to our Services:</p>
              <ul className="list-disc pl-6">
                <li>You agree to pay the subscription fees as described at the time of purchase</li>
                <li>Subscription fees are billed in advance and are non-refundable</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>You can cancel your subscription at any time through your account settings</li>
              </ul>
              <p>We reserve the right to change subscription fees upon notice. If you continue to use the Services after a fee change, you accept the new fees.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. AI Services and Generated Content</h2>
              <p>Our Services include AI-powered content generation tools. Regarding these tools and the content they generate:</p>
              <ul className="list-disc pl-6">
                <li>You retain ownership of any Generated Content created through our Services</li>
                <li>You grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your inputs and Generated Content to provide and improve our Services</li>
                <li>You are responsible for how you use Generated Content</li>
                <li>We do not guarantee the accuracy, quality, or appropriateness of Generated Content</li>
                <li>We reserve the right to monitor inputs to our AI services to prevent misuse</li>
              </ul>
              <p>Our AI tools may have usage limitations based on your subscription plan.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. User Content and Conduct</h2>
              <p>You are responsible for all User Content you submit to the Services. You represent and warrant that:</p>
              <ul className="list-disc pl-6">
                <li>You own or have the necessary rights to the User Content</li>
                <li>The User Content does not infringe on the intellectual property rights of others</li>
                <li>The User Content does not violate any laws or regulations</li>
              </ul>
              <p>We have the right to remove any User Content that violates these Terms or that we find objectionable.</p>
              <p>When using our Services, you agree not to:</p>
              <ul className="list-disc pl-6">
                <li>Use the Services for illegal purposes</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Submit false or misleading information</li>
                <li>Upload or transmit viruses or malicious code</li>
                <li>Interfere with the operation of the Services</li>
                <li>Attempt to gain unauthorized access to the Services</li>
                <li>Use the Services to generate content that is harmful, abusive, or discriminatory</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Intellectual Property Rights</h2>
              <p>The Services and Planzo AI Content are protected by copyright, trademark, and other intellectual property laws. These Terms do not grant you any right, title, or interest in the Services or Planzo AI Content.</p>
              <p>You may not:</p>
              <ul className="list-disc pl-6">
                <li>Modify, reproduce, or create derivative works based on the Services or Planzo AI Content</li>
                <li>Frame or mirror any part of the Services</li>
                <li>Use meta tags or code containing our name or trademarks</li>
                <li>Reverse engineer, decompile, or disassemble the Services</li>
                <li>Access the Services to build a similar or competitive product</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
              <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
              <p>WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR SERVERS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p>IN NO EVENT SHALL PLANZO AI, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES.</p>
              <p>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICES SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICES DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
              <p>You agree to indemnify, defend, and hold harmless Planzo AI and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Services, your violation of these Terms, or your violation of any rights of another.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Modifications to Terms and Services</h2>
              <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the amended Terms on the Services and updating the "Last Updated" date. Your continued use of the Services after the changes are posted constitutes your agreement to the changes.</p>
              <p>We may modify, suspend, or discontinue the Services at any time, with or without notice.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the state of California, without regard to its conflict of law principles.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Dispute Resolution</h2>
              <p>Any dispute arising from or relating to these Terms or the Services shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in California, and judgment on the arbitration award may be entered in any court having jurisdiction thereof.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">14. Severability</h2>
              <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the Terms shall otherwise remain in full force and effect and enforceable.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">15. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p>Email: support@planzoai.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
