
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type UsageType = "ideas" | "scripts" | "hooks";

interface UsageItemProps {
  title: string;
  current: number;
  max: number;
  type: UsageType;
}

const UsageItem = ({ title, current, max, type }: UsageItemProps) => {
  const percentage = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
  
  // Different colors based on usage percentage
  const getProgressColor = () => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">
          {current}/{max}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${getProgressColor()}`}
      />
    </div>
  );
};

interface UsageProgressCardProps {
  tierName: string;
  usageData: {
    ideas: { current: number; max: number };
    scripts: { current: number; max: number };
    hooks: { current: number; max: number };
  };
  isLoading?: boolean;
}

const UsageProgressCard = ({
  tierName,
  usageData,
  isLoading = false
}: UsageProgressCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Usage</CardTitle>
        <CardDescription>
          Your usage limits for {tierName} plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <div className="h-6 rounded bg-muted animate-pulse mb-1"></div>
            <div className="h-2 rounded bg-muted animate-pulse mb-4"></div>
            <div className="h-6 rounded bg-muted animate-pulse mb-1"></div>
            <div className="h-2 rounded bg-muted animate-pulse mb-4"></div>
            <div className="h-6 rounded bg-muted animate-pulse mb-1"></div>
            <div className="h-2 rounded bg-muted animate-pulse"></div>
          </>
        ) : (
          <>
            <UsageItem 
              title="Ideas Generated" 
              current={usageData.ideas.current} 
              max={usageData.ideas.max} 
              type="ideas" 
            />
            <Separator className="my-2" />
            <UsageItem 
              title="Scripts Generated" 
              current={usageData.scripts.current} 
              max={usageData.scripts.max} 
              type="scripts" 
            />
            <Separator className="my-2" />
            <UsageItem 
              title="Hooks Generated" 
              current={usageData.hooks.current} 
              max={usageData.hooks.max} 
              type="hooks" 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageProgressCard;
