
const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-[#E5F0FF] to-[#33C3F0]/30 pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-dark leading-tight">
              AI-Powered Video Creation Made Easy
            </h1>
            <p className="text-xl text-dark/80">
              Generate viral video ideas & scripts in seconds with Planzo AI
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 blue-gradient rounded-lg transition-colors">Try for Free</button>
              <button className="px-6 py-3 border border-[#0073FF] text-[#0073FF] hover:bg-[#E5F0FF] rounded-lg transition-colors">Watch Demo</button>
            </div>
          </div>
          <div className="flex-1 fade-up">
            <img
              className="rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3516410965-89c7ff372bd4166625c6.png"
              alt="Planzo AI Dashboard"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
