
import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { CheckCircle, Sparkles, Calendar, PenSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HowItWorks = () => {
  const isMobile = useIsMobile();
  
  const timelineData = [
    {
      title: "Generate Ideas",
      content: (
        <div>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-normal mb-6">
            Tell our AI about your niche, audience, and content preferences to instantly get 
            tailored video ideas that resonate with your followers.
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Niche-specific suggestions based on trending topics</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Viral hook ideas that capture attention in seconds</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Customizable formats for different platforms</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">AI-Powered</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our AI analyzes trending content across platforms to suggest ideas with high engagement potential
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <PenSquare className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Editable</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Easily customize any generated idea to match your unique style and brand voice
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create Scripts",
      content: (
        <div>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-normal mb-6">
            Transform your ideas into engaging scripts with our AI writer. Craft compelling 
            narratives that keep viewers watching from start to finish.
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Natural, conversational tone that connects with viewers</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Optimized structure for maximum engagement</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Customizable length and style to match your content</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Hook Library</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Access a growing library of proven hooks that grab viewer attention in the crucial first seconds
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <PenSquare className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Structure Options</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose from multiple script structures proven to drive engagement and watch time
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Plan & Schedule",
      content: (
        <div>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-normal mb-6">
            Organize your content pipeline with our intuitive planner. Drag and drop ideas 
            into your content calendar to maintain a consistent posting schedule.
          </p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Visual content calendar for easy scheduling</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Publish reminders to keep you on track</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>Performance tracking to optimize your content strategy</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Content Calendar</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Visualize your upcoming content and ensure consistent posting with our drag-and-drop calendar
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track which content types perform best so you can focus on what drives growth
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // For mobile devices, we'll use a simplified version
  if (isMobile) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How <span className="bg-gradient-to-r from-[#2582ff] to-[#2582ff]/80 bg-clip-text text-transparent">Planzo AI</span> Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your content creation process
            </p>
          </div>
          
          <div className="space-y-12">
            {timelineData.map((step, index) => (
              <div key={index} className="border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                </div>
                {step.content}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // For desktop, we use the Timeline component
  return <Timeline data={timelineData} />;
};

export default HowItWorks;
