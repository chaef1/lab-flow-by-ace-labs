
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUp, FileSignature, FileText, FilePlus } from 'lucide-react';
import { toast } from 'sonner';

import { ContractTable } from './ContractTable';
import { UploadContractDialog } from './UploadContractDialog';
import { CreateContractDialog } from './CreateContractDialog';
import { PreviewContractDialog } from './PreviewContractDialog';
import { PdfEditorDialog } from './PdfEditorDialog';
import { generatePdf, getTemplateContent } from './utils';

import type { Contract } from './ContractTableRow';

interface DocumentMetadata {
  originalName?: string;
  status?: 'draft' | 'pending' | 'signed' | 'expired';
  partyB?: string;
  contractName?: string;
  signedAt?: string;
  recipientEmail?: string;
  edited?: boolean;
  lastEditedAt?: string;
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
      const metadata: Record<string, any> = { 
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
      const metadata: Record<string, any> = {
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
    try {
      // Get a signed URL for the contract that lasts 7 days
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) {
        toast.error("Contract not found");
        return;
      }

      // Get current user's profile
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
      }

      const senderName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Contract Owner';

      // Call the send-contract edge function
      const response = await fetch('/api/send-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientName: email.split('@')[0], // Simple way to get a name from email
          recipientEmail: email,
          contractName: contractName,
          contractUrl: contract.url,
          senderName: senderName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      toast.success(`Contract "${contractName}" sent to ${email} for signature`);
    } catch (error) {
      console.error('Error sending contract for signature:', error);
      toast.error('Failed to send contract. Please try again later.');
    }
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

  return (
    <div className="space-y-4">
      {userRole === 'admin' || userRole === 'brand' ? (
        <div className="flex justify-end gap-4 mb-4">
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Contract
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload Contract
          </Button>
        </div>
      ) : null}

      <ContractTable
        contracts={contracts}
        isLoading={isLoading}
        userRole={userRole}
        onView={handleViewContract}
        onSign={handleSignContract}
        onEdit={handleEditContract}
        onDelete={handleDeleteContract}
        onCreateContract={() => setCreateDialogOpen(true)}
        onUploadContract={() => setUploadDialogOpen(true)}
      />

      <UploadContractDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={handleFileUpload}
        contractName={contractName}
        setContractName={setContractName}
        partyB={partyB}
        setPartyB={setPartyB}
        recipientEmail={recipientEmail}
        setRecipientEmail={setRecipientEmail}
        contractStatus={contractStatus}
        setContractStatus={setContractStatus}
        onReset={resetForm}
      />

      <CreateContractDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onCreate={createContract}
        contractName={contractName}
        setContractName={setContractName}
        partyB={partyB}
        setPartyB={setPartyB}
        recipientEmail={recipientEmail}
        setRecipientEmail={setRecipientEmail}
        contractStatus={contractStatus}
        setContractStatus={setContractStatus}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        contractContent={contractContent}
        setContractContent={setContractContent}
        getTemplateContent={getTemplateContent}
        onReset={resetForm}
      />

      <PreviewContractDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        currentPreviewUrl={currentPreviewUrl}
      />

      <PdfEditorDialog
        open={pdfEditorOpen}
        onOpenChange={setPdfEditorOpen}
        currentPreviewUrl={currentPreviewUrl}
        currentEditContractId={currentEditContractId}
        onSaved={fetchContracts}
      />
    </div>
  );
};

export default ContractsList;
