
import { CheckCircle } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Generate Ideas",
      description: "Tell our AI about your niche, style, and preferences, and instantly get video ideas tailored to your audience.",
      highlights: ["Niche-specific suggestions", "Trend-aware recommendations", "Customizable formats"]
    },
    {
      number: "02",
      title: "Create Scripts",
      description: "Turn your ideas into engaging scripts with our AI writer. Perfect for narration, dialogue, or text overlay videos.",
      highlights: ["Conversational tone", "Optimized for engagement", "Adjustable length and style"]
    },
    {
      number: "03",
      title: "Plan & Schedule",
      description: "Organize your content pipeline with our intuitive planner. Drag and drop ideas into your content calendar.",
      highlights: ["Visual content calendar", "Publishing reminders", "Performance tracking"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How <span className="bg-gradient-to-r from-[#2582ff] to-[#2582ff]/80 bg-clip-text text-transparent">Planzo AI</span> Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to transform your content creation process
          </p>
        </div>
        
        <BentoGrid className="max-w-6xl mx-auto md:grid-cols-3">
          {steps.map((step, index) => (
            <BentoGridItem
              key={index}
              title={
                <div className="flex items-center">
                  <span className="font-bold text-4xl text-primary/20">{step.number}</span>
                  <h3 className="text-2xl font-bold text-gray-900 ml-3">{step.title}</h3>
                </div>
              }
              description={<p className="text-gray-600">{step.description}</p>}
              className="hover:shadow-md transition-shadow bg-white rounded-xl p-6 border border-gray-100"
            >
              <div className="mt-6 space-y-2">
                {step.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
};

export default HowItWorks;
