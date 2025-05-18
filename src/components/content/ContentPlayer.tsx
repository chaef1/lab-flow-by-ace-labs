
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, MessageSquare } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: number;
  text: string;
  createdAt: string;
}

interface ContentPlayerProps {
  content: {
    id: string;
    title: string;
    type: "video" | "image" | "document";
    url: string;
    thumbnail?: string;
    creator: {
      name: string;
      avatar?: string;
    };
    project: string;
    status: "pending" | "approved" | "rejected" | "needs-revisions";
    dateSubmitted: string;
  };
  onStatusChange?: (status: "pending" | "approved" | "rejected" | "needs-revisions") => void;
}

const ContentPlayer = ({ content, onStatusChange }: ContentPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Load mock comments
  useEffect(() => {
    // In a real app, you would fetch these from a database
    setComments([
      {
        id: "1",
        user: {
          name: "Alex Smith",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS"
        },
        timestamp: 5.5,
        text: "The intro seems a bit too long. Can we cut this section?",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        user: {
          name: "Jamie Lee",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL"
        },
        timestamp: 12.2,
        text: "Love the transition here! Really smooth.",
        createdAt: new Date().toISOString()
      }
    ]);
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleSliderChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: `comment-${Date.now()}`,
      user: {
        name: "You",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=YU"
      },
      timestamp: currentTime,
      text: newComment,
      createdAt: new Date().toISOString()
    };

    setComments([...comments, newCommentObj]);
    setNewComment("");
    setShowCommentForm(false);
    toast({
      title: "Comment added",
      description: `Comment added at ${formatTime(currentTime)}`
    });
  };

  const jumpToTimestamp = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = timestamp;
    setCurrentTime(timestamp);
    if (!isPlaying) {
      setIsPlaying(true);
      video.play();
    }
  };

  if (content.type !== "video") {
    return (
      <div className="flex items-center justify-center h-60 bg-muted rounded-md">
        <p className="text-muted-foreground">
          This content type does not support video controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={content.url}
          poster={content.thumbnail}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-white/20" 
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <span className="text-white text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              <div className="flex-1 px-2">
                <Slider 
                  min={0} 
                  max={duration || 100} 
                  step={0.1}
                  value={[currentTime]}
                  onValueChange={handleSliderChange}
                  className="cursor-pointer"
                />
              </div>
              
              <Button 
                variant="ghost"
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => setShowCommentForm(prev => !prev)}
              >
                <MessageSquare size={20} />
              </Button>
            </div>
            
            {showCommentForm && (
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a comment at this timestamp..."
                  className="bg-black/50 text-white border-white/30"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button size="sm" onClick={handleAddComment}>Add</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
        
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-md border">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => jumpToTimestamp(comment.timestamp)}
                  >
                    {formatTime(comment.timestamp)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentPlayer;
