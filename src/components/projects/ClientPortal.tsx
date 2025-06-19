
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  created_at: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  created_by: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

const ClientPortal = () => {
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClientProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectComments(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchClientProjects = async () => {
    try {
      // Get client access to find which client this user belongs to
      const { data: clientAccess, error: accessError } = await supabase
        .from('client_access')
        .select('client_id')
        .eq('user_id', userProfile?.id)
        .eq('is_active', true)
        .single();

      if (accessError) throw accessError;

      // Get projects for this client
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientAccess.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching client projects:', error);
      toast.error(`Error fetching projects: ${error.message}`);
    }
  };

  const fetchProjectComments = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            role
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error(`Error fetching comments: ${error.message}`);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedProject || !userProfile) return;

    setIsLoading(true);
    try {
      // Get client ID
      const { data: clientAccess, error: accessError } = await supabase
        .from('client_access')
        .select('client_id')
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      if (accessError) throw accessError;

      const { error } = await supabase
        .from('client_comments')
        .insert({
          project_id: selectedProject.id,
          client_id: clientAccess.client_id,
          comment: newComment,
          created_by: userProfile.id
        });

      if (error) throw error;

      toast.success('Comment added successfully!');
      setNewComment("");
      fetchProjectComments(selectedProject.id);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(`Error adding comment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <p className="text-muted-foreground">Track the progress of your projects and provide feedback</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedProject(project)}>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Due: {new Date(project.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setSelectedProject(null)}>
          ← Back to Projects
        </Button>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
        <p className="text-muted-foreground">{selectedProject.description}</p>
        <Badge variant={selectedProject.status === 'completed' ? 'default' : 'secondary'} className="mt-2">
          {selectedProject.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Comment
            </CardTitle>
            <CardDescription>
              Share feedback or ask questions about this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment or feedback..."
              rows={4}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim() || isLoading}>
              Add Comment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Comments</CardTitle>
            <CardDescription>
              All comments and feedback on this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {comment.profiles.first_name} {comment.profiles.last_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {comment.profiles.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPortal;
