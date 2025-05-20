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
  // Fix: Avoid using spread operator on potentially non-object metadata
  let updatedMetadata = {};
  
  // Only spread if contractData.metadata is an object
  if (contractData.metadata && typeof contractData.metadata === 'object') {
    updatedMetadata = {
      ...contractData.metadata,
      edited: true,
      lastEditedAt: new Date().toISOString()
    };
  } else {
    // Create a new metadata object if it doesn't exist or isn't an object
    updatedMetadata = {
      edited: true,
      lastEditedAt: new Date().toISOString()
    };
  }
  
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .update({
      metadata: updatedMetadata
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
  message?: string,
  subject?: string
) => {
  if (!recipientEmail) {
    throw new Error('Recipient email is required');
  }
  
  if (!contractId) {
    throw new Error('Contract ID is required');
  }
  
  console.log(`Preparing to send email for contract ${contractId} to ${recipientEmail}`);
  
  // Generate a shared URL for the contract
  const { data: contractData, error: contractError } = await supabase
    .from('documents')
    .select('name, storage_path')
    .eq('id', contractId)
    .single();
  
  if (contractError) {
    console.error('Error fetching contract data:', contractError);
    throw new Error(`Failed to fetch contract data: ${contractError.message}`);
  }
  
  // Generate a signed URL for the contract using the storage_path
  const { data: urlData, error: urlError } = await supabase.storage
    .from('contracts')
    .createSignedUrl(contractData.storage_path, 604800); // URL valid for 7 days
  
  if (urlError) {
    console.error('Error creating signed URL:', urlError);
    throw new Error(`Failed to create signed URL: ${urlError.message}`);
  }
  
  const contractUrl = urlData.signedUrl;
  
  // Get contract name
  const contractName = contractData.name || 'Contract';
  
  // Get current user's name
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();
  
  if (userError) {
    console.error('Error fetching user data:', userError);
    throw new Error(`Failed to fetch sender information: ${userError.message}`);
  }
  
  const senderName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Contract Owner';
  const emailSubject = subject || `Document for review: ${contractName}`;
  
  console.log(`Sending email with subject: "${emailSubject}" from ${senderName} to ${recipientEmail}`);
  
  // Send email using the edge function
  try {
    const response = await fetch(`${window.location.origin}/api/send-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientName,
        recipientEmail,
        contractName,
        contractUrl,
        message,
        senderName,
        subject: emailSubject
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from send-contract function:', errorData);
      throw new Error(errorData.error || `Failed to send email: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Email sent successfully, response:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Re-throw the error so it can be handled by the caller
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const updateContractMetadata = async (contractId: string, metadata: any) => {
  try {
    // Get the existing document
    const { data: docData, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', contractId)
      .single();

    if (fetchError) throw fetchError;
    
    // Fix: Avoid using spread operator on potentially non-object metadata
    let updatedMetadata = {
      lastEditedAt: new Date().toISOString(),
      edited: true
    };
    
    // Only spread existing metadata if it's an object
    if (docData.metadata && typeof docData.metadata === 'object') {
      updatedMetadata = {
        ...docData.metadata,
        ...updatedMetadata
      };
    }
    
    // Add new metadata if it's an object
    if (metadata && typeof metadata === 'object') {
      updatedMetadata = {
        ...updatedMetadata,
        ...metadata
      };
    }

    // Update in database
    const { data, error } = await supabase
      .from('documents')
      .update({ metadata: updatedMetadata })
      .eq('id', contractId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating contract metadata:', error);
    return { success: false, error: error.message };
  }
};
