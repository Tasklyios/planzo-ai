
import { 
  MessageSquare,
  Mic, 
  BookOpen, 
  Split,
  Image,
  Download,
  Calendar,
  Lightbulb,
  Sparkles,
  Target
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Lightbulb className="text-primary h-8 w-8" />,
      title: "AI Idea Generator",
      description: "Get endless viral-worthy video ideas specifically designed for your niche and audience.",
    },
    {
      icon: <BookOpen className="text-primary h-8 w-8" />,
      title: "Script Generator",
      description: "Create engaging scripts optimized for short-form video performance with a few clicks.",
    },
    {
      icon: <Mic className="text-primary h-8 w-8" />,
      title: "AI Voiceovers",
      description: "Generate natural-sounding voiceovers for your videos in multiple languages and styles.",
    },
    {
      icon: <Calendar className="text-primary h-8 w-8" />,
      title: "Content Calendar",
      description: "Plan and schedule your content with an intuitive drag-and-drop calendar interface.",
    },
    {
      icon: <Target className="text-primary h-8 w-8" />,
      title: "Trend Analysis",
      description: "Stay ahead with AI-powered insights on trending topics in your content niche.",
    },
    {
      icon: <Sparkles className="text-primary h-8 w-8" />,
      title: "Hook Generator",
      description: "Create attention-grabbing hooks that stop the scroll and increase engagement.",
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Create
            <span className="block">Viral-Worthy Content</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our all-in-one platform gives creators the tools they need to ideate, create, and plan engaging video content
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-100 rounded-xl p-8 hover:shadow-md transition-shadow"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
