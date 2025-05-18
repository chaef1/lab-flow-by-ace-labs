
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ApprovalCardProps {
  content: {
    id: string;
    title: string;
    type: "video" | "image" | "document";
    thumbnail?: string;
    creator: {
      name: string;
      avatar?: string;
    };
    project: string;
    status: "pending" | "approved" | "rejected" | "needs-revisions";
    dateSubmitted: string;
    commentsCount: number;
  };
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

const ApprovalCard = ({ content }: ApprovalCardProps) => {
  const [status, setStatus] = useState(content.status);
  const { label, className } = statusConfig[status];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApprove = () => {
    setStatus('approved');
  };

  const handleReject = () => {
    setStatus('rejected');
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`/content/${content.id}`} className="block">
        <div className="aspect-video bg-muted relative">
          {content.thumbnail ? (
            <img 
              src={content.thumbnail} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-2xl text-muted-foreground">
                {content.type === 'video' && '🎬'}
                {content.type === 'image' && '🖼️'}
                {content.type === 'document' && '📄'}
              </span>
            </div>
          )}
          
          <Badge className={`absolute top-2 right-2 ${className}`}>
            {label}
          </Badge>
        </div>
      </Link>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <Link to={`/content/${content.id}`} className="hover:underline">
            {content.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex justify-between">
          <span>For: {content.project}</span>
          <span>Submitted: {formatDate(content.dateSubmitted)}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={content.creator.avatar} />
              <AvatarFallback>{content.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{content.creator.name}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{content.commentsCount}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="grid grid-cols-2 gap-2">
        {status === 'pending' && (
          <>
            <Button 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleReject}
            >
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </>
        )}
        
        {status !== 'pending' && (
          <Link to={`/content/${content.id}`} className="col-span-2">
            <Button size="sm" variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApprovalCard;
