
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image, Video, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreativeUploadProps {
  onCreativeUploaded: (creative: any) => void;
  selectedPage?: any;
  onCreativeRemoved: (creativeId: string) => void;
  uploadedCreatives: any[];
}

const CreativeUpload: React.FC<CreativeUploadProps> = ({
  onCreativeUploaded,
  selectedPage,
  onCreativeRemoved,
  uploadedCreatives
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [creativeName, setCreativeName] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [callToAction, setCallToAction] = useState('LEARN_MORE');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { toast } = useToast();

  const callToActionOptions = [
    { value: 'LEARN_MORE', label: 'Learn More' },
    { value: 'SHOP_NOW', label: 'Shop Now' },
    { value: 'SIGN_UP', label: 'Sign Up' },
    { value: 'DOWNLOAD', label: 'Download' },
    { value: 'WATCH_MORE', label: 'Watch More' },
    { value: 'CONTACT_US', label: 'Contact Us' },
    { value: 'BOOK_TRAVEL', label: 'Book Travel' },
    { value: 'LISTEN_MUSIC', label: 'Listen Music' },
    { value: 'GET_QUOTE', label: 'Get Quote' },
    { value: 'APPLY_NOW', label: 'Apply Now' }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi'];
    const isValidImage = validImageTypes.includes(file.type);
    const isValidVideo = validVideoTypes.includes(file.type);

    if (!isValidImage && !isValidVideo) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image (JPEG, PNG, GIF) or video (MP4, MOV, AVI) file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Set default creative name if empty
    if (!creativeName) {
      setCreativeName(file.name.split('.')[0]);
    }
  }, [creativeName, toast]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedPage) {
      toast({
        title: "Missing Information",
        description: "Please select a file and a Facebook page.",
        variant: "destructive"
      });
      return;
    }

    if (!headline || !description) {
      toast({
        title: "Missing Content",
        description: "Please provide headline and description for your ad.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1]; // Remove data URL prefix

        const creative = {
          id: Date.now().toString(),
          name: creativeName || selectedFile.name,
          type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
          file: selectedFile,
          base64: base64Content,
          filename: selectedFile.name,
          headline,
          description,
          callToAction,
          destinationUrl,
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          previewUrl,
          size: selectedFile.size,
          mimeType: selectedFile.type
        };

        onCreativeUploaded(creative);

        // Reset form
        setSelectedFile(null);
        setPreviewUrl('');
        setCreativeName('');
        setHeadline('');
        setDescription('');
        setDestinationUrl('');
        setCallToAction('LEARN_MORE');

        toast({
          title: "Creative Added",
          description: "Your creative has been added to the campaign.",
        });
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error processing creative:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process the creative. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeCreative = (creativeId: string) => {
    onCreativeRemoved(creativeId);
    toast({
      title: "Creative Removed",
      description: "The creative has been removed from the campaign.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Creative Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedPage && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please select a Facebook page first to upload creatives.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <Label htmlFor="creative-file">Select Image or Video</Label>
              <Input
                id="creative-file"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={!selectedPage}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPEG, PNG, GIF, MP4, MOV, AVI (max 10MB)
              </p>
            </div>

            {selectedFile && (
              <>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="creative-name">Creative Name</Label>
                    <Input
                      id="creative-name"
                      value={creativeName}
                      onChange={(e) => setCreativeName(e.target.value)}
                      placeholder="Enter creative name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="headline">Ad Headline</Label>
                    <Input
                      id="headline"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Enter compelling headline"
                      maxLength={40}
                    />
                    <p className="text-xs text-muted-foreground">
                      {headline.length}/40 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Ad Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter ad description"
                      maxLength={125}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.length}/125 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="cta">Call to Action</Label>
                    <Select value={callToAction} onValueChange={setCallToAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {callToActionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="destination-url">Destination URL</Label>
                    <Input
                      id="destination-url"
                      type="url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2 border rounded-md p-4 bg-gray-50">
                      {selectedFile.type.startsWith('image/') ? (
                        <img
                          src={previewUrl}
                          alt="Creative preview"
                          className="max-w-full h-auto max-h-48 rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Video className="h-4 w-4" />
                          Video: {selectedFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !selectedPage}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Add Creative to Campaign
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedCreatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Creatives ({uploadedCreatives.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {uploadedCreatives.map((creative) => (
                <div
                  key={creative.id}
                  className="flex items-center justify-between p-4 border rounded-md bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {creative.type === 'image' ? (
                        <Image className="h-8 w-8 text-blue-500" />
                      ) : (
                        <Video className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{creative.name}</p>
                      <p className="text-sm text-gray-500">{creative.headline}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {creative.pageName}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {creative.callToAction.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {creative.destinationUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(creative.destinationUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCreative(creative.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreativeUpload;
