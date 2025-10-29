import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionBadgeProps {
  planName: string;
}

export const SubscriptionBadge = ({ planName }: SubscriptionBadgeProps) => {
  const navigate = useNavigate();

  const getBadgeConfig = () => {
    switch (planName) {
      case 'PREMIUM':
        return {
          icon: <Sparkles className="h-3 w-3" />,
          className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0',
        };
      case 'PRO':
        return {
          icon: <Crown className="h-3 w-3" />,
          className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
        };
      case 'BASIC':
        return {
          icon: <Zap className="h-3 w-3" />,
          className: 'bg-primary text-primary-foreground',
        };
      default:
        return {
          icon: null,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge 
      className={`cursor-pointer transition-transform hover:scale-105 ${config.className}`}
      onClick={() => navigate('/subscription')}
    >
      {config.icon}
      <span className="ml-1">{planName}</span>
    </Badge>
  );
};
