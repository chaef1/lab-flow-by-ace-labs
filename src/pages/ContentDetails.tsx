
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Dashboard from "@/components/layout/Dashboard";
import ContentPlayer from "@/components/content/ContentPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For now, we'll use mock data
    const mockVideoContent = {
      id: id || "c1",
      title: "Product Demo Video",
      type: "video" as const,
      url: "https://cdn.coverr.co/videos/coverr-ai-video-processing-8254/1080p.mp4",
      thumbnail: "https://images.unsplash.com/photo-1626544827763-d516dce335e2?auto=format&fit=crop&w=500",
      creator: {
        name: "Jamie Lee",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL"
      },
      project: "Product Launch",
      status: "pending" as const,
      dateSubmitted: "2025-05-17",
      commentsCount: 2
    };

    setContent(mockVideoContent);
    setLoading(false);
  }, [id]);

  const handleStatusChange = (newStatus: "pending" | "approved" | "rejected" | "needs-revisions") => {
    setContent({
      ...content,
      status: newStatus
    });

    const statusMessages = {
      approved: "Content has been approved",
      rejected: "Content has been rejected",
      "needs-revisions": "Content needs revisions",
      pending: "Content status has been changed to pending"
    };

    toast({
      title: "Status updated",
      description: statusMessages[newStatus]
    });
  };

  if (loading) {
    return (
      <Dashboard title="Content Details" subtitle="Loading content...">
        <div className="flex items-center justify-center h-60">
          <p>Loading...</p>
        </div>
      </Dashboard>
    );
  }

  const statusConfig = {
    'pending': { 
      label: 'Pending Review', 
      className: 'bg-amber-100 text-amber-800' 
    },
    'approved': { 
      label: 'Approved', 
      className: 'bg-green-100 text-green-800' 
    },
    'rejected': { 
      label: 'Rejected', 
      className: 'bg-red-100 text-red-800' 
    },
    'needs-revisions': { 
      label: 'Needs Revisions', 
      className: 'bg-purple-100 text-purple-800' 
    }
  };

  const { label, className } = statusConfig[content.status];

  return (
    <Dashboard
      title="Content Details"
      subtitle="Review and provide feedback on content"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/content")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content List
          </Button>
          <Badge className={className}>
            {label}
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
            <div className="flex justify-between text-sm text-muted-foreground mb-6">
              <div>Project: {content.project}</div>
              <div>Creator: {content.creator.name}</div>
              <div>Submitted: {new Date(content.dateSubmitted).toLocaleDateString()}</div>
            </div>
            
            <ContentPlayer content={content} onStatusChange={handleStatusChange} />
            
            {content.status === 'pending' && (
              <div className="mt-6 flex gap-4">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusChange('approved')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleStatusChange('rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange('needs-revisions')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Request Revisions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default ContentDetails;
