
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { EditorToolbar } from './pdf-editor/EditorToolbar';
import { TextFormatToolbar } from './pdf-editor/TextFormatToolbar';
import { PdfCanvas } from './pdf-editor/PdfCanvas';
import { Annotation, AnnotationStyle, DEFAULT_TEXT_STYLE } from './pdf-editor/utils';
import { saveEditedContract, sendContractEmail } from './pdf-editor/pdfEditorApi';

interface PdfEditorProps {
  documentUrl: string;
  contractId: string;
  onSaved: () => void;
}

export const PdfEditor = ({ documentUrl, contractId, onSaved }: PdfEditorProps) => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [textStyle, setTextStyle] = useState<AnnotationStyle>(DEFAULT_TEXT_STYLE);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    
    const canvas = e.currentTarget;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // First, check if user clicked on an existing annotation
    const clickedAnnotationIndex = annotations.findIndex((anno) => {
      if (
        x >= anno.x && 
        x <= anno.x + (anno.width || 100) && 
        y >= anno.y && 
        y <= anno.y + (anno.height || 20)
      ) {
        return true;
      }
      return false;
    });
    
    if (clickedAnnotationIndex !== -1) {
      setSelectedAnnotationIndex(clickedAnnotationIndex);
      return;
    } else {
      setSelectedAnnotationIndex(null);
      
      if (activeTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          const newAnnotation: Annotation = { 
            type: 'text', 
            x, 
            y, 
            text, 
            width: 100, 
            height: 20, 
            style: { ...textStyle } 
          };
          setAnnotations([...annotations, newAnnotation]);
          setSelectedAnnotationIndex(annotations.length);
        }
      } else if (activeTool === 'signature') {
        // In a real app, this would open a signature pad
        // For this demo, we'll use a placeholder signature image
        const signatureSrc = 'data:image/png;base64,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';
        const newAnnotation: Annotation = { 
          type: 'signature', 
          x, 
          y, 
          src: signatureSrc, 
          width: 150, 
          height: 60 
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotationIndex(annotations.length);
      } else if (activeTool === 'rectangle') {
        const newAnnotation: Annotation = { 
          type: 'rectangle', 
          x, 
          y, 
          width: 100, 
          height: 60 
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotationIndex(annotations.length);
      } else if (activeTool === 'circle') {
        const newAnnotation: Annotation = { 
          type: 'circle', 
          x, 
          y, 
          width: 100, 
          height: 60 
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotationIndex(annotations.length);
      }
    }
  };
  
  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const canvas = document.createElement('canvas');
      if (!canvas) return;
      
      // Place image in center (using document.createElement for this temp canvas)
      const x = 350 - 75; // half of 700px width
      const y = 450 - 30; // half of 900px height
      
      const result = event.target?.result;
      if (typeof result !== 'string') return;
      
      const newAnnotation: Annotation = { 
        type: 'image', 
        x, 
        y, 
        src: result,
        width: 150,
        height: 100
      };
      
      setAnnotations([...annotations, newAnnotation]);
      setSelectedAnnotationIndex(annotations.length);
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleUndo = () => {
    if (annotations.length === 0) return;
    
    const newAnnotations = [...annotations];
    newAnnotations.pop();
    setAnnotations(newAnnotations);
    setSelectedAnnotationIndex(null);
  };
  
  const handleDeleteSelectedAnnotation = () => {
    if (selectedAnnotationIndex === null) return;
    
    const newAnnotations = [...annotations];
    newAnnotations.splice(selectedAnnotationIndex, 1);
    setAnnotations(newAnnotations);
    setSelectedAnnotationIndex(null);
  };
  
  const handleStyleChange = (property: keyof AnnotationStyle, value: string) => {
    setTextStyle(prev => ({ ...prev, [property]: value }));
    
    // Update the style of the selected annotation if it's a text annotation
    if (selectedAnnotationIndex !== null && annotations[selectedAnnotationIndex]?.type === 'text') {
      const newAnnotations = [...annotations];
      const currentAnnotation = newAnnotations[selectedAnnotationIndex];
      
      if (currentAnnotation) {
        newAnnotations[selectedAnnotationIndex] = {
          ...currentAnnotation,
          style: { 
            ...(currentAnnotation.style || {}), 
            [property]: value 
          }
        };
        setAnnotations(newAnnotations);
      }
    }
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
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not create blob from canvas'));
        }, 'image/png');
      });
      
      await saveEditedContract(user.id, contractId, blob);
      
      toast.success('Contract saved successfully');
      onSaved();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendEmail = async () => {
    if (!user) {
      toast.error('You must be logged in to send emails');
      return;
    }
    
    const recipientEmail = prompt('Enter recipient email:');
    if (!recipientEmail) return;
    
    const recipientName = prompt('Enter recipient name:');
    if (!recipientName) return;
    
    const message = prompt('Enter optional message:');
    
    setIsLoading(true);
    
    try {
      await sendContractEmail(user.id, contractId, recipientEmail, recipientName, message || undefined);
      toast.success(`Email sent to ${recipientEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        handleUploadImage={handleUploadImage}
        handleUndo={handleUndo}
        handleSave={handleSave}
        handleSendEmail={handleSendEmail}
        isLoading={isLoading}
        hasSelectedAnnotation={selectedAnnotationIndex !== null}
        onDeleteSelected={handleDeleteSelectedAnnotation}
        annotationsCount={annotations.length}
      />
      
      {/* Text Formatting Options - Show when text tool is active or text annotation is selected */}
      {(activeTool === 'text' || (selectedAnnotationIndex !== null && annotations[selectedAnnotationIndex]?.type === 'text')) && (
        <TextFormatToolbar textStyle={textStyle} onStyleChange={handleStyleChange} />
      )}
      
      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
        <PdfCanvas
          documentUrl={documentUrl}
          annotations={annotations}
          selectedAnnotationIndex={selectedAnnotationIndex}
          textStyle={textStyle}
          activeTool={activeTool}
          onCanvasClick={handleCanvasClick}
        />
      </div>
      
      {/* File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSelected}
      />
      
      {/* Instruction Text */}
      <div className="mt-4 text-sm text-muted-foreground">
        {activeTool === 'text' && <p>Click anywhere on the document to add text</p>}
        {activeTool === 'signature' && <p>Click anywhere on the document to add a signature</p>}
        {activeTool === 'rectangle' && <p>Click anywhere on the document to add a rectangle</p>}
        {selectedAnnotationIndex !== null && <p>Annotation selected. Use the toolbar to modify or delete it.</p>}
        {!activeTool && selectedAnnotationIndex === null && <p>Select a tool from the toolbar above to edit the document</p>}
      </div>
    </div>
  );
};
