
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from "@/components/layout/Dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Image, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';

const SubmitContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedProjectId = location.state?.projectId;
  
  const [contentType, setContentType] = useState('image');
  const [contentUrl, setContentUrl] = useState('');
  const [projectId, setProjectId] = useState(preselectedProjectId || '');
  const [caption, setCaption] = useState('');
  
  // Fetch projects this influencer can submit content to
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['influencer-available-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is required");
      
      // In reality, we'd fetch only assigned projects
      // For now, we'll just fetch all projects
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Mutation to submit content
  const submitContentMutation = useMutation({
    mutationFn: async (contentData: {
      project_id: string;
      influencer_id: string;
      content_url: string;
      content_type: string;
    }) => {
      const { data, error } = await supabase
        .from('campaign_content')
        .insert([contentData])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Content submitted successfully');
      navigate('/campaigns');
    },
    onError: (error) => {
      toast.error(`Error submitting content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }
    
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }
    
    if (!contentUrl) {
      toast.error('Please provide a content URL');
      return;
    }
    
    submitContentMutation.mutate({
      project_id: projectId,
      influencer_id: user.id,
      content_url: contentUrl,
      content_type: contentType
    });
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <Dashboard title="Submit Content" subtitle="Upload your content for review">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Content Submission</CardTitle>
            <CardDescription>
              Submit your content for campaign approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select 
                  value={projectId} 
                  onValueChange={setProjectId}
                  disabled={projectsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content-url">Content URL</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md border">
                    {getContentTypeIcon()}
                  </div>
                  <Input
                    id="content-url"
                    placeholder={`Enter URL for your ${contentType}`}
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide a public URL to your content. For images and videos, upload them to a hosting service and paste the link.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption for your content"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitContentMutation.isPending}
                  className="flex-1"
                >
                  {submitContentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Submit Content
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/campaigns')}
                  disabled={submitContentMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default SubmitContent;
