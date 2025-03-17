
import { 
  Lightbulb,
  BookOpen, 
  Split,
  Calendar,
  Target,
  Sparkles,
  FileVideo
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Lightbulb className="text-primary h-8 w-8" />,
      title: "AI Idea Generator",
      description: "Get endless viral-worthy video ideas specifically designed for your niche and audience.",
      image: "/lovable-uploads/6cccbc30-6b0d-48df-aefb-edcac316d83b.png",
      height: "h-[320px]", // Varying heights
    },
    {
      icon: <BookOpen className="text-primary h-8 w-8" />,
      title: "Script Generator",
      description: "Create engaging scripts optimized for short-form video performance with a few clicks.",
      image: "/lovable-uploads/ee976f87-1280-478e-8abb-0b4a424ab070.png",
      height: "h-[380px]", // Taller box
    },
    {
      icon: <FileVideo className="text-primary h-8 w-8" />,
      title: "Content Planner",
      description: "Track your production progress with our in-built progress tracker.",
      image: "/placeholder.svg",
      height: "h-[340px]", // Medium height
    },
    {
      icon: <Calendar className="text-primary h-8 w-8" />,
      title: "Content Calendar",
      description: "Plan and schedule your content with an intuitive drag-and-drop calendar interface.",
      image: "/placeholder.svg",
      height: "h-[360px]", // Another variation
    },
    {
      icon: <Target className="text-primary h-8 w-8" />,
      title: "Trend Analysis",
      description: "Stay ahead with AI-powered insights on trending topics in your content niche.",
      image: "/placeholder.svg",
      height: "h-[320px]", // Back to smaller
    },
    {
      icon: <Sparkles className="text-primary h-8 w-8" />,
      title: "Hook Generator",
      description: "Create attention-grabbing hooks that stop the scroll and increase engagement.",
      image: "/placeholder.svg",
      height: "h-[400px]", // Tallest box
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
              className={`bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md transition-all ${feature.height} flex flex-col`}
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              </div>
              
              <div className="relative rounded-lg mb-4 flex-grow overflow-hidden shadow-sm border border-gray-100">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-lg transition-transform hover:scale-105"
                />
                {/* Removed the "See examples" text from the hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity rounded-lg"></div>
              </div>
              
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
