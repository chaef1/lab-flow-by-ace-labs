
export const generatePdf = async (content: string, title: string): Promise<Blob> => {
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

export const getTemplateContent = (template: string, data: any): string => {
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

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
