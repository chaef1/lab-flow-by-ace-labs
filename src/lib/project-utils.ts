
import { startOfDay } from "date-fns";

export type TaskStatus = "completed" | "in-progress" | "pending";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedTo?: string[];
  dueDate?: string;
  timeTracked?: number; // in minutes
  dependencies?: string[]; // IDs of tasks this depends on
  description?: string;
}

export interface ProjectColumn {
  id: string;
  title: string;
  tasks: Task[];
  progress: number;
}

export interface ProjectDocument {
  id: string;
  name: string;
  url: string;
  type: "document" | "spreadsheet" | "presentation" | "link";
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "file";
  thumbnailUrl?: string;
}

export interface BoardProject {
  id: string;
  name: string;
  description: string;
  client: string;
  clientAvatar?: string;
  status: string; // Column ID
  dueDate: string;
  progress: number;
  team: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  documents?: ProjectDocument[];
  attachments?: ProjectAttachment[];
  customFields?: Record<string, any>;
  campaignFocus?: string;
  productFocus?: string;
  primaryChannels?: string[];
  objectives?: string[];
}

export const projectStatuses = [
  {
    id: "conceptualisation",
    label: "Conceptualisation",
    color: "bg-blue-500"
  },
  {
    id: "pre-production",
    label: "Pre-Production",
    color: "bg-purple-500"
  },
  {
    id: "production",
    label: "Production",
    color: "bg-amber-500"
  },
  {
    id: "post-production",
    label: "Post-Production",
    color: "bg-indigo-500"
  },
  {
    id: "submission",
    label: "Submission",
    color: "bg-orange-500"
  },
  {
    id: "completed",
    label: "Completed",
    color: "bg-green-500"
  }
];

export const calculateColumnProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

export const formatTimeTracked = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const isDatePast = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = startOfDay(new Date());
  const compareDate = startOfDay(new Date(dateString));
  return compareDate < today;
};

export const isDateSoon = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = startOfDay(new Date());
  const compareDate = startOfDay(new Date(dateString));
  
  // Set "soon" as within the next 3 days
  const soonDate = new Date(today);
  soonDate.setDate(today.getDate() + 3);
  
  return compareDate >= today && compareDate <= soonDate;
};
