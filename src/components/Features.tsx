
import { 
  MessageSquare,
  Mic, 
  BookOpen, 
  Split,
  Image,
  Download,
  Speaker
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: <MessageSquare className="text-[#0073FF]" size={24} />,
      title: "Fake Texts Videos",
      description: "Have an idea for a convo that would go viral? Make it into a full video in just a few clicks.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/messages-screenshot.png"
    },
    {
      icon: <Mic className="text-[#0073FF]" size={24} />,
      title: "Generate AI Voiceovers",
      description: "It's never been easier to make the AI-narrated videos you see on your timeline.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/voiceover-interface.png"
    },
    {
      icon: <BookOpen className="text-[#0073FF]" size={24} />,
      title: "Create Reddit Story Videos",
      description: "Write your own script or generate one auto-magically from a Reddit link.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/reddit-interface.png"
    },
    {
      icon: <Split className="text-[#0073FF]" size={24} />,
      title: "Create Split-Screen Videos",
      description: "Make your clips more engaging by showing them beside premium gameplay.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/split-screen.png"
    },
    {
      icon: <Image className="text-[#0073FF]" size={24} />,
      title: "Text-to-Image Videos",
      description: "Generate images for your videos with text prompts.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/text-to-image.png"
    },
    {
      icon: <Download className="text-[#0073FF]" size={24} />,
      title: "Download TikTok & Youtube Videos",
      description: "Avoid sketchy sites and get content for your next video.",
      image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/download-interface.png"
    }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {feature.icon}
                  <CardTitle className="text-xl text-navy-blue">
                    {feature.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-48 object-cover rounded-b-lg"
                  loading="lazy"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
