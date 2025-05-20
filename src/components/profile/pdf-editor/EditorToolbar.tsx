
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Square,
  Type,
  Signature,
  Save,
  Undo,
  Image,
  Send,
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
    <div className="flex flex-wrap gap-2 mb-4 border-b pb-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap gap-2 w-full">
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('text')}
          className="gap-1.5"
        >
          <Type className="h-4 w-4" /> Text
        </Button>
        <Button
          variant={activeTool === 'signature' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('signature')}
          className="gap-1.5"
        >
          <Signature className="h-4 w-4" /> Signature
        </Button>
        <Button
          variant={activeTool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('rectangle')}
          className="gap-1.5"
        >
          <Square className="h-4 w-4" /> Rectangle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadImage}
          className="gap-1.5"
        >
          <Image className="h-4 w-4" /> Upload Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={annotationsCount === 0}
          className="gap-1.5"
        >
          <Undo className="h-4 w-4" /> Undo
        </Button>
        
        {hasSelectedAnnotation && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="gap-1.5"
          >
            Delete Selected
          </Button>
        )}
      </div>
      
      <div className="flex w-full justify-end gap-2 mt-2 md:mt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Send className="h-4 w-4" /> Send for Signature
        </Button>
        <Button
          variant="gradient"
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
};
