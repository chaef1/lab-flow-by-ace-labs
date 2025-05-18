
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from "@/components/layout/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

interface CampaignContent {
  id: string;
  project_id: string;
  content_type: string;
  content_url: string;
  status: string;
  submitted_at: string | null;
}

const Campaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch projects assigned to this influencer
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['influencer-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is required");
      
      // This is a placeholder query - in reality, we would need to have a
      // table that maps influencers to projects, but for now we'll just fetch all projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id
  });
  
  // Fetch content submitted by this influencer
  const { data: submittedContent, isLoading: contentLoading } = useQuery({
    queryKey: ['influencer-content', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is required");
      
      const { data, error } = await supabase
        .from('campaign_content')
        .select(`
          *,
          projects:project_id (
            title,
            description
          )
        `)
        .eq('influencer_id', user.id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as (CampaignContent & { projects: { title: string; description: string | null } })[];
    },
    enabled: !!user?.id
  });
  
  const isLoading = projectsLoading || contentLoading;
  
  // Get content status counts
  const statusCounts = {
    pending: submittedContent?.filter(c => c.status === 'pending').length || 0,
    approved: submittedContent?.filter(c => c.status === 'approved').length || 0,
    rejected: submittedContent?.filter(c => c.status === 'rejected').length || 0
  };

  return (
    <Dashboard title="My Campaigns" subtitle="Manage your campaign assignments">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Active Campaigns</p>
                      <p className="text-2xl font-bold">{projects?.length || 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Content Submitted</p>
                      <p className="text-2xl font-bold">{submittedContent?.length || 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                      <Upload size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</p>
                      <p className="text-2xl font-bold">{statusCounts.pending}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects && projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.map(project => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{project.title}</h3>
                                <Badge variant={
                                  project.status === 'completed' ? 'outline' :
                                  project.status === 'submission' ? 'default' : 'secondary'
                                }>
                                  {project.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.description || 'No description available'}
                              </p>
                            </div>
                            
                            <div className="flex flex-col md:items-end gap-2">
                              {project.due_date && (
                                <span className="text-sm">
                                  Due: {new Date(project.due_date).toLocaleDateString()}
                                </span>
                              )}
                              <Button onClick={() => navigate('/submit-content', { state: { projectId: project.id }})}>
                                <Upload size={16} className="mr-2" />
                                Submit Content
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No campaigns assigned yet.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>My Content Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {submittedContent && submittedContent.length > 0 ? (
                    <div className="space-y-4">
                      {submittedContent.map(content => (
                        <div key={content.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{content.projects?.title || 'Unknown Project'}</h3>
                                <Badge variant={
                                  content.status === 'approved' ? 'default' :
                                  content.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                  {content.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>Type: {content.content_type}</span>
                                {content.submitted_at && (
                                  <span>Submitted: {new Date(content.submitted_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <Button variant="outline" onClick={() => window.open(content.content_url, '_blank')}>
                                View Content
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No content submissions yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Dashboard>
  );
};

export default Campaigns;
