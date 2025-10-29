import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: string;
  description?: string;
}

export const UpgradePrompt = ({ feature, requiredPlan, description }: UpgradePromptProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-8 text-center">
      <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{feature}</h3>
      <p className="text-muted-foreground mb-6">
        {description || `Upgrade to ${requiredPlan} to unlock this feature`}
      </p>
      <Button onClick={() => navigate('/subscription')} className="gap-2">
        <Sparkles className="h-4 w-4" />
        View Plans
      </Button>
    </Card>
  );
};
