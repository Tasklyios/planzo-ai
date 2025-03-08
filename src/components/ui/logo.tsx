
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Size mappings - reduced by 15% from previous sizes
  const sizeMap = {
    small: "h-7", // ~28px (reduced from h-8 which is 32px)
    medium: "h-8.5", // ~34px (reduced from h-10 which is 40px)
    large: "h-10", // ~40px (reduced from h-12 which is 48px)
  };
  
  // For now, we only have light mode logo
  // Later we can add a dark mode logo with: isDarkMode ? "/dark-mode-logo.png" : "/lovable-uploads/8c458d9d-037f-4dbe-8a47-782b5bd31a4a.png"
  const logoSrc = "/lovable-uploads/8c458d9d-037f-4dbe-8a47-782b5bd31a4a.png";
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
