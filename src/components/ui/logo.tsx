
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Size mappings - reduced all sizes by 10%
  const sizeMap = {
    small: "h-6", // Reduced from h-7 (28px to ~25px)
    medium: "h-8", // Reduced from h-9 (36px to ~32px)
    large: "h-9", // Reduced from h-10 (40px to ~36px)
  };
  
  // Use different logo sources based on theme
  const lightLogoSrc = "/lovable-uploads/8c458d9d-037f-4dbe-8a47-782b5bd31a4a.png";
  const darkLogoSrc = "/lovable-uploads/78cc2940-cde9-4f20-9699-976d0f67c1ea.png";
  
  const logoSrc = isDarkMode ? darkLogoSrc : lightLogoSrc;
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
