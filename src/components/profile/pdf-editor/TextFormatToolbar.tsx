
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { AnnotationStyle } from './utils';

interface TextFormatToolbarProps {
  textStyle: AnnotationStyle;
  onStyleChange: (property: keyof AnnotationStyle, value: string) => void;
}

export const TextFormatToolbar = ({ textStyle, onStyleChange }: TextFormatToolbarProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-muted rounded-md">
      <Select
        value={textStyle.fontFamily}
        onValueChange={(value) => onStyleChange('fontFamily', value)}
      >
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Arial">Arial</SelectItem>
          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
          <SelectItem value="Courier New">Courier New</SelectItem>
          <SelectItem value="Georgia">Georgia</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={textStyle.fontSize}
        onValueChange={(value) => onStyleChange('fontSize', value)}
      >
        <SelectTrigger className="w-[80px] h-8">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10px">10px</SelectItem>
          <SelectItem value="12px">12px</SelectItem>
          <SelectItem value="14px">14px</SelectItem>
          <SelectItem value="16px">16px</SelectItem>
          <SelectItem value="18px">18px</SelectItem>
          <SelectItem value="20px">20px</SelectItem>
          <SelectItem value="24px">24px</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant={textStyle.fontWeight === 'bold' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('fontWeight', textStyle.fontWeight === 'bold' ? 'normal' : 'bold')}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant={textStyle.fontStyle === 'italic' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('fontStyle', textStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant={textStyle.textDecoration === 'underline' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('textDecoration', textStyle.textDecoration === 'underline' ? 'none' : 'underline')}
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <Button
        variant={textStyle.textAlign === 'left' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('textAlign', 'left')}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant={textStyle.textAlign === 'center' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('textAlign', 'center')}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      
      <Button
        variant={textStyle.textAlign === 'right' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onStyleChange('textAlign', 'right')}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <Input
        type="color"
        value={textStyle.color}
        onChange={(e) => onStyleChange('color', e.target.value)}
        className="w-10 h-8 p-0"
      />
    </div>
  );
};
