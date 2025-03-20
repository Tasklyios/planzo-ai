
import { Testimonial } from "@/components/ui/testimonial-card";

const testimonials = [
  {
    name: "Jessica T.",
    role: "TikTok Creator",
    company: "500K+ followers",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    testimonial: "Planzo AI has completely transformed how I approach content creation. I've doubled my output while actually reducing my planning time!"
  },
  {
    name: "Michael R.",
    role: "YouTube Shorts Creator",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    testimonial: "The idea generator alone is worth the subscription. I was spending hours brainstorming, now I have weeks of content ideas in minutes."
  },
  {
    name: "Sarah K.",
    role: "Digital Content Agency",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    testimonial: "As a content agency, we've been able to scale our output by 3x using Planzo AI for our clients. The ROI is incredible."
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by Content Creators
          </h2>
          <p className="text-xl text-gray-600">
            Hear from creators who've transformed their content strategy with Planzo AI
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Testimonial 
              key={testimonial.name} 
              {...testimonial} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
