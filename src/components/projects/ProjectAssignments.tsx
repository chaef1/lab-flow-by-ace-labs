
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Assignment {
  id: string;
  assigned_to: string;
  department: string;
  assigned_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface ProjectAssignmentsProps {
  projectId: string;
}

const ProjectAssignments = ({ projectId }: ProjectAssignmentsProps) => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    "Creative",
    "Production", 
    "Post-Production",
    "Account Management",
    "Strategy",
    "Social Media"
  ];

  useEffect(() => {
    fetchAssignments();
    fetchProfiles();
  }, [projectId]);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('project_assignments')
      .select(`
        *,
        assigned_to_profile:profiles!assigned_to (
          first_name,
          last_name
        )
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching assignments:', error);
    } else {
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        assigned_to: item.assigned_to,
        department: item.department,
        assigned_at: item.assigned_at,
        profiles: item.assigned_to_profile
      })) || [];
      setAssignments(transformedData);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'creator'])
      .order('first_name');

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
  };

  const handleAssign = async () => {
    if (!selectedProfile || !department || !userProfile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: projectId,
          assigned_to: selectedProfile,
          department,
          assigned_by: userProfile.id
        });

      if (error) throw error;

      toast.success('Team member assigned successfully!');
      setSelectedProfile("");
      setDepartment("");
      fetchAssignments();
    } catch (error: any) {
      console.error('Error assigning team member:', error);
      toast.error(`Error assigning team member: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Assignment removed successfully!');
      fetchAssignments();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast.error(`Error removing assignment: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Team Assignments
        </CardTitle>
        <CardDescription>
          Assign team members to this project by department
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="profile">Team Member</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleAssign} 
          disabled={!selectedProfile || !department || isLoading}
          className="w-full"
        >
          Assign Team Member
        </Button>

        <div className="space-y-2">
          <Label>Current Assignments</Label>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                    </span>
                    <Badge variant="secondary">{assignment.department}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAssignments;
