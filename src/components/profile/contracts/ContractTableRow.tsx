
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContractActionButtons } from './ContractActionButtons';

export interface Contract {
  id: string;
  name: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  createdAt: string;
  updatedAt: string;
  partyA: string;
  partyB: string;
  url: string;
  size: number;
}

interface ContractTableRowProps {
  contract: Contract;
  userRole: string;
  onView: (url: string) => void;
  onSign: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ContractTableRow = ({
  contract,
  userRole,
  onView,
  onSign,
  onEdit,
  onDelete
}: ContractTableRowProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'signed':
        return <Badge variant="default">Signed</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TableRow key={contract.id}>
      <TableCell className="font-medium">{contract.name}</TableCell>
      <TableCell>{getStatusBadge(contract.status)}</TableCell>
      <TableCell>
        {new Date(contract.updatedAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{contract.partyA}</div>
          <div className="text-muted-foreground">{contract.partyB}</div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <ContractActionButtons
          contractUrl={contract.url}
          contractId={contract.id}
          contractStatus={contract.status}
          userRole={userRole}
          onView={onView}
          onSign={onSign}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
