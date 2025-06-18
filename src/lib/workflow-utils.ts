
export type WorkflowType = 'paid-media' | 'influencer' | 'production' | 'sales' | 'general';

export type WorkflowStatus = 
  | 'discovery' 
  | 'proposal' 
  | 'approved' 
  | 'in-progress' 
  | 'review' 
  | 'completed' 
  | 'on-hold';

export type BudgetAllocation = {
  id: string;
  category: 'media-spend' | 'production' | 'influencer-fees' | 'management-fee';
  allocated: number;
  spent: number;
  remaining: number;
};

export type Meeting = {
  id: string;
  title: string;
  type: 'discovery' | 'proposal' | 'review' | 'kickoff' | 'check-in';
  date: string;
  duration: number; // minutes
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
};

export type Campaign = {
  id: string;
  name: string;
  type: 'paid-social' | 'paid-search' | 'display' | 'influencer' | 'organic';
  platform: string[];
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  kpis: Record<string, number>;
};

export type ClientWorkflow = {
  id: string;
  projectId: string;
  type: WorkflowType;
  status: WorkflowStatus;
  totalBudget: number;
  budgetAllocations: BudgetAllocation[];
  campaigns: Campaign[];
  meetings: Meeting[];
  nextMilestone?: {
    title: string;
    dueDate: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
};

export const workflowStatuses = [
  { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { id: 'approved', label: 'Approved', color: 'bg-green-500' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
  { id: 'review', label: 'Review', color: 'bg-orange-500' },
  { id: 'completed', label: 'Completed', color: 'bg-gray-500' },
  { id: 'on-hold', label: 'On Hold', color: 'bg-red-500' }
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};

export const calculateBudgetUtilization = (allocations: BudgetAllocation[]): number => {
  const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.allocated, 0);
  const totalSpent = allocations.reduce((sum, allocation) => sum + allocation.spent, 0);
  
  return totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
};
