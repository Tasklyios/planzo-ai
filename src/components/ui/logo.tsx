
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Size mappings
  const sizeMap = {
    small: "h-6",
    medium: "h-8",
    large: "h-10",
  };
  
  // For now, we only have light mode logo
  // Later we can add a dark mode logo with: isDarkMode ? "/lovable-uploads/dark-mode-logo.png" : "/lovable-uploads/7eb60153-1396-4d32-917b-878e2f36ae38.png"
  const logoSrc = "/lovable-uploads/7eb60153-1396-4d32-917b-878e2f36ae38.png";
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
