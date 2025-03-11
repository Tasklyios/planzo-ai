
import { useState } from "react";

const testimonials = [
  {
    quote: "Planzo AI has completely transformed how I approach content creation. I've doubled my output while actually reducing my planning time!",
    author: "Jessica T.",
    role: "TikTok Creator, 500K+ followers",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    quote: "The idea generator alone is worth the subscription. I was spending hours brainstorming, now I have weeks of content ideas in minutes.",
    author: "Michael R.",
    role: "YouTube Shorts Creator",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    quote: "As a content agency, we've been able to scale our output by 3x using Planzo AI for our clients. The ROI is incredible.",
    author: "Sarah K.",
    role: "Digital Content Agency",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Content Creators
            </h2>
            <p className="text-xl text-gray-600">
              Hear from creators who've transformed their content strategy with Planzo AI
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <p className="text-xl md:text-2xl text-gray-800 mb-8 italic">
              "{testimonials[activeIndex].quote}"
            </p>
            <div className="flex items-center">
              <img 
                src={testimonials[activeIndex].avatar} 
                alt={testimonials[activeIndex].author} 
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-bold text-gray-900">{testimonials[activeIndex].author}</h4>
                <p className="text-gray-600 text-sm">{testimonials[activeIndex].role}</p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeIndex ? "bg-primary" : "bg-gray-300"
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
