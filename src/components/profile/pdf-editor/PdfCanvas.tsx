
import { useRef, useEffect } from 'react';
import { Annotation, drawAnnotations, drawPdfPlaceholder } from './utils';

interface PdfCanvasProps {
  documentUrl: string;
  annotations: Annotation[];
  selectedAnnotationIndex: number | null;
  textStyle: any;
  activeTool: string | null;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const PdfCanvas = ({
  documentUrl,
  annotations,
  selectedAnnotationIndex,
  textStyle,
  activeTool,
  onCanvasClick,
}: PdfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (canvas && context && documentUrl) {
      // Draw the PDF placeholder
      drawPdfPlaceholder(context, canvas.width, canvas.height);
      
      // Draw any existing annotations
      drawAnnotations(context, annotations, selectedAnnotationIndex, textStyle);
    }
  }, [documentUrl, annotations, selectedAnnotationIndex, textStyle]);
  
  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={900}
      className="bg-white shadow-md"
      onClick={onCanvasClick}
      style={{ cursor: activeTool ? 'crosshair' : 'default' }}
    />
  );
};
