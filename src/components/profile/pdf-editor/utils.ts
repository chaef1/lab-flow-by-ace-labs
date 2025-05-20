
export interface AnnotationStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  textAlign?: string;
}

export interface Annotation {
  type: 'text' | 'signature' | 'image' | 'rectangle' | 'circle';
  x: number;
  y: number;
  text?: string;
  src?: string;
  width?: number;
  height?: number;
  style?: AnnotationStyle;
}

export const DEFAULT_TEXT_STYLE: AnnotationStyle = {
  fontFamily: 'Arial',
  fontSize: '14px',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  textAlign: 'left'
};

export const drawAnnotations = (
  context: CanvasRenderingContext2D,
  annotations: Annotation[],
  selectedAnnotationIndex: number | null,
  defaultTextStyle: AnnotationStyle
) => {
  annotations.forEach((annotation, index) => {
    const isSelected = index === selectedAnnotationIndex;
    
    if (isSelected) {
      // Draw selection box
      context.strokeStyle = '#1e88e5';
      context.lineWidth = 2;
      const padding = 5;
      context.strokeRect(
        annotation.x - padding, 
        annotation.y - padding, 
        (annotation.width || 100) + (padding * 2), 
        (annotation.height || 20) + (padding * 2)
      );
    }
    
    if (annotation.type === 'text') {
      const style = annotation.style || defaultTextStyle;
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.fillStyle = style.color || '#000';
      context.textAlign = style.textAlign as CanvasTextAlign || 'left';
      if (annotation.text) {
        context.fillText(annotation.text, annotation.x, annotation.y);
      }
      
      if (style.textDecoration === 'underline') {
        const textWidth = context.measureText(annotation.text || '').width;
        context.beginPath();
        context.moveTo(annotation.x, annotation.y + 2);
        context.lineTo(annotation.x + textWidth, annotation.y + 2);
        context.stroke();
      }
    } else if (annotation.type === 'signature') {
      if (annotation.src) {
        const img = new Image();
        img.src = annotation.src;
        img.onload = () => {
          context.drawImage(img, annotation.x, annotation.y, annotation.width || 150, annotation.height || 60);
        };
      }
    } else if (annotation.type === 'image') {
      if (annotation.src) {
        const img = new Image();
        img.src = annotation.src;
        img.onload = () => {
          context.drawImage(img, annotation.x, annotation.y, annotation.width || 100, annotation.height || 100);
        };
      }
    } else if (annotation.type === 'rectangle') {
      context.strokeStyle = '#000';
      context.lineWidth = 1;
      context.strokeRect(annotation.x, annotation.y, annotation.width || 100, annotation.height || 60);
    } else if (annotation.type === 'circle') {
      context.beginPath();
      context.arc(annotation.x + 50, annotation.y + 30, 30, 0, 2 * Math.PI);
      context.stroke();
    }
  });
};

export const drawPdfPlaceholder = (context: CanvasRenderingContext2D, width: number, height: number) => {
  // Clear the canvas
  context.fillStyle = '#f0f0f0';
  context.fillRect(0, 0, width, height);
  
  // Draw a placeholder for the PDF
  context.font = '16px Arial';
  context.fillStyle = '#333';
  context.textAlign = 'center';
  context.fillText('PDF Preview (simulate PDF rendering)', width / 2, 50);
  
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
    context.fillText(line, width / 2, 100 + (index * 24));
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
};
