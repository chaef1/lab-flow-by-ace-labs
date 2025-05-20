
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Pencil,
  Square,
  Type,
  Signature,
  Save,
  Undo,
  Image
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PdfEditorProps {
  documentUrl: string;
  contractId: string;
  onSaved: () => void;
}

// This is a simplified PDF editor component for demonstration
// In a real application, you would use a more robust library like PDF.js or PSPDFKit
export const PdfEditor = ({ documentUrl, contractId, onSaved }: PdfEditorProps) => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (canvas && context && documentUrl) {
      // In a real app, this would use PDF.js to render the PDF
      // For this demo, we'll just draw a placeholder
      context.fillStyle = '#f0f0f0';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = '16px Arial';
      context.fillStyle = '#333';
      context.textAlign = 'center';
      context.fillText('PDF Preview (simulate PDF rendering)', canvas.width / 2, 50);
      
      // Draw the contract content as a placeholder
      const lines = [
        'CONTRACT AGREEMENT',
        '',
        'This document would show the actual PDF content',
        'In a real implementation, this would use PDF.js',
        'or another PDF rendering library to display the document.',
        '',
        'Users would then be able to add annotations, text,',
        'signatures, and other elements to the document.'
      ];
      
      context.font = '14px Arial';
      lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, 100 + (index * 24));
      });
      
      // Draw a signature line at the bottom
      context.beginPath();
      context.moveTo(100, 400);
      context.lineTo(300, 400);
      context.stroke();
      context.fillText('Signature', 200, 420);
      
      context.beginPath();
      context.moveTo(400, 400);
      context.lineTo(600, 400);
      context.stroke();
      context.fillText('Date', 500, 420);
      
      // Draw any existing annotations
      drawAnnotations(context);
    }
  }, [documentUrl, annotations]);
  
  const drawAnnotations = (context: CanvasRenderingContext2D) => {
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        context.font = '14px Arial';
        context.fillStyle = '#000';
        context.fillText(annotation.text, annotation.x, annotation.y);
      } else if (annotation.type === 'signature') {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, annotation.x, annotation.y, 150, 60);
        };
        img.src = annotation.src;
      }
    });
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setAnnotations([...annotations, { type: 'text', x, y, text }]);
      }
    } else if (activeTool === 'signature') {
      // In a real app, this would open a signature pad
      // For this demo, we'll use a placeholder signature image
      const signatureSrc = 'data:image/png;base64,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';
      setAnnotations([...annotations, { type: 'signature', x, y, src: signatureSrc }]);
    }
  };
  
  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };
  
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      // Place image in center
      const x = rect.width / 2 - 75;
      const y = rect.height / 2 - 30;
      
      setAnnotations([...annotations, { 
        type: 'signature', 
        x, 
        y, 
        src: event.target?.result 
      }]);
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleUndo = () => {
    if (annotations.length === 0) return;
    
    const newAnnotations = [...annotations];
    newAnnotations.pop();
    setAnnotations(newAnnotations);
  };
  
  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save changes');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would save the PDF with annotations
      // For this demo, we'll just simulate the save process
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error('Could not create blob from canvas');
        }, 'image/png');
      });
      
      // Create a file from the blob
      const file = new File([blob], 'edited_contract.pdf', { type: 'application/pdf' });
      
      // Upload the file to Supabase
      const filePath = `${user.id}/${Date.now()}_edited_contract.pdf`;
      
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
            ...contractData.metadata,
            edited: true,
            lastEditedAt: new Date().toISOString()
          }
        })
        .eq('id', contractId)
        .select();
      
      if (docError) throw docError;
      
      toast.success('Contract saved successfully');
      onSaved();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 border-b pb-2">
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('text')}
        >
          <Type className="h-4 w-4 mr-1" /> Text
        </Button>
        <Button
          variant={activeTool === 'signature' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('signature')}
        >
          <Signature className="h-4 w-4 mr-1" /> Signature
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadImage}
        >
          <Image className="h-4 w-4 mr-1" /> Upload Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageSelected}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={annotations.length === 0}
        >
          <Undo className="h-4 w-4 mr-1" /> Undo
        </Button>
        <div className="ml-auto">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={900}
          className="bg-white shadow-md"
          onClick={handleCanvasClick}
          style={{ cursor: activeTool ? 'crosshair' : 'default' }}
        />
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        {activeTool === 'text' && <p>Click anywhere on the document to add text</p>}
        {activeTool === 'signature' && <p>Click anywhere on the document to add a signature</p>}
        {!activeTool && <p>Select a tool from the toolbar above to edit the document</p>}
      </div>
    </div>
  );
};
