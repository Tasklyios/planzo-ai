
import { 
  Calendar as CalendarIcon,
  Video,
  Check,
  Heart,
  Star,
  Music,
  Image,
  Film,
  BookOpen,
  Camera,
  Palette
} from "lucide-react";

export const availableSymbols = [
  { name: 'calendar', icon: CalendarIcon },
  { name: 'video', icon: Video },
  { name: 'check', icon: Check },
  { name: 'heart', icon: Heart },
  { name: 'star', icon: Star },
  { name: 'music', icon: Music },
  { name: 'image', icon: Image },
  { name: 'film', icon: Film },
  { name: 'book', icon: BookOpen },
  { name: 'camera', icon: Camera },
  { name: 'palette', icon: Palette }
] as const;

export const availableColors = [
  { 
    name: 'red', 
    class: 'bg-red-500 hover:bg-red-600 border-red-400',
    gradient: 'bg-gradient-to-br from-red-200 to-red-300 border-red-200',
    accent: 'bg-red-500'
  },
  { 
    name: 'orange', 
    class: 'bg-orange-500 hover:bg-orange-600 border-orange-400',
    gradient: 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-200',
    accent: 'bg-orange-500'
  },
  { 
    name: 'yellow', 
    class: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400',
    gradient: 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-200',
    accent: 'bg-yellow-500'
  },
  { 
    name: 'green', 
    class: 'bg-green-500 hover:bg-green-600 border-green-400',
    gradient: 'bg-gradient-to-br from-green-200 to-green-300 border-green-200',
    accent: 'bg-green-500'
  },
  { 
    name: 'blue', 
    class: 'bg-blue-500 hover:bg-blue-600 border-blue-400',
    gradient: 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-200',
    accent: 'bg-blue-500'
  },
  { 
    name: 'purple', 
    class: 'bg-purple-500 hover:bg-purple-600 border-purple-400',
    gradient: 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-200',
    accent: 'bg-purple-500'
  },
  { 
    name: 'pink', 
    class: 'bg-pink-500 hover:bg-pink-600 border-pink-400',
    gradient: 'bg-gradient-to-br from-pink-200 to-pink-300 border-pink-200',
    accent: 'bg-pink-500'
  },
  { 
    name: 'indigo', 
    class: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400',
    gradient: 'bg-gradient-to-br from-indigo-200 to-indigo-300 border-indigo-200',
    accent: 'bg-indigo-500'
  },
] as const;

export const getColorClasses = (color: string | undefined, variant: 'solid' | 'gradient' | 'accent' = 'solid') => {
  const colorConfig = availableColors.find(c => c.name === color);
  if (!color || !colorConfig) return 'bg-gray-100 border-gray-200 hover:bg-gray-200';
  return variant === 'gradient' ? colorConfig.gradient : 
         variant === 'accent' ? colorConfig.accent : 
         colorConfig.class;
};
