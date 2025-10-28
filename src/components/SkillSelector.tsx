import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, Plus } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface IndustrySkill {
  id: string;
  skill_name: string;
  industry: string;
  skill_type: string;
  description?: string;
}

interface SkillSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  industry?: string;
  placeholder?: string;
}

export const SkillSelector = ({ 
  selectedSkills, 
  onChange, 
  industry,
  placeholder = "Select skills..."
}: SkillSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<IndustrySkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  useEffect(() => {
    fetchSkills();
  }, [industry]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      let query = supabase.from('industry_skills').select('*');
      
      if (industry) {
        query = query.eq('industry', industry);
      }
      
      const { data, error } = await query.order('skill_name');
      
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (skillName: string) => {
    const newSkills = selectedSkills.includes(skillName)
      ? selectedSkills.filter(s => s !== skillName)
      : [...selectedSkills, skillName];
    onChange(newSkills);
  };

  const handleRemove = (skillName: string) => {
    onChange(selectedSkills.filter(s => s !== skillName));
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    
    const trimmedSkill = customSkillInput.trim();
    if (!selectedSkills.includes(trimmedSkill)) {
      onChange([...selectedSkills, trimmedSkill]);
    }
    setCustomSkillInput('');
    setSearchQuery('');
  };

  const isCustomSkill = (skillName: string) => {
    return !skills.some(s => s.skill_name === skillName);
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.skill_type]) {
      acc[skill.skill_type] = [];
    }
    acc[skill.skill_type].push(skill);
    return acc;
  }, {} as Record<string, IndustrySkill[]>);

  const filteredSkills = searchQuery
    ? skills.filter(skill => 
        skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills;

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search skills..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">No skills found in database.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom skill..."
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      className="h-9"
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleAddCustomSkill}
                      disabled={!customSkillInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CommandEmpty>
              <ScrollArea className="h-[300px]">
                {Object.entries(groupedSkills).map(([type, typeSkills]) => (
                  <CommandGroup 
                    key={type} 
                    heading={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {typeSkills
                      .filter(skill => 
                        !searchQuery || 
                        skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((skill) => (
                        <CommandItem
                          key={skill.id}
                          value={skill.skill_name}
                          onSelect={() => {
                            handleSelect(skill.skill_name);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{skill.skill_name}</span>
                            {selectedSkills.includes(skill.skill_name) && (
                              <Badge variant="secondary" className="ml-2">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                ))}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => {
            const isCustom = isCustomSkill(skill);
            return (
              <Badge 
                key={skill} 
                variant="secondary" 
                className={`gap-1 ${isCustom ? 'border-2 border-green-500' : ''}`}
              >
                {skill}
                {isCustom && (
                  <span className="text-[10px] ml-1 text-green-600 dark:text-green-400">
                    Custom
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(skill)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};