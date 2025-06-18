
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface BudgetAllocation {
  id: string;
  department: string;
  platform: string;
  allocated_amount: string;
}

interface BudgetSectionProps {
  budgetAllocations: BudgetAllocation[];
  onBudgetChange: (budgetAllocations: BudgetAllocation[]) => void;
}

const BudgetSection = ({ budgetAllocations, onBudgetChange }: BudgetSectionProps) => {
  const [newBudget, setNewBudget] = useState<BudgetAllocation>({
    id: "",
    department: "",
    platform: "",
    allocated_amount: "",
  });

  const departments = [
    { value: "content_creation", label: "Content Creation" },
    { value: "influencers", label: "Influencers" },
    { value: "paid_media", label: "Paid Media" },
  ];

  const platforms = [
    { value: "meta", label: "Meta" },
    { value: "tiktok", label: "TikTok" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
    { value: "shorts", label: "Shorts" },
    { value: "google", label: "Google" },
    { value: "other", label: "Other" },
  ];

  const addBudgetAllocation = () => {
    if (newBudget.department && newBudget.allocated_amount) {
      const budgetWithId = {
        ...newBudget,
        id: Date.now().toString(),
      };
      onBudgetChange([...budgetAllocations, budgetWithId]);
      setNewBudget({
        id: "",
        department: "",
        platform: "",
        allocated_amount: "",
      });
    }
  };

  const removeBudgetAllocation = (id: string) => {
    onBudgetChange(budgetAllocations.filter(b => b.id !== id));
  };

  const getTotalBudget = () => {
    return budgetAllocations.reduce((total, budget) => {
      return total + (parseFloat(budget.allocated_amount) || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Department</Label>
          <Select
            value={newBudget.department}
            onValueChange={(value) => setNewBudget({ ...newBudget, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Platform (Optional)</Label>
          <Select
            value={newBudget.platform}
            onValueChange={(value) => setNewBudget({ ...newBudget, platform: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Allocated Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={newBudget.allocated_amount}
            onChange={(e) => setNewBudget({ ...newBudget, allocated_amount: e.target.value })}
            placeholder="Enter amount"
          />
        </div>
      </div>

      <Button 
        onClick={addBudgetAllocation} 
        disabled={!newBudget.department || !newBudget.allocated_amount}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Budget Allocation
      </Button>

      {budgetAllocations.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Budget Allocations</Label>
            <div className="text-sm font-medium">
              Total: ${getTotalBudget().toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-2">
            {budgetAllocations.map((budget) => (
              <Card key={budget.id}>
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium">
                      {departments.find(d => d.value === budget.department)?.label}
                      {budget.platform && ` - ${platforms.find(p => p.value === budget.platform)?.label}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${parseFloat(budget.allocated_amount).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBudgetAllocation(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSection;
