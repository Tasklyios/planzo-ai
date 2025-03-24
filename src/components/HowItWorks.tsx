
import React from "react";
import { Timeline } from "@/components/ui/timeline";

const HowItWorks = () => {
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
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Niche-specific suggestions based on trending topics</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Viral hook ideas that capture attention in seconds</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Customizable formats for different platforms</span>
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
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Natural, conversational tone that connects with viewers</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Optimized structure for maximum engagement</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Customizable length and style to match your content</span>
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
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Visual content calendar for easy scheduling</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Publish reminders to keep you on track</span>
            </div>
            <div className="flex gap-2 items-center text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
              <span>Performance tracking to optimize your content strategy</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Use the Timeline component for both mobile and desktop
  return <Timeline data={timelineData} />;
};

export default HowItWorks;
