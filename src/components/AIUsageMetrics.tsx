import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Clock, DollarSign } from "lucide-react";

interface AIUsageData {
  total_matches: number;
  total_cost: number;
  free_matches: number;
  paid_matches: number;
  time_saved_hours: number;
}

export const AIUsageMetrics = ({ companyId }: { companyId: string }) => {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<AIUsageData>({
    total_matches: 0,
    total_cost: 0,
    free_matches: 0,
    paid_matches: 0,
    time_saved_hours: 0
  });

  useEffect(() => {
    fetchUsageData();
  }, [companyId]);

  const fetchUsageData = async () => {
    try {
      // Get this month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_match_usage')
        .select('*')
        .eq('company_id', companyId)
        .gte('executed_at', startOfMonth.toISOString());

      if (error) throw error;

      if (data) {
        const totalMatches = data.reduce((sum, item) => sum + item.matches_found, 0);
        const totalCost = data.reduce((sum, item) => sum + Number(item.cost_estimate), 0);
        const freeMatches = data.filter(item => item.was_free).length;
        const paidMatches = data.length - freeMatches;
        const timeSaved = totalMatches * 2; // Estimate 2 hours saved per match

        setUsage({
          total_matches: totalMatches,
          total_cost: totalCost,
          free_matches: freeMatches,
          paid_matches: paidMatches,
          time_saved_hours: timeSaved
        });
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading metrics...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Matching This Month</h3>
        <Badge variant="secondary">{usage.total_matches} candidates matched</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="h-4 w-4" />
            <span>Time Saved</span>
          </div>
          <p className="text-2xl font-bold">{usage.time_saved_hours}h</p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ €{(usage.time_saved_hours * 50).toLocaleString()} in labor
          </p>
        </div>

        <div className="bg-background/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="h-4 w-4" />
            <span>AI Cost</span>
          </div>
          <p className="text-2xl font-bold">€{usage.total_cost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {usage.free_matches} free, {usage.paid_matches} paid
          </p>
        </div>

        <div className="bg-background/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>ROI</span>
          </div>
          <p className="text-2xl font-bold">
            {usage.total_cost > 0 
              ? `${Math.round((usage.time_saved_hours * 50) / usage.total_cost * 100)}%`
              : '∞'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cost savings ratio</p>
        </div>

        <div className="bg-background/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Efficiency</span>
          </div>
          <p className="text-2xl font-bold">{usage.total_matches}</p>
          <p className="text-xs text-muted-foreground mt-1">AI-matched candidates</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          💰 You've saved approximately €{((usage.time_saved_hours * 50) - usage.total_cost).toFixed(0)} this month with AI matching!
        </p>
      </div>
    </Card>
  );
};