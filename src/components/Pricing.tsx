
import { Check } from "lucide-react";

const Pricing = () => {
  return (
    <section className="bg-light-bg py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-16 fade-up">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 fade-up">
            <h3 className="text-2xl font-bold text-dark mb-2">Free</h3>
            <p className="text-dark/70 mb-6">Perfect to get started</p>
            <div className="text-4xl font-bold text-dark mb-8">
              $0<span className="text-lg font-normal text-dark/70">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="text-primary mr-2" size={20} />
                5 AI video ideas/month
              </li>
              <li className="flex items-center">
                <Check className="text-primary mr-2" size={20} />
                Basic script generator
              </li>
              <li className="flex items-center">
                <Check className="text-primary mr-2" size={20} />
                Simple calendar
              </li>
            </ul>
            <button className="w-full btn-secondary">Get Started</button>
          </div>
          <div className="bg-primary p-8 rounded-2xl shadow-lg text-white fade-up" style={{ animationDelay: "100ms" }}>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-white/70 mb-6">For serious creators</p>
            <div className="text-4xl font-bold mb-8">
              $29<span className="text-lg font-normal opacity-70">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="mr-2" size={20} />
                Unlimited AI video ideas
              </li>
              <li className="flex items-center">
                <Check className="mr-2" size={20} />
                Advanced script generator
              </li>
              <li className="flex items-center">
                <Check className="mr-2" size={20} />
                Full calendar features
              </li>
              <li className="flex items-center">
                <Check className="mr-2" size={20} />
                Analytics & insights
              </li>
            </ul>
            <button className="w-full bg-white text-primary hover:bg-white/90 transition-all duration-300 py-3 rounded-full">
              Get Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
