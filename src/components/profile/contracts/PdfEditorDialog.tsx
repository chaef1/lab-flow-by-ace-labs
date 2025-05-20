
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PdfEditor } from '../PdfEditor';

interface PdfEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreviewUrl: string;
  currentEditContractId: string;
  onSaved: () => void;
}

export const PdfEditorDialog = ({
  open,
  onOpenChange,
  currentPreviewUrl,
  currentEditContractId,
  onSaved
}: PdfEditorDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
          <DialogDescription>
            Add annotations, signatures or fill forms
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex-1 overflow-auto" style={{ height: 'calc(90vh - 150px)' }}>
          <PdfEditor 
            documentUrl={currentPreviewUrl} 
            contractId={currentEditContractId}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
