
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { useState } from "react";
import { ClientWorkflow, BudgetAllocation, formatCurrency } from "@/lib/workflow-utils";
import { Edit, Plus, TrendingDown, TrendingUp } from "lucide-react";

interface BudgetOverviewProps {
  workflows: ClientWorkflow[];
  onUpdate: (workflow: ClientWorkflow) => void;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ workflows, onUpdate }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<ClientWorkflow | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);

  const getBudgetHealth = (allocation: BudgetAllocation) => {
    const utilizationRate = allocation.allocated > 0 ? (allocation.spent / allocation.allocated) * 100 : 0;
    
    if (utilizationRate > 90) return { status: 'critical', color: 'text-red-600', icon: TrendingUp };
    if (utilizationRate > 75) return { status: 'warning', color: 'text-yellow-600', icon: TrendingUp };
    return { status: 'healthy', color: 'text-green-600', icon: TrendingDown };
  };

  const handleUpdateAllocation = (workflowId: string, allocationId: string, updates: Partial<BudgetAllocation>) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const updatedWorkflow = {
      ...workflow,
      budgetAllocations: workflow.budgetAllocations.map(allocation =>
        allocation.id === allocationId 
          ? { ...allocation, ...updates, remaining: (allocation.allocated + (updates.allocated || 0)) - (allocation.spent + (updates.spent || 0)) }
          : allocation
      )
    };

    onUpdate(updatedWorkflow);
    setEditingAllocation(null);
  };

  return (
    <div className="space-y-6">
      {workflows.map(workflow => {
        const totalAllocated = workflow.budgetAllocations.reduce((sum, a) => sum + a.allocated, 0);
        const totalSpent = workflow.budgetAllocations.reduce((sum, a) => sum + a.spent, 0);
        const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

        return (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{workflow.type.replace('-', ' ').toUpperCase()} Workflow</span>
                    <Badge variant="outline">{workflow.status}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Budget: {formatCurrency(workflow.totalBudget)} | 
                    Utilization: {utilizationRate.toFixed(1)}%
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(workflow)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Allocation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Budget Allocation</DialogTitle>
                    </DialogHeader>
                    {/* Add allocation form would go here */}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={utilizationRate} className="mb-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {workflow.budgetAllocations.map(allocation => {
                    const health = getBudgetHealth(allocation);
                    const HealthIcon = health.icon;
                    
                    return (
                      <Card key={allocation.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm capitalize">
                              {allocation.category.replace('-', ' ')}
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => setEditingAllocation(allocation)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Allocated:</span>
                              <span className="font-medium">{formatCurrency(allocation.allocated)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Spent:</span>
                              <span className={`font-medium ${health.color}`}>
                                {formatCurrency(allocation.spent)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Remaining:</span>
                              <span className={`font-medium ${allocation.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(allocation.remaining)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Progress 
                              value={allocation.allocated > 0 ? (allocation.spent / allocation.allocated) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant={health.status === 'critical' ? 'destructive' : health.status === 'warning' ? 'secondary' : 'default'}>
                              {health.status}
                            </Badge>
                            <HealthIcon className={`h-4 w-4 ${health.color}`} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Allocation Dialog */}
      <Dialog open={!!editingAllocation} onOpenChange={() => setEditingAllocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Allocation</DialogTitle>
          </DialogHeader>
          {editingAllocation && (
            <div className="space-y-4">
              <div>
                <Label>Allocated Amount</Label>
                <Input
                  type="number"
                  defaultValue={editingAllocation.allocated}
                  onChange={(e) => {
                    const workflow = workflows.find(w => 
                      w.budgetAllocations.some(a => a.id === editingAllocation.id)
                    );
                    if (workflow) {
                      handleUpdateAllocation(workflow.id, editingAllocation.id, {
                        allocated: parseFloat(e.target.value) || 0
                      });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Spent Amount</Label>
                <Input
                  type="number"
                  defaultValue={editingAllocation.spent}
                  onChange={(e) => {
                    const workflow = workflows.find(w => 
                      w.budgetAllocations.some(a => a.id === editingAllocation.id)
                    );
                    if (workflow) {
                      handleUpdateAllocation(workflow.id, editingAllocation.id, {
                        spent: parseFloat(e.target.value) || 0
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetOverview;
