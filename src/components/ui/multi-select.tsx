
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: Option[];
  onChange: (value: Option[]) => void;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (option: Option) => {
    const isSelected = value.some((item) => item.value === option.value);
    if (isSelected) {
      onChange(value.filter((item) => item.value !== option.value));
    } else {
      onChange([...value, option]);
    }
  };

  const removeValue = (optionToRemove: Option, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((option) => option.value !== optionToRemove.value));
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((option) => (
            <span
              key={option.value}
              className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center gap-1"
            >
              {option.label}
              <X
                className="h-4 w-4 hover:text-destructive"
                onClick={(e) => !disabled && removeValue(option, e)}
              />
            </span>
          ))}
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-popover rounded-md border shadow-md">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-accent",
                value.some((item) => item.value === option.value) &&
                  "bg-accent"
              )}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
