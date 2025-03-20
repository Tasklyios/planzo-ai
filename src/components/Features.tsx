
import { 
  Lightbulb,
  BookOpen, 
  Calendar,
  Layers,
  Sparkles,
  FileVideo
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const Features = () => {
  const features = [
    {
      icon: <Lightbulb className="text-primary h-8 w-8" />,
      title: "AI Idea Generator",
      description: "Get endless viral-worthy video ideas specifically designed for your niche and audience.",
      image: "/lovable-uploads/6cccbc30-6b0d-48df-aefb-edcac316d83b.png",
    },
    {
      icon: <BookOpen className="text-primary h-8 w-8" />,
      title: "Script Generator",
      description: "Create engaging scripts optimized for short-form video performance with a few clicks.",
      image: "/lovable-uploads/ee976f87-1280-478e-8abb-0b4a424ab070.png",
    },
    {
      icon: <FileVideo className="text-primary h-8 w-8" />,
      title: "Content Planner",
      description: "Track your production progress with our in-built progress tracker.",
      image: "/lovable-uploads/f0d4f71c-2d30-4ea0-aa6e-e7c6a73a896f.png",
    },
    {
      icon: <Calendar className="text-primary h-8 w-8" />,
      title: "Content Calendar",
      description: "Plan and schedule your content with an intuitive drag-and-drop calendar interface.",
      image: "/lovable-uploads/7adf90d6-42f1-4b14-a7ad-f173e2e3d7a1.png",
    },
    {
      icon: <Layers className="text-primary h-8 w-8" />,
      title: "Multi-use Platform",
      description: "Tailored for personal branders, ecommerce, business owners and marketers - the go-to for all areas of social media.",
      image: "/lovable-uploads/198b073e-82cd-4021-ba1c-c7e7593c723c.png",
    },
    {
      icon: <Sparkles className="text-primary h-8 w-8" />,
      title: "Hook Generator",
      description: "Create attention-grabbing hooks that stop the scroll and increase engagement.",
      image: "/lovable-uploads/e9483604-946a-4c32-b18e-13a6fb81d464.png",
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Create
            <span className="block"><span className="bg-gradient-to-r from-[#2582ff] to-[#2582ff]/80 bg-clip-text text-transparent">Viral-Worthy</span> Content</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our all-in-one platform gives creators the tools they need to ideate, create, and plan engaging video content
          </p>
        </div>
        
        <BentoGrid className="max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <BentoGridItem
              key={index}
              title={
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-50 p-2 rounded-lg">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
              }
              description={<p className="text-gray-600">{feature.description}</p>}
              className={`md:col-span-${index === 4 || index === 5 ? '2' : '1'} ${index % 3 === 0 ? 'md:row-span-2' : ''}`}
            >
              <div className="relative rounded-lg mt-6 flex-grow overflow-hidden shadow-sm border border-gray-100 h-48 md:h-64">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-lg transition-transform hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity rounded-lg"></div>
              </div>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
};

export default Features;
