
import { Lightbulb, PenTool, Calendar } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Lightbulb className="text-primary" size={24} />,
      title: "AI Video Ideas",
      description: "Generate trending video ideas based on your niche and target audience",
    },
    {
      icon: <PenTool className="text-primary" size={24} />,
      title: "AI Script Generator",
      description: "Create engaging video scripts with hooks and CTAs in seconds",
    },
    {
      icon: <Calendar className="text-primary" size={24} />,
      title: "Content Calendar",
      description: "Plan and schedule your videos across multiple platforms",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-16 fade-up">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-light-bg p-8 rounded-2xl hover:shadow-lg transition-all duration-300 fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">{feature.title}</h3>
              <p className="text-dark/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
