
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
    <div className={`inline-block ${className}`}>
      <div className="relative inline-block min-w-[150px]">
        {titles.map((title, index) => (
          <motion.span
            key={index}
            className="absolute left-0 font-bold whitespace-nowrap"
            initial={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 50 }}
            animate={
              titleIndex === index
                ? {
                    y: 0,
                    opacity: 1,
                  }
                : {
                    y: titleIndex > index ? "-100%" : "100%",
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
