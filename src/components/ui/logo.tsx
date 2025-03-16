
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
    small: "h-7", // 28px
    medium: "h-8", // 32px
    large: "h-10", // 40px
  };
  
  // Use different logo sources based on theme
  const lightLogoSrc = "/lovable-uploads/8c458d9d-037f-4dbe-8a47-782b5bd31a4a.png";
  const darkLogoSrc = "/lovable-uploads/76ed71b9-cb94-48eb-acd1-a0326fc07c10.png";
  
  const logoSrc = isDarkMode ? darkLogoSrc : lightLogoSrc;
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
