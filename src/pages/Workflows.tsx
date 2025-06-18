
import { useState } from 'react';
import Dashboard from "@/components/layout/Dashboard";
import WorkflowManager from "@/components/workflow/WorkflowManager";
import { ClientWorkflow, WorkflowType } from "@/lib/workflow-utils";

// Sample workflow data - in a real app this would come from your backend
const sampleWorkflows: ClientWorkflow[] = [
  {
    id: "wf-1",
    projectId: "proj-1",
    type: "paid-media",
    status: "in-progress",
    totalBudget: 50000,
    budgetAllocations: [
      {
        id: "ba-1",
        category: "media-spend",
        allocated: 35000,
        spent: 15000,
        remaining: 20000
      },
      {
        id: "ba-2",
        category: "management-fee",
        allocated: 15000,
        spent: 5000,
        remaining: 10000
      }
    ],
    campaigns: [
      {
        id: "camp-1",
        name: "Summer Social Campaign",
        type: "paid-social",
        platform: ["Facebook", "Instagram"],
        budget: 25000,
        spent: 12000,
        startDate: "2024-06-01",
        endDate: "2024-08-31",
        status: "active",
        kpis: {
          impressions: 125000,
          clicks: 2500,
          conversions: 150
        }
      }
    ],
    meetings: [
      {
        id: "meet-1",
        title: "Campaign Strategy Review",
        type: "review",
        date: "2024-06-25T14:00:00",
        duration: 60,
        attendees: ["client@example.com", "manager@agency.com"],
        status: "scheduled",
        notes: "Review Q2 performance and Q3 strategy"
      }
    ],
    nextMilestone: {
      title: "Q3 Campaign Launch",
      dueDate: "2024-07-01",
      description: "Launch new product campaign for Q3"
    },
    createdAt: "2024-05-01T10:00:00Z",
    updatedAt: "2024-06-18T12:00:00Z"
  },
  {
    id: "wf-2",
    projectId: "proj-2",
    type: "influencer",
    status: "proposal",
    totalBudget: 30000,
    budgetAllocations: [
      {
        id: "ba-3",
        category: "influencer-fees",
        allocated: 25000,
        spent: 0,
        remaining: 25000
      },
      {
        id: "ba-4",
        category: "management-fee",
        allocated: 5000,
        spent: 0,
        remaining: 5000
      }
    ],
    campaigns: [
      {
        id: "camp-2",
        name: "Influencer Collaboration",
        type: "influencer",
        platform: ["Instagram", "TikTok"],
        budget: 25000,
        spent: 0,
        startDate: "2024-07-15",
        endDate: "2024-09-15",
        status: "draft",
        kpis: {
          reach: 0,
          engagement: 0,
          mentions: 0
        }
      }
    ],
    meetings: [
      {
        id: "meet-2",
        title: "Influencer Strategy Discussion",
        type: "proposal",
        date: "2024-06-20T10:00:00",
        duration: 90,
        attendees: ["client@brand.com", "influencer@agency.com"],
        status: "scheduled",
        notes: "Present influencer collaboration proposal"
      }
    ],
    nextMilestone: {
      title: "Proposal Approval",
      dueDate: "2024-06-30",
      description: "Get client approval for influencer strategy"
    },
    createdAt: "2024-06-01T09:00:00Z",
    updatedAt: "2024-06-18T11:30:00Z"
  }
];

const Workflows = () => {
  const [workflows, setWorkflows] = useState<ClientWorkflow[]>(sampleWorkflows);

  const handleUpdateWorkflow = (updatedWorkflow: ClientWorkflow) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
      )
    );
  };

  const handleCreateWorkflow = (type: WorkflowType) => {
    const newWorkflow: ClientWorkflow = {
      id: `wf-${Date.now()}`,
      projectId: `proj-${Date.now()}`,
      type,
      status: "discovery",
      totalBudget: 0,
      budgetAllocations: [],
      campaigns: [],
      meetings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkflows(prev => [...prev, newWorkflow]);
  };

  return (
    <Dashboard title="Client Workflows" subtitle="Manage client workflows, budgets, and campaigns">
      <WorkflowManager
        projectId="current-project"
        workflows={workflows}
        onUpdateWorkflow={handleUpdateWorkflow}
        onCreateWorkflow={handleCreateWorkflow}
      />
    </Dashboard>
  );
};

export default Workflows;
