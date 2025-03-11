
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import { useEffect } from "react";

const Index = () => {
  // Force light mode on index page
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
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
