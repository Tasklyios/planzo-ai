
import {
  Lightbulb,
  LayersIcon,
  Users,
  Video,
  Smartphone,
  Wand2,
  Filter,
  ArrowDownWideNarrow,
  CalendarPlus,
  PenSquare,
  User,
  CreditCard,
  LogOut,
  Menu,
} from "lucide-react";

export const IconMap = {
  Lightbulb,
  LayersIcon,
  Users,
  Video,
  Smartphone,
  Wand2,
  Filter,
  ArrowDownWideNarrow,
  CalendarPlus,
  PenSquare,
  User,
  CreditCard,
  LogOut,
  Menu,
} as const;

export interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
  symbol?: keyof typeof IconMap;
  color?: string;
}

export interface AddToCalendarIdea {
  idea: GeneratedIdea;
  title: string;
  scheduledFor: string;
}
