
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const TrustBadge = () => {
  const isMobile = useIsMobile();
  
  return (
    <Badge 
      className="flex items-center gap-2 py-2 px-4 bg-gray-50 text-gray-900 rounded-full border border-gray-100 shadow-sm"
    >
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <span className="font-medium text-sm md:text-base">Helping 1k+ worldwide</span>
    </Badge>
  );
};

export default TrustBadge;
