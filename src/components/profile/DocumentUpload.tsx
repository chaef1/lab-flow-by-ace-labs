
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, Trash2, FileCheck2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

type DocumentType = 'identity' | 'address' | 'business' | 'tax';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  uploadedAt: string;
  url: string;
}

interface DocumentUploadProps {
  userId: string;
  userRole: string;
}

const DocumentUpload = ({ userId, userRole }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDocType, setCurrentDocType] = useState<DocumentType>('identity');

  const documentTypes: { value: DocumentType; label: string; description: string }[] = [
    { 
      value: 'identity', 
      label: 'ID Document', 
      description: 'Valid passport, driver\'s license, or national ID card'
    },
    { 
      value: 'address', 
      label: 'Proof of Address', 
      description: 'Utility bill, bank statement, or official letter (less than 3 months old)'
    },
    {
      value: 'business',
      label: 'Business Registration',
      description: 'Certificate of incorporation, business license, or registration document'
    },
    {
      value: 'tax',
      label: 'Tax Documentation',
      description: 'VAT registration, tax certificate, or similar document'
    }
  ];

  // Filter document types based on user role
  const filteredDocTypes = documentTypes.filter(doc => {
    if (userRole === 'influencer') {
      return ['identity', 'address'].includes(doc.value);
    }
    return true;
  });

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      // In a real implementation, we would fetch the documents from the storage or database
      // This is just a mock implementation for demonstration purposes
      const mockDocuments: Document[] = [];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load your documents');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // In a real implementation, we would upload the file to Supabase storage
      // For demonstration, we'll simulate the upload
      const fileName = `${userId}_${currentDocType}_${Date.now()}_${file.name}`;
      const filePath = `kyc/${userId}/${fileName}`;

      // After successful upload, add the document to the list
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        
        const newDoc: Document = {
          id: `doc_${Date.now()}`,
          name: file.name,
          type: currentDocType,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          url: `https://example.com/${filePath}`, // This would be the actual file URL
        };

        setDocuments(prev => [newDoc, ...prev]);
        toast.success('Document uploaded successfully');
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // In a real implementation, we would delete the document from storage
      // This is just a mock implementation
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentStatusForType = (type: DocumentType) => {
    return documents.find(doc => doc.type === type);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocTypes.map(docType => {
          const existingDoc = getDocumentStatusForType(docType.value);
          return (
            <Card key={docType.value} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{docType.label}</h3>
                    <p className="text-sm text-muted-foreground">{docType.description}</p>
                  </div>
                  {existingDoc ? (
                    <FileCheck2 className="text-green-500 h-5 w-5" />
                  ) : (
                    <AlertCircle className="text-amber-500 h-5 w-5" />
                  )}
                </div>
                
                {existingDoc ? (
                  <div className="mt-4 p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-sm">{existingDoc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(existingDoc.size)} • Uploaded on {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.open(existingDoc.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteDocument(existingDoc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => {
                        setCurrentDocType(docType.value);
                        document.getElementById(`file-upload-${docType.value}`)?.click();
                      }}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                    <Input
                      id={`file-upload-${docType.value}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isUploading && (
        <div className="mt-4">
          <Label>Uploading document...</Label>
          <Progress value={uploadProgress} className="h-2 mt-2" />
        </div>
      )}

      <Alert>
        <AlertDescription>
          All documents are encrypted and securely stored. Your information is only accessible to authorized personnel for verification purposes.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DocumentUpload;
