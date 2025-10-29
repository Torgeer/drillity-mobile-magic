import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageProgressBarProps {
  title: string;
  used: number;
  limit: number;
  icon?: React.ReactNode;
}

export const UsageProgressBar = ({ title, used, limit, icon }: UsageProgressBarProps) => {
  const navigate = useNavigate();
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (limit === -1) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">Unlimited</p>
            </div>
          </div>
          <p className="text-2xl font-bold">∞</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">
                {used} / {limit} used
              </p>
            </div>
          </div>
          {isNearLimit && (
            <AlertCircle className={`h-5 w-5 ${isAtLimit ? 'text-destructive' : 'text-warning'}`} />
          )}
        </div>
        
        <Progress 
          value={percentage} 
          className={isAtLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-warning/20' : undefined}
        />

        {isNearLimit && (
          <div className="flex items-center justify-between text-sm">
            <p className={isAtLimit ? 'text-destructive' : 'text-warning'}>
              {isAtLimit ? 'Limit reached!' : 'Nearing limit'}
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/subscription')}>
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
