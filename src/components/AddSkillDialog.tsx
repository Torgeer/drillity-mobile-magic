import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Enums } from "@/integrations/supabase/types";

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  skillName: string;
  onSuccess: () => void;
}

export const AddSkillDialog = ({ open, onOpenChange, userId, skillName, onSuccess }: AddSkillDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skillLevel, setSkillLevel] = useState<Enums<"experience_level">>("intermediate");

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('talent_skills')
        .insert({
          talent_id: userId,
          skill_name: skillName,
          skill_level: skillLevel,
        });

      if (error) throw error;

      toast({
        title: "Skill added",
        description: `${skillName} has been added to your skills.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill: {skillName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="skill-level">Skill Level</Label>
            <Select value={skillLevel} onValueChange={(value) => setSkillLevel(value as Enums<"experience_level">)}>
              <SelectTrigger id="skill-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
