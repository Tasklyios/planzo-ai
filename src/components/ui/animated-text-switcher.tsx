
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnimatedTextSwitcherProps {
  titles: string[];
  interval?: number;
  className?: string;
}

export function AnimatedTextSwitcher({ 
  titles, 
  interval = 2000, 
  className = "" 
}: AnimatedTextSwitcherProps) {
  const [titleIndex, setTitleIndex] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleIndex === titles.length - 1) {
        setTitleIndex(0);
      } else {
        setTitleIndex(titleIndex + 1);
      }
    }, interval);
    return () => clearTimeout(timeoutId);
  }, [titleIndex, titles, interval]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative min-w-[150px] min-h-[40px] flex justify-center">
        {titles.map((title, index) => (
          <motion.span
            key={index}
            className={`absolute font-bold whitespace-nowrap ${isMobile ? 'text-4xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 100 }}
            animate={
              titleIndex === index
                ? {
                    y: 0,
                    opacity: 1,
                  }
                : {
                    y: titleIndex > index ? -20 : 20,
                    opacity: 0,
                  }
            }
          >
            {title}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
