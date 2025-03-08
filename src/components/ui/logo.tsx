
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Size mappings - increased sizes for better visibility
  const sizeMap = {
    small: "h-8",
    medium: "h-10",
    large: "h-12",
  };
  
  // For now, we only have light mode logo
  // Later we can add a dark mode logo with: isDarkMode ? "/dark-mode-logo.png" : "/lovable-uploads/75ca2fbe-6154-4257-8093-8e8cc5bf9038.png"
  const logoSrc = "/lovable-uploads/75ca2fbe-6154-4257-8093-8e8cc5bf9038.png";
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
