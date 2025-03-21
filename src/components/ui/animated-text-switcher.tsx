
import { useEffect, useMemo, useState } from "react";
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
    <span className={`relative flex w-full justify-center overflow-hidden text-center ${className}`}>
      {titles.map((title, index) => (
        <motion.span
          key={index}
          className="absolute font-semibold"
          initial={{ opacity: 0, y: "100px" }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={
            titleIndex === index
              ? {
                  y: 0,
                  opacity: 1,
                }
              : {
                  y: titleIndex > index ? -150 : 150,
                  opacity: 0,
                }
          }
        >
          {title}
        </motion.span>
      ))}
    </span>
  );
}
