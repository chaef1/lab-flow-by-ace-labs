
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { ClientWorkflow, Meeting } from "@/lib/workflow-utils";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  VideoIcon,
  MapPin
} from "lucide-react";

interface MeetingSchedulerProps {
  workflows: ClientWorkflow[];
  onUpdate: (workflow: ClientWorkflow) => void;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ workflows, onUpdate }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    type: 'discovery' as const,
    date: '',
    duration: 60,
    attendees: '',
    notes: ''
  });

  const allMeetings = workflows.flatMap(workflow => 
    workflow.meetings.map(meeting => ({ ...meeting, workflowId: workflow.id, workflowType: workflow.type }))
  );

  const upcomingMeetings = allMeetings
    .filter(m => new Date(m.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastMeetings = allMeetings
    .filter(m => new Date(m.date) <= new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'kickoff': return 'bg-green-100 text-green-800';
      case 'check-in': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateMeeting = () => {
    if (!selectedWorkflow) return;

    const workflow = workflows.find(w => w.id === selectedWorkflow);
    if (!workflow) return;

    const meeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: newMeeting.title,
      type: newMeeting.type,
      date: newMeeting.date,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()),
      status: 'scheduled',
      notes: newMeeting.notes
    };

    const updatedWorkflow = {
      ...workflow,
      meetings: [...workflow.meetings, meeting]
    };

    onUpdate(updatedWorkflow);
    
    // Reset form
    setNewMeeting({
      title: '',
      type: 'discovery',
      date: '',
      duration: 60,
      attendees: '',
      notes: ''
    });
    setSelectedWorkflow('');
  };

  return (
    <div className="space-y-6">
      {/* Meeting Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Upcoming Meetings</p>
                <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold">
                  {upcomingMeetings.filter(m => {
                    const meetingDate = new Date(m.date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return meetingDate <= weekFromNow;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Hours</p>
                <p className="text-2xl font-bold">
                  {Math.round(allMeetings.reduce((sum, m) => sum + m.duration, 0) / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule New Meeting */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Meeting Schedule</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Meeting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Workflow</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.map(workflow => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.type.replace('-', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Meeting Title</Label>
                    <Input
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Discovery Call"
                    />
                  </div>

                  <div>
                    <Label>Meeting Type</Label>
                    <Select 
                      value={newMeeting.type} 
                      onValueChange={(value: any) => setNewMeeting(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discovery">Discovery</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="kickoff">Kickoff</SelectItem>
                        <SelectItem value="check-in">Check-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={newMeeting.date}
                        onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Duration (min)</Label>
                      <Input
                        type="number"
                        value={newMeeting.duration}
                        onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Attendees (comma separated)</Label>
                    <Input
                      value={newMeeting.attendees}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))}
                      placeholder="john@example.com, jane@example.com"
                    />
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={newMeeting.notes}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Meeting agenda or notes..."
                    />
                  </div>

                  <Button onClick={handleCreateMeeting} className="w-full">
                    Schedule Meeting
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...upcomingMeetings, ...pastMeetings].map(meeting => (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMeetingTypeColor(meeting.type)}>
                      {meeting.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">
                          {new Date(meeting.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meeting.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{meeting.duration}min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{meeting.attendees.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {meeting.workflowType?.replace('-', ' ')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingScheduler;
