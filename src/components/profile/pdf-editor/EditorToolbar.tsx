
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Square,
  Type,
  Signature,
  Save,
  Undo,
  Image,
} from 'lucide-react';

interface EditorToolbarProps {
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  handleUploadImage: () => void;
  handleUndo: () => void;
  handleSave: () => void;
  handleSendEmail: () => void;
  isLoading: boolean;
  hasSelectedAnnotation: boolean;
  onDeleteSelected: () => void;
  annotationsCount: number;
}

export const EditorToolbar = ({
  activeTool,
  setActiveTool,
  handleUploadImage,
  handleUndo,
  handleSave,
  handleSendEmail,
  isLoading,
  hasSelectedAnnotation,
  onDeleteSelected,
  annotationsCount,
}: EditorToolbarProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4 border-b pb-2">
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
        variant={activeTool === 'rectangle' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveTool('rectangle')}
      >
        <Square className="h-4 w-4 mr-1" /> Rectangle
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadImage}
      >
        <Image className="h-4 w-4 mr-1" /> Upload Image
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={annotationsCount === 0}
      >
        <Undo className="h-4 w-4 mr-1" /> Undo
      </Button>
      
      {hasSelectedAnnotation && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
        >
          Delete Selected
        </Button>
      )}
      
      <div className="ml-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          disabled={isLoading}
        >
          Send for Signature
        </Button>
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
  );
};
