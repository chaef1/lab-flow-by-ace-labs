
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Upload, Video, Image, Search, X } from "lucide-react";

interface MediaUploaderProps {
  platform: 'tiktok' | 'meta';
}

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  size: string;
  uploadDate: string;
  campaigns: string[];
  status: 'uploaded' | 'processing' | 'ready' | 'error';
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ platform }) => {
  const [media, setMedia] = useState<MediaItem[]>([
    {
      id: '1',
      name: 'Product Demo Video',
      type: 'video',
      url: 'https://placehold.co/600x400/ace-500/white?text=Video+Thumbnail',
      size: '12.4 MB',
      uploadDate: '2025-05-15',
      campaigns: ['Summer Product Launch'],
      status: 'ready'
    },
    {
      id: '2',
      name: 'Product Lifestyle Image',
      type: 'image',
      url: 'https://placehold.co/600x400/ace-300/white?text=Product+Image',
      size: '2.1 MB',
      uploadDate: '2025-05-16',
      campaigns: ['Brand Awareness Q2'],
      status: 'ready'
    }
  ]);
  
  const [activeTab, setActiveTab] = useState<'videos' | 'images' | 'all'>('all');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredMedia = activeTab === 'all' 
    ? media 
    : activeTab === 'videos' 
      ? media.filter(item => item.type === 'video') 
      : media.filter(item => item.type === 'image');
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const isVideo = file.type.includes('video');
      const newMedia: MediaItem = {
        id: (media.length + 1).toString(),
        name: file.name,
        type: isVideo ? 'video' : 'image',
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size),
        uploadDate: new Date().toISOString().split('T')[0],
        campaigns: [],
        status: 'processing'
      };
      
      setMedia(prev => [...prev, newMedia]);
      
      // Simulate processing delay
      setTimeout(() => {
        setMedia(prev => prev.map(item => 
          item.id === newMedia.id ? { ...item, status: 'ready' } : item
        ));
      }, 2000);
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const handleDeleteMedia = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList className="mb-0">
            <TabsTrigger value="all">All Media</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search media..." 
                className="pl-9 w-full md:w-64" 
              />
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-all ${
            dragActive ? 'border-ace-500 bg-ace-50' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-4 p-3 rounded-full bg-secondary">
              <Upload className="h-6 w-6 text-ace-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">Drop your files here</h3>
            <p className="text-center text-muted-foreground mb-4">
              Supports images and videos up to 50MB
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Files
            </Button>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Your Media Library</h3>
          
          {filteredMedia.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMedia.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    {item.type === 'video' ? (
                      <div className="absolute inset-0 bg-ace-dark/10 flex items-center justify-center">
                        <Video className="h-10 w-10 text-white" />
                      </div>
                    ) : null}
                    <img 
                      src={item.url} 
                      alt={item.name}
                      className="w-full h-full object-cover" 
                    />
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={
                        item.status === 'ready' ? 'default' :
                        item.status === 'processing' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {item.status === 'ready' ? 'Ready' : 
                       item.status === 'processing' ? 'Processing' : 'Error'}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="truncate pr-4">
                        <CardTitle className="text-base truncate">{item.name}</CardTitle>
                        <CardDescription>
                          {item.size} • {new Date(item.uploadDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDeleteMedia(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    {item.campaigns.length > 0 ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Used in campaigns:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.campaigns.map(campaign => (
                            <Badge key={campaign} variant="outline" className="text-xs">
                              {campaign}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not assigned to any campaigns</p>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
              <p className="text-center text-muted-foreground">
                No media files found. Upload files to get started.
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default MediaUploader;
