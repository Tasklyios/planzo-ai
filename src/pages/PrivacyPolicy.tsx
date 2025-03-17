
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p>Welcome to Planzo AI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Account information (name, email address, password)</li>
                <li>Profile information (content preferences, business details)</li>
                <li>Content you create, upload, or generate using our services</li>
                <li>Communications you have with us</li>
                <li>Payment and billing information</li>
              </ul>
              
              <p>We also automatically collect certain information when you use our services:</p>
              <ul className="list-disc pl-6">
                <li>Usage data (features used, time spent on the platform)</li>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use your information for various purposes, including to:</p>
              <ul className="list-disc pl-6">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative messages, updates, and security alerts</li>
                <li>Respond to your comments and questions</li>
                <li>Provide customer support</li>
                <li>Personalize your experience</li>
                <li>Analyze how users interact with our services</li>
                <li>Develop new products and features</li>
                <li>Protect against fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. AI Features and Content Generation</h2>
              <p>Our service incorporates artificial intelligence features, including content generation. When you use these features:</p>
              <ul className="list-disc pl-6">
                <li>We collect and process the inputs you provide to generate content</li>
                <li>We may use anonymized inputs to improve our AI models</li>
                <li>Generated content may be stored in your account for your future use</li>
              </ul>
              <p>We do not claim ownership of content you generate through our AI tools, but we require certain rights to provide the service.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Sharing Your Information</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6">
                <li>Service providers who perform services on our behalf</li>
                <li>Professional advisors (lawyers, accountants, insurers)</li>
                <li>Law enforcement or other third parties when required by law</li>
                <li>In connection with a business transaction (merger, acquisition, sale of assets)</li>
                <li>With your consent or at your direction</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
              <p>We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information, such as:</p>
              <ul className="list-disc pl-6">
                <li>Access to the personal information we hold about you</li>
                <li>Correction of inaccurate or incomplete data</li>
                <li>Deletion of your personal information</li>
                <li>Restriction or objection to our processing of your data</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p>To exercise these rights, please contact us using the information provided in the "Contact Us" section.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
              <p>Our services are not directed to children under 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top. You are advised to review this Privacy Policy periodically for any changes.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <p>Email: support@planzoai.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
