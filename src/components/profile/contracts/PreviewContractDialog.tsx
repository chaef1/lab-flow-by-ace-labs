
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface PreviewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreviewUrl: string;
}

export const PreviewContractDialog = ({
  open,
  onOpenChange,
  currentPreviewUrl
}: PreviewContractDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Contract Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex-1 overflow-auto" style={{ height: 'calc(80vh - 120px)' }}>
          {currentPreviewUrl && (
            currentPreviewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe 
                src={currentPreviewUrl} 
                className="w-full h-full" 
                title="Contract Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p>This document cannot be previewed directly</p>
                <Button className="mt-4" onClick={() => window.open(currentPreviewUrl, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
