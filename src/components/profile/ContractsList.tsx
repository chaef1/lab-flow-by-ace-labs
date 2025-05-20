
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileUp, 
  Download, 
  Eye, 
  FileSignature, 
  Trash2,
  FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Contract {
  id: string;
  name: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  createdAt: string;
  updatedAt: string;
  partyA: string;
  partyB: string;
  url: string;
  size: number;
}

interface ContractsListProps {
  userId: string;
  userRole: string;
}

const ContractsList = ({ userId, userRole }: ContractsListProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [contractName, setContractName] = useState('');
  const [contractStatus, setContractStatus] = useState<'draft' | 'pending' | 'signed' | 'expired'>('draft');
  const [partyB, setPartyB] = useState('');

  useEffect(() => {
    fetchContracts();
  }, [userId]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'contract')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedContracts: Contract[] = await Promise.all(data.map(async (doc) => {
          // Generate signed URL for each document
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('contracts')
            .createSignedUrl(`${userId}/${doc.name}`, 3600); // URL valid for 1 hour

          if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
          }

          const metadata = doc.metadata || {};
          
          return {
            id: doc.id,
            name: metadata.originalName || doc.name,
            status: (metadata.status || 'draft') as 'draft' | 'pending' | 'signed' | 'expired',
            createdAt: doc.uploaded_at,
            updatedAt: doc.uploaded_at,
            partyA: 'Your Company',
            partyB: metadata.partyB || 'Counterparty',
            url: signedUrlData?.signedUrl || '',
            size: doc.size
          };
        }));

        setContracts(formattedContracts);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and Word documents are allowed');
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
        .from('contracts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create a signed URL for viewing
      const { data: urlData, error: urlError } = await supabase.storage
        .from('contracts')
        .createSignedUrl(filePath, 3600);

      if (urlError) throw urlError;

      // Insert record into documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          name: fileName,
          type: 'contract',
          storage_path: filePath,
          file_type: file.type,
          size: file.size,
          category: 'contract',
          metadata: { 
            originalName: file.name,
            status: contractStatus,
            partyB: partyB || 'Counterparty',
            contractName: contractName || file.name
          }
        })
        .select()
        .single();

      if (docError) throw docError;

      clearInterval(interval);
      setUploadProgress(100);
      
      const newContract: Contract = {
        id: docData.id,
        name: contractName || file.name,
        status: contractStatus,
        createdAt: docData.uploaded_at,
        updatedAt: docData.uploaded_at,
        partyA: 'Your Company',
        partyB: partyB || 'Counterparty',
        url: urlData.signedUrl,
        size: file.size
      };

      setContracts(prev => [newContract, ...prev]);
      toast.success('Contract uploaded successfully');
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadDialogOpen(false);
        resetForm();
      }, 500);
    } catch (error: any) {
      console.error('Error uploading contract:', error);
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setContractName('');
    setContractStatus('draft');
    setPartyB('');
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      // First find the contract
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;

      // Get the document from the database
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', contractId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('contracts')
        .remove([`${userId}/${data.name}`]);

      if (storageError) throw storageError;

      // Delete from documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', contractId);

      if (dbError) throw dbError;

      setContracts(prev => prev.filter(c => c.id !== contractId));
      toast.success('Contract deleted successfully');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  const handleViewContract = (url: string) => {
    setCurrentPreviewUrl(url);
    setPreviewDialogOpen(true);
  };

  const handleSignContract = async (contractId: string) => {
    try {
      // Get the contract
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;

      // Update the status in the database
      const { data, error } = await supabase
        .from('documents')
        .update({
          metadata: { 
            ...contract, 
            status: 'signed',
            signedAt: new Date().toISOString()
          }
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;

      // Update the local contracts list
      setContracts(prev => prev.map(c => 
        c.id === contractId 
          ? { ...c, status: 'signed', updatedAt: data.updated_at } 
          : c
      ));

      toast.success('Contract marked as signed');
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('Failed to sign contract');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'signed':
        return <Badge variant="default">Signed</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUploadContract = () => {
    setUploadDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {userRole === 'admin' || userRole === 'brand' ? (
        <div className="flex justify-end mb-4">
          <Button onClick={handleUploadContract}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload New Contract
          </Button>
        </div>
      ) : null}

      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-agency-600"></div>
          </div>
        ) : contracts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.name}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>
                    {new Date(contract.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{contract.partyA}</div>
                      <div className="text-muted-foreground">{contract.partyB}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewContract(contract.url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contract.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSignContract(contract.id)}
                        >
                          <FileSignature className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(contract.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {(userRole === 'admin' || userRole === 'brand') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContract(contract.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contracts found</p>
            {userRole === 'admin' || userRole === 'brand' ? (
              <Button 
                variant="link" 
                onClick={handleUploadContract}
                className="mt-2"
              >
                Upload your first contract
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Contracts will appear here when they're shared with you
              </p>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Upload Contract Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
            <DialogDescription>
              Upload a new contract document. Supported formats: PDF, DOC, DOCX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contractName">Contract Name</Label>
              <Input
                id="contractName"
                placeholder="Enter contract name"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partyB">Counterparty</Label>
              <Input
                id="partyB"
                placeholder="Enter counterparty name"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractStatus">Status</Label>
              <select
                id="contractStatus"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value as any)}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending Signature</option>
                <option value="signed">Signed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractFile">Contract File</Label>
              <Input
                id="contractFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Label>Uploading...</Label>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Contract Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex-1 overflow-auto" style={{ height: 'calc(80vh - 120px)' }}>
            {currentPreviewUrl && (
              currentPreviewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={currentPreviewUrl} 
                  className="w-full h-full" 
                  title="Contract Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p>This document cannot be previewed directly</p>
                  <Button className="mt-4" onClick={() => window.open(currentPreviewUrl, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download to View
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsList;
