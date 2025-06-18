
export type CampaignElement = 'video' | 'radio' | 'design' | 'influencers';

export type CampaignStatus = 'briefed' | 'in-progress' | 'reverted' | 'complete';

export type TaskStatus = 'todo' | 'in-progress' | 'revert' | 'approved' | 'completed';

export type VideoTask = 
  | 'scripting-brainstorm'
  | 'script-drafting'
  | 'script-internal-review'
  | 'script-revert-1'
  | 'script-revert-2'
  | 'script-approval'
  | 'production-planning'
  | 'post-production'
  | 'final-asset-approval';

export type RadioTask =
  | 'concept-variations'
  | 'scriptwriting'
  | 'reverts'
  | 'recording-session'
  | 'go-live';

export type DesignTask =
  | 'copywriting'
  | 'design-draft'
  | 'internal-review'
  | 'reverts'
  | 'captioning'
  | 'submission';

export type InfluencerTask =
  | 'influencer-shortlist'
  | 'client-feedback'
  | 'influencer-booking'
  | 'content-review'
  | 'final-submission'
  | 'go-live';

export interface CampaignTask {
  id: string;
  title: string;
  type: VideoTask | RadioTask | DesignTask | InfluencerTask;
  element: CampaignElement;
  status: TaskStatus;
  assignedTo?: string[];
  dependencies?: string[];
  dueDate?: string;
  description?: string;
  timeTracked?: number;
  revertedAt?: string;
  completedAt?: string;
}

export interface CampaignProject {
  id: string;
  clientName: string;
  campaignName: string;
  elements: CampaignElement[];
  startDate: string;
  endDate: string;
  budget: number;
  campaignOwner: string;
  status: CampaignStatus;
  tasks: CampaignTask[];
  createdAt: string;
  updatedAt: string;
}

export const campaignElementLabels: Record<CampaignElement, string> = {
  video: 'Video Production',
  radio: 'Radio',
  design: 'Graphic Design',
  influencers: 'Influencers'
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  briefed: 'Briefed',
  'in-progress': 'In Progress',
  reverted: 'Reverted',
  complete: 'Complete'
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  revert: 'Revert',
  approved: 'Approved',
  completed: 'Completed'
};

// Task definitions for each element
export const videoTasks: Array<{ id: VideoTask; title: string; dependencies?: VideoTask[] }> = [
  { id: 'scripting-brainstorm', title: 'Scripting Brainstorm' },
  { id: 'script-drafting', title: 'Script Drafting', dependencies: ['scripting-brainstorm'] },
  { id: 'script-internal-review', title: 'Script Internal Review', dependencies: ['script-drafting'] },
  { id: 'script-revert-1', title: 'Script Revert 1' },
  { id: 'script-revert-2', title: 'Script Revert 2' },
  { id: 'script-approval', title: 'Script Approval', dependencies: ['script-internal-review'] },
  { id: 'production-planning', title: 'Production Planning', dependencies: ['script-approval'] },
  { id: 'post-production', title: 'Post-Production', dependencies: ['production-planning'] },
  { id: 'final-asset-approval', title: 'Final Asset Approval', dependencies: ['post-production'] }
];

export const radioTasks: Array<{ id: RadioTask; title: string; dependencies?: RadioTask[] }> = [
  { id: 'concept-variations', title: 'Concept Variations' },
  { id: 'scriptwriting', title: 'Scriptwriting', dependencies: ['concept-variations'] },
  { id: 'reverts', title: 'Reverts' },
  { id: 'recording-session', title: 'Recording Session', dependencies: ['scriptwriting'] },
  { id: 'go-live', title: 'Go Live', dependencies: ['recording-session'] }
];

export const designTasks: Array<{ id: DesignTask; title: string; dependencies?: DesignTask[] }> = [
  { id: 'copywriting', title: 'Copywriting' },
  { id: 'design-draft', title: 'Design Draft', dependencies: ['copywriting'] },
  { id: 'internal-review', title: 'Internal Review', dependencies: ['design-draft'] },
  { id: 'reverts', title: 'Reverts' },
  { id: 'captioning', title: 'Captioning', dependencies: ['internal-review'] },
  { id: 'submission', title: 'Submission', dependencies: ['captioning'] }
];

export const influencerTasks: Array<{ id: InfluencerTask; title: string; dependencies?: InfluencerTask[] }> = [
  { id: 'influencer-shortlist', title: 'Influencer Shortlist' },
  { id: 'client-feedback', title: 'Client Feedback', dependencies: ['influencer-shortlist'] },
  { id: 'influencer-booking', title: 'Influencer Booking', dependencies: ['client-feedback'] },
  { id: 'content-review', title: 'Content Review', dependencies: ['influencer-booking'] },
  { id: 'final-submission', title: 'Final Submission', dependencies: ['content-review'] },
  { id: 'go-live', title: 'Go Live', dependencies: ['final-submission'] }
];

export const generateTasksForElements = (elements: CampaignElement[], campaignId: string): CampaignTask[] => {
  const allTasks: CampaignTask[] = [];

  elements.forEach(element => {
    let taskDefinitions: Array<{ id: any; title: string; dependencies?: any[] }> = [];
    
    switch (element) {
      case 'video':
        taskDefinitions = videoTasks;
        break;
      case 'radio':
        taskDefinitions = radioTasks;
        break;
      case 'design':
        taskDefinitions = designTasks;
        break;
      case 'influencers':
        taskDefinitions = influencerTasks;
        break;
    }

    taskDefinitions.forEach((taskDef, index) => {
      const taskId = `${campaignId}-${element}-${taskDef.id}`;
      
      allTasks.push({
        id: taskId,
        title: taskDef.title,
        type: taskDef.id,
        element,
        status: 'todo',
        dependencies: taskDef.dependencies?.map(dep => `${campaignId}-${element}-${dep}`) || []
      });
    });
  });

  return allTasks;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};

export const calculateCampaignProgress = (campaign: CampaignProject): number => {
  if (campaign.tasks.length === 0) return 0;
  const completedTasks = campaign.tasks.filter(task => 
    task.status === 'completed' || task.status === 'approved'
  ).length;
  return Math.round((completedTasks / campaign.tasks.length) * 100);
};

export const shouldAutoComplete = (campaign: CampaignProject): boolean => {
  const elementTasks = campaign.elements.reduce((acc, element) => {
    acc[element] = campaign.tasks.filter(task => task.element === element);
    return acc;
  }, {} as Record<CampaignElement, CampaignTask[]>);

  return campaign.elements.every(element => {
    const tasks = elementTasks[element];
    return tasks.every(task => task.status === 'approved' || task.status === 'completed');
  });
};

export const getTasksStuckInRevert = (campaign: CampaignProject): CampaignTask[] => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return campaign.tasks.filter(task => 
    task.status === 'revert' && 
    task.revertedAt && 
    new Date(task.revertedAt) <= threeDaysAgo
  );
};
