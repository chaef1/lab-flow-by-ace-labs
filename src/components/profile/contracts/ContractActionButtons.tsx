
import { Button } from '@/components/ui/button';
import { Eye, FileSignature, Download, Trash2 } from 'lucide-react';

interface ContractActionButtonsProps {
  contractUrl: string;
  contractId: string;
  contractStatus: string;
  userRole: string;
  onView: (url: string) => void;
  onSign: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ContractActionButtons = ({
  contractUrl,
  contractId,
  contractStatus,
  userRole,
  onView,
  onSign,
  onEdit,
  onDelete
}: ContractActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(contractUrl)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {contractStatus === 'pending' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSign(contractId)}
        >
          <FileSignature className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(contractId)}
      >
        <FileSignature className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(contractUrl, '_blank')}
      >
        <Download className="h-4 w-4" />
      </Button>
      {(userRole === 'admin' || userRole === 'brand') && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(contractId)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
};
