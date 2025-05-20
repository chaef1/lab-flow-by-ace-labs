
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface DocViewerProps {
  url: string;
  title?: string;
  filename?: string;
}

export const DocViewer = ({ url, title, filename = 'document' }: DocViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine file type from URL or extension
  const getFileType = () => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith('.pdf')) return 'pdf';
    if (lowercaseUrl.endsWith('.doc') || lowercaseUrl.endsWith('.docx')) return 'word';
    if (lowercaseUrl.endsWith('.jpg') || lowercaseUrl.endsWith('.jpeg') || 
        lowercaseUrl.endsWith('.png') || lowercaseUrl.endsWith('.gif')) return 'image';
    if (lowercaseUrl.includes('pdf')) return 'pdf'; // Handle URLs with content type but no extension
    return 'unknown';
  };

  const fileType = getFileType();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load document. Please try downloading it instead.');
  };

  return (
    <div className="flex flex-col w-full h-full">
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      
      {isLoading && (
        <div className="flex items-center justify-center p-12 flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center p-12 flex-1">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-center mb-4">{error}</p>
          <Button onClick={() => window.open(url, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </Button>
        </div>
      )}
      
      {fileType === 'pdf' && (
        <iframe 
          src={url} 
          className="w-full flex-1 border rounded-md"
          style={{ display: isLoading ? 'none' : 'block' }}
          onLoad={handleLoad}
          onError={handleError}
          title={title || 'PDF Document'}
        />
      )}
      
      {fileType === 'image' && (
        <div className="flex items-center justify-center flex-1 bg-gray-100 rounded-md">
          <img 
            src={url} 
            alt={title || 'Document'} 
            className="max-h-full max-w-full object-contain"
            style={{ display: isLoading ? 'none' : 'block' }}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      )}
      
      {(fileType === 'word' || fileType === 'unknown') && (
        <div className="flex flex-col items-center justify-center p-12 flex-1 border rounded-md">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-center mb-4">This document type cannot be previewed directly.</p>
          <Button onClick={() => window.open(url, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            Download to View
          </Button>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <Button 
          variant="outline"
          onClick={() => window.open(url, '_blank')}
        >
          <Download className="mr-2 h-4 w-4" />
          Download {filename}
        </Button>
      </div>
    </div>
  );
};
