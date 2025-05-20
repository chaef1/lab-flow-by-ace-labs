
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const saveEditedContract = async (
  userId: string,
  contractId: string,
  pdfBlob: Blob
) => {
  // Create a file from the blob
  const file = new File([pdfBlob], 'edited_contract.pdf', { type: 'application/pdf' });
  
  // Upload the file to Supabase
  const filePath = `${userId}/${Date.now()}_edited_contract.pdf`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (uploadError) throw uploadError;
  
  // Update the contract metadata in the database
  const { data: contractData, error: contractError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', contractId)
    .single();
  
  if (contractError) throw contractError;
  
  // Create a new version of the contract
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .update({
      metadata: {
        ...(contractData.metadata || {}),
        edited: true,
        lastEditedAt: new Date().toISOString()
      }
    })
    .eq('id', contractId)
    .select();
  
  if (docError) throw docError;
  
  return docData;
};

export const sendContractEmail = async (
  userId: string,
  contractId: string,
  recipientEmail: string,
  recipientName: string,
  message?: string
) => {
  // Generate a shared URL for the contract
  const { data: urlData, error: urlError } = await supabase.storage
    .from('contracts')
    .createSignedUrl(`${userId}/${contractId}.pdf`, 604800); // URL valid for 7 days
  
  if (urlError) throw urlError;
  
  // Get contract name
  const { data: contractData, error: contractError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', contractId)
    .single();
  
  if (contractError) throw contractError;
  
  // Get current user's name
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();
  
  if (userError) throw userError;
  
  // Get contract name from metadata
  const metadata = contractData.metadata || {};
  const contractName = typeof metadata === 'object' && 'contractName' in metadata 
    ? (metadata.contractName as string)
    : contractData.name;
  
  const senderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Contract Owner';
  
  // Send email using the edge function
  const response = await fetch(`${window.location.origin}/api/send-contract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientName,
      recipientEmail,
      contractName,
      contractUrl: urlData.signedUrl,
      message,
      senderName
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send email');
  }
  
  return response;
};
