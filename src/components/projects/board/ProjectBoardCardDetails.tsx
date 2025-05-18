
import { useState } from "react";
import { 
  BoardProject, 
  calculateColumnProgress,
  formatTimeTracked,
  Task
} from "@/lib/project-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Paperclip, 
  FileText, 
  Clock, 
  Calendar, 
  CheckSquare,
  CheckCheck,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import sample tasks data
import { projectTasks } from "@/data/project-tasks";

interface ProjectBoardCardDetailsProps {
  project: BoardProject;
}

const ProjectBoardCardDetails = ({ project }: ProjectBoardCardDetailsProps) => {
  const [tasks, setTasks] = useState<Record<string, Task[]>>(projectTasks[project.id] || {});
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});
  
  // Format due date
  const formattedDate = new Date(project.dueDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Toggle task status
  const toggleTaskStatus = (columnId: string, taskId: string) => {
    setTasks(prev => {
      const columnTasks = [...prev[columnId]];
      const taskIndex = columnTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        columnTasks[taskIndex] = {
          ...columnTasks[taskIndex],
          status: columnTasks[taskIndex].status === 'completed' ? 'pending' : 'completed'
        };
      }
      
      return { ...prev, [columnId]: columnTasks };
    });
  };

  // Add new task
  const addNewTask = (columnId: string) => {
    if (!newTaskText[columnId]?.trim()) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskText[columnId],
      status: 'pending',
    };
    
    setTasks(prev => ({
      ...prev,
      [columnId]: [...(prev[columnId] || []), newTask]
    }));
    
    setNewTaskText(prev => ({ ...prev, [columnId]: '' }));
  };

  // Calculate column progress
  const getColumnProgress = (columnId: string) => {
    return calculateColumnProgress(tasks[columnId] || []);
  };

  // Format time for a column
  const getTotalTimeForColumn = (columnId: string) => {
    const columnTasks = tasks[columnId] || [];
    const totalMinutes = columnTasks.reduce(
      (total, task) => total + (task.timeTracked || 0), 
      0
    );
    return formatTimeTracked(totalMinutes);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="space-y-4">
            {/* Client and Date Info */}
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={project.clientAvatar} />
                  <AvatarFallback>{project.client.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{project.client}</div>
                  <div className="text-xs text-muted-foreground">Client</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formattedDate}</span>
                </div>
                <div className="text-xs text-muted-foreground">Due Date</div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            
            {/* Campaign/Product Focus */}
            {(project.campaignFocus || project.productFocus) && (
              <div className="space-y-3">
                {project.campaignFocus && (
                  <div>
                    <h4 className="text-sm font-medium">Campaign Focus:</h4>
                    <p className="text-xs text-muted-foreground">{project.campaignFocus}</p>
                  </div>
                )}
                
                {project.productFocus && (
                  <div>
                    <h4 className="text-sm font-medium">Product Focus:</h4>
                    <p className="text-xs text-muted-foreground">{project.productFocus}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Channels and Objectives */}
            <div className="space-y-3">
              {project.primaryChannels && project.primaryChannels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Primary Channels:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.primaryChannels.map((channel, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{channel}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {project.objectives && project.objectives.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Objectives:</h4>
                  <ul className="text-xs text-muted-foreground list-disc ml-4 mt-1 space-y-1">
                    {project.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Documents */}
            {project.documents && project.documents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Key Documents</h3>
                <div className="space-y-2">
                  {project.documents.map(doc => (
                    <div key={doc.id} className="flex items-center p-2 bg-muted/50 rounded-sm">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={doc.url} className="text-sm hover:underline flex-1" target="_blank" rel="noopener noreferrer">
                        {doc.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Custom Fields */}
            {project.customFields && Object.keys(project.customFields).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Custom Fields</h3>
                <div className="space-y-2">
                  {Object.entries(project.customFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span>{value.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {project.attachments && project.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attachments ({project.attachments.length})
                  </div>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {project.attachments.map(attachment => (
                    <a 
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      {attachment.type === 'image' && attachment.thumbnailUrl ? (
                        <img 
                          src={attachment.thumbnailUrl}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="hidden sm:block" />

        <div className="flex-1">
          <h3 className="text-sm font-medium mb-4">Tasks & Progress</h3>
          
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
              <TabsTrigger value="team" className="flex-1">Team</TabsTrigger>
              <TabsTrigger value="time" className="flex-1">Time Tracking</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-6">
                {Object.keys(tasks).map(columnId => (
                  <div key={columnId} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">
                        {columnId.charAt(0).toUpperCase() + columnId.slice(1).replace(/-/g, ' ')}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {getColumnProgress(columnId)}%
                        </span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Progress 
                      value={getColumnProgress(columnId)}
                      className="h-1.5"
                    />
                    
                    <div>
                      {tasks[columnId]?.map(task => (
                        <div 
                          key={task.id} 
                          className="flex items-start py-2 border-b last:border-0"
                        >
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => toggleTaskStatus(columnId, task.id)}
                            className="mt-0.5 mr-2"
                          />
                          <div className="flex-1 text-sm">
                            <div className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                              {task.title}
                            </div>
                            
                            {(task.dueDate || task.timeTracked) && (
                              <div className="flex mt-1 items-center text-xs space-x-2">
                                {task.dueDate && (
                                  <span className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                                
                                {task.timeTracked && (
                                  <span className="flex items-center text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimeTracked(task.timeTracked)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <Avatar className="h-5 w-5 ml-2">
                              <AvatarFallback>{task.assignedTo[0].charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          placeholder="Add a task..."
                          className="h-8 text-sm"
                          value={newTaskText[columnId] || ''}
                          onChange={(e) => setNewTaskText(prev => ({ ...prev, [columnId]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addNewTask(columnId);
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => addNewTask(columnId)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="team" className="mt-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Team Members</h4>
                <div className="space-y-2">
                  {project.team.map(member => (
                    <div key={member.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Add Team Member
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="time" className="mt-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Time Tracked by Phase</h4>
                
                <div className="space-y-3">
                  {Object.keys(tasks).map(columnId => {
                    const totalTime = getTotalTimeForColumn(columnId);
                    return (
                      <div key={columnId} className="flex justify-between items-center">
                        <span className="text-sm">
                          {columnId.charAt(0).toUpperCase() + columnId.slice(1).replace(/-/g, ' ')}
                        </span>
                        <span className="text-sm font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {totalTime}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Time</span>
                  <span className="text-sm font-medium">14h 30m</span>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Add Time Entry
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectBoardCardDetails;
