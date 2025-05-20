
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus } from 'lucide-react';
import { ContractTableRow, Contract } from './ContractTableRow';

interface ContractTableProps {
  contracts: Contract[];
  isLoading: boolean;
  userRole: string;
  onView: (url: string) => void;
  onSign: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateContract: () => void;
  onUploadContract: () => void;
}

export const ContractTable = ({
  contracts,
  isLoading,
  userRole,
  onView,
  onSign,
  onEdit,
  onDelete,
  onCreateContract,
  onUploadContract
}: ContractTableProps) => {
  return (
    <ScrollArea className="h-[400px]">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-agency-600"></div>
        </div>
      ) : contracts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Parties</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <ContractTableRow
                key={contract.id}
                contract={contract}
                userRole={userRole}
                onView={onView}
                onSign={onSign}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No contracts found</p>
          {userRole === 'admin' || userRole === 'brand' ? (
            <div className="flex flex-col gap-2 mt-4 items-center">
              <Button 
                variant="link" 
                onClick={onCreateContract}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Create your first contract
              </Button>
              <Button 
                variant="link" 
                onClick={onUploadContract}
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload your first contract
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Contracts will appear here when they're shared with you
            </p>
          )}
        </div>
      )}
    </ScrollArea>
  );
};
