
const Footer = () => {
  return (
    <footer className="bg-[#E5DEFF] dark:bg-dark text-[#222222] dark:text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h4 className="text-xl font-bold mb-4 text-[#9b87f5]">Planzo AI</h4>
            <p className="text-[#222222]/70 dark:text-white/70">AI-powered video content creation made easy</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">Features</span>
              </li>
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">Pricing</span>
              </li>
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">How it Works</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">About</span>
              </li>
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">Blog</span>
              </li>
              <li>
                <span className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors">Contact</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {["twitter", "instagram", "linkedin"].map((platform) => (
                <span
                  key={platform}
                  className="text-[#222222]/70 dark:text-white/70 hover:text-[#9b87f5] cursor-pointer transition-colors"
                >
                  <i className={`fa-brands fa-${platform} text-xl`}></i>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[#9b87f5]/10 mt-12 pt-8 text-center text-[#222222]/70 dark:text-white/70">
          <p>&copy; 2025 Planzo AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
