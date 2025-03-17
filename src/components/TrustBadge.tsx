
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TrustBadge = () => {
  return (
    <Badge 
      className="flex items-center gap-2 py-2 px-4 bg-gray-50 text-gray-900 rounded-full border border-gray-100 shadow-sm"
    >
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <span className="font-medium">Trusted by 1000s of customers and brands worldwide</span>
    </Badge>
  );
};

export default TrustBadge;
