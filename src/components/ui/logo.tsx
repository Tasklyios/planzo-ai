
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Logo({ className = "", size = "medium" }: LogoProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Size mappings - updated medium size to be larger
  const sizeMap = {
    small: "h-7", // 28px
    medium: "h-9", // 36px - increased from 32px
    large: "h-10", // 40px
  };
  
  // Use different logo sources based on theme
  const lightLogoSrc = "/lovable-uploads/8c458d9d-037f-4dbe-8a47-782b5bd31a4a.png";
  const darkLogoSrc = "/lovable-uploads/56f1a5a2-17d9-40ac-bfe2-e624875b2184.png";
  
  const logoSrc = isDarkMode ? darkLogoSrc : lightLogoSrc;
  
  return (
    <img 
      src={logoSrc} 
      alt="PlanzoAI Logo" 
      className={`${sizeMap[size]} ${className}`}
    />
  );
}
