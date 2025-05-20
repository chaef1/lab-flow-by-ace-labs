
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
  FileText,
  FilePlus 
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PdfEditor } from './PdfEditor';

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

interface DocumentMetadata {
  originalName?: string;
  status?: 'draft' | 'pending' | 'signed' | 'expired';
  partyB?: string;
  contractName?: string;
  signedAt?: string;
  recipientEmail?: string;
}

interface ContractsListProps {
  userId: string;
  userRole: string;
}

const ContractsList = ({ userId, userRole }: ContractsListProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [pdfEditorOpen, setPdfEditorOpen] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [currentEditContractId, setCurrentEditContractId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [contractName, setContractName] = useState('');
  const [contractStatus, setContractStatus] = useState<'draft' | 'pending' | 'signed' | 'expired'>('draft');
  const [partyB, setPartyB] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

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

          const metadata = doc.metadata as DocumentMetadata || {};
          
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
      const metadata: DocumentMetadata = { 
        originalName: file.name,
        status: contractStatus,
        partyB: partyB || 'Counterparty',
        contractName: contractName || file.name,
        recipientEmail: recipientEmail || undefined
      };

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
          metadata: metadata
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

  const createContract = async () => {
    if (!contractName || !partyB) {
      toast.error('Please fill in all required fields');
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

      // Generate a simple PDF contract
      const contractText = contractContent || getTemplateContent(selectedTemplate, {
        contractName,
        partyA: 'Your Company',
        partyB,
        date: new Date().toLocaleDateString(),
      });

      // Create a Blob from the contract content
      const blob = await generatePdf(contractText, contractName);
      const file = new File([blob], `${contractName}.pdf`, { type: 'application/pdf' });

      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${contractName}.pdf`;
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

      // Prepare metadata
      const metadata: DocumentMetadata = {
        originalName: `${contractName}.pdf`,
        status: contractStatus,
        partyB: partyB,
        contractName: contractName,
        recipientEmail: recipientEmail || undefined
      };

      // Insert record into documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          name: fileName,
          type: 'contract',
          storage_path: filePath,
          file_type: 'application/pdf',
          size: file.size,
          category: 'contract',
          metadata: metadata
        })
        .select()
        .single();

      if (docError) throw docError;

      clearInterval(interval);
      setUploadProgress(100);
      
      const newContract: Contract = {
        id: docData.id,
        name: contractName,
        status: contractStatus,
        createdAt: docData.uploaded_at,
        updatedAt: docData.uploaded_at,
        partyA: 'Your Company',
        partyB: partyB,
        url: urlData.signedUrl,
        size: file.size
      };

      setContracts(prev => [newContract, ...prev]);
      toast.success('Contract created successfully');
      
      // If the contract is pending and has a recipient email, send it for signature
      if (contractStatus === 'pending' && recipientEmail) {
        sendContractForSignature(docData.id, recipientEmail, newContract.name);
      }
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCreateDialogOpen(false);
        resetForm();
      }, 500);
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast.error(`Creation failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const sendContractForSignature = async (contractId: string, email: string, contractName: string) => {
    // In a real application, this would send an email with a signing link
    // For now, we'll just simulate this process with a toast notification
    toast.success(`Contract "${contractName}" sent to ${email} for signature`);
    
    // You could implement an actual email sending service here using a Supabase Edge Function
    // that connects to an email service like SendGrid, Mailgun, or Resend
  };

  const resetForm = () => {
    setContractName('');
    setContractStatus('draft');
    setPartyB('');
    setRecipientEmail('');
    setContractContent('');
    setSelectedTemplate('blank');
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

  const handleEditContract = (contractId: string) => {
    // Find the contract
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    setCurrentEditContractId(contractId);
    setCurrentPreviewUrl(contract.url);
    setPdfEditorOpen(true);
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
            originalName: contract.name,
            status: 'signed',
            partyB: contract.partyB,
            contractName: contract.name,
            signedAt: new Date().toISOString()
          }
        })
        .eq('id', contractId)
        .select();

      if (error) throw error;

      // Update the local contracts list
      setContracts(prev => prev.map(c => 
        c.id === contractId 
          ? { ...c, status: 'signed', updatedAt: new Date().toISOString() } 
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

  const handleCreateContract = () => {
    setCreateDialogOpen(true);
  };

  const generatePdf = async (content: string, title: string): Promise<Blob> => {
    // In a real app, you'd use a library like pdfjs or jspdf
    // For this example, we'll create a simple text-based PDF
    const pdfContent = `
      ${title}
      
      ${content}
    `;
    
    // Convert text to blob
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return blob;
  };

  const getTemplateContent = (template: string, data: any): string => {
    switch (template) {
      case 'nda':
        return `NON-DISCLOSURE AGREEMENT

THIS AGREEMENT is made on ${data.date} 

BETWEEN:
${data.partyA} ("Disclosing Party")
AND
${data.partyB} ("Receiving Party")

1. The Receiving Party agrees to keep confidential all information disclosed by the Disclosing Party.
2. This agreement shall be governed by the laws of South Africa.

Signed: ________________
Date: __________________`;

      case 'service':
        return `SERVICE AGREEMENT

THIS AGREEMENT is made on ${data.date}

BETWEEN:
${data.partyA} ("Service Provider")
AND
${data.partyB} ("Client")

1. The Service Provider agrees to provide services as described in Schedule A.
2. The Client agrees to pay for these services as described in Schedule B.
3. This agreement shall be governed by the laws of South Africa.

Signed: ________________
Date: __________________`;

      case 'blank':
      default:
        return `CONTRACT AGREEMENT

THIS AGREEMENT is made on ${data.date}

BETWEEN:
${data.partyA} ("Party A")
AND
${data.partyB} ("Party B")

[Insert contract terms here]

Signed: ________________
Date: __________________`;
    }
  };

  return (
    <div className="space-y-4">
      {userRole === 'admin' || userRole === 'brand' ? (
        <div className="flex justify-end gap-4 mb-4">
          <Button variant="outline" onClick={handleCreateContract}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Contract
          </Button>
          <Button onClick={handleUploadContract}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload Contract
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
                        onClick={() => handleEditContract(contract.id)}
                      >
                        <FileSignature className="h-4 w-4" />
                      </Button>
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
              <div className="flex flex-col gap-2 mt-4 items-center">
                <Button 
                  variant="link" 
                  onClick={handleCreateContract}
                >
                  Create your first contract
                </Button>
                <Button 
                  variant="link" 
                  onClick={handleUploadContract}
                >
                  Upload your first contract
                </Button>
              </div>
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
              <Label htmlFor="contractName">Contract Name*</Label>
              <Input
                id="contractName"
                placeholder="Enter contract name"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partyB">Counterparty*</Label>
              <Input
                id="partyB"
                placeholder="Enter counterparty name"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email (for sending signature requests)</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="Enter recipient's email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractStatus">Status</Label>
              <Select
                value={contractStatus}
                onValueChange={(value) => setContractStatus(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Signature</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractFile">Contract File*</Label>
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

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>
              Create a new contract from a template or write your own.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="createContractName">Contract Name*</Label>
              <Input
                id="createContractName"
                placeholder="Enter contract name"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createPartyB">Counterparty*</Label>
              <Input
                id="createPartyB"
                placeholder="Enter counterparty name"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createRecipientEmail">Recipient Email (for sending signature requests)</Label>
              <Input
                id="createRecipientEmail"
                type="email"
                placeholder="Enter recipient's email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createContractStatus">Status</Label>
              <Select
                value={contractStatus}
                onValueChange={(value) => setContractStatus(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Signature</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateSelect">Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Contract</SelectItem>
                  <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="service">Service Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractContent">Contract Content</Label>
              <Textarea
                id="contractContent"
                placeholder="Enter or modify contract content"
                rows={12}
                value={contractContent || getTemplateContent(selectedTemplate, {
                  contractName,
                  partyA: 'Your Company',
                  partyB,
                  date: new Date().toLocaleDateString(),
                })}
                onChange={(e) => setContractContent(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Label>Creating contract...</Label>
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
                setCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={createContract}
              disabled={isUploading || !contractName || !partyB}
            >
              Create Contract
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

      {/* PDF Editor Dialog */}
      <Dialog open={pdfEditorOpen} onOpenChange={setPdfEditorOpen}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Add annotations, signatures or fill forms
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex-1 overflow-auto" style={{ height: 'calc(90vh - 150px)' }}>
            <PdfEditor 
              documentUrl={currentPreviewUrl} 
              contractId={currentEditContractId}
              onSaved={() => {
                setPdfEditorOpen(false);
                fetchContracts();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsList;
