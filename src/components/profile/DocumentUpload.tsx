
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileUp, 
  Trash2, 
  FileCheck2, 
  AlertCircle, 
  Download, 
  File 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

type DocumentType = 'identity' | 'address' | 'business' | 'tax';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  uploadedAt: string;
  url: string;
  status: string;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedDocs: Document[] = await Promise.all(data.map(async (doc) => {
          // Generate signed URL for each document
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('kyc_documents')
            .createSignedUrl(`${userId}/${doc.name}`, 3600); // URL valid for 1 hour

          if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
          }

          return {
            id: doc.id,
            name: doc.name,
            type: doc.type as DocumentType,
            size: doc.size,
            uploadedAt: doc.uploaded_at,
            url: signedUrlData?.signedUrl || '',
            status: doc.status
          };
        }));

        setDocuments(formattedDocs);
      }
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
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create a signed URL for viewing
      const { data: urlData, error: urlError } = await supabase.storage
        .from('kyc_documents')
        .createSignedUrl(filePath, 3600);

      if (urlError) throw urlError;

      // Insert record into documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          name: fileName,
          type: currentDocType,
          storage_path: filePath,
          file_type: file.type,
          size: file.size,
          category: 'kyc',
          metadata: { originalName: file.name }
        })
        .select()
        .single();

      if (docError) throw docError;

      clearInterval(interval);
      setUploadProgress(100);
      
      const newDoc: Document = {
        id: docData.id,
        name: fileName,
        type: currentDocType,
        size: file.size,
        uploadedAt: docData.uploaded_at,
        url: urlData.signedUrl,
        status: docData.status
      };

      setDocuments(prev => [newDoc, ...prev]);
      toast.success('Document uploaded successfully');
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
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

  const handleDeleteDocument = async (documentId: string, documentPath: string) => {
    try {
      // Delete from Supabase storage
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;
      
      const filePath = `${userId}/${document.name}`;
      
      const { error: storageError } = await supabase.storage
        .from('kyc_documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

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

  const handlePreviewDocument = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const getDocumentPreview = (url: string, fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <iframe 
          src={url} 
          className="w-full h-[70vh]" 
          title="Document Preview"
        />
      );
    } else if (fileType.includes('image')) {
      return (
        <img 
          src={url} 
          alt="Document Preview" 
          className="max-h-[70vh] max-w-full object-contain mx-auto"
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p>This document type cannot be previewed directly</p>
          <Button className="mt-4" onClick={() => window.open(url, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            Download to View
          </Button>
        </div>
      );
    }
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
                      <p className="truncate font-medium text-sm">{existingDoc.name.split('_').slice(1).join('_')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(existingDoc.size)} • Uploaded on {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handlePreviewDocument(existingDoc.url)}
                      >
                        <FileCheck2 className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleDeleteDocument(existingDoc.id, existingDoc.url)}
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Viewing your uploaded document
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl && getDocumentPreview(previewUrl, previewUrl.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg')}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUpload;
