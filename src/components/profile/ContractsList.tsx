
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileUp, Download, Eye, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Contract {
  id: string;
  name: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  createdAt: string;
  updatedAt: string;
  partyA: string;
  partyB: string;
  url: string;
}

interface ContractsListProps {
  userId: string;
  userRole: string;
}

const ContractsList = ({ userId, userRole }: ContractsListProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, [userId]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch the contracts from the database
      // For demonstration, we'll use mock data
      setTimeout(() => {
        const mockContracts: Contract[] = [
          {
            id: 'contract_1',
            name: 'Service Agreement - Agency',
            status: 'signed',
            createdAt: '2023-05-15T10:30:00Z',
            updatedAt: '2023-05-18T14:22:00Z',
            partyA: 'Your Company',
            partyB: 'Agency Name',
            url: '#',
          },
          {
            id: 'contract_2',
            name: 'Influencer Collaboration Agreement',
            status: 'pending',
            createdAt: '2023-06-05T09:15:00Z',
            updatedAt: '2023-06-05T09:15:00Z',
            partyA: 'Your Company',
            partyB: 'Influencer Name',
            url: '#',
          },
          {
            id: 'contract_3',
            name: 'Brand Partnership Agreement',
            status: 'draft',
            createdAt: '2023-06-10T16:45:00Z',
            updatedAt: '2023-06-10T16:45:00Z',
            partyA: 'Your Company',
            partyB: 'Brand Name',
            url: '#',
          },
        ];
        
        setContracts(mockContracts);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setIsLoading(false);
    }
  };

  const handleUploadContract = () => {
    toast.info('Contract upload functionality will be implemented soon');
  };

  const handleViewContract = (contractId: string) => {
    toast.info(`Viewing contract ${contractId}`);
    // In a real implementation, this would open the contract in a viewer
  };

  const handleSignContract = (contractId: string) => {
    toast.info(`Signing contract ${contractId}`);
    // In a real implementation, this would open the contract signing flow
  };

  const handleDownloadContract = (contractId: string) => {
    toast.info(`Downloading contract ${contractId}`);
    // In a real implementation, this would download the contract
  };

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
    <div className="space-y-4">
      {userRole === 'admin' || userRole === 'brand' ? (
        <div className="flex justify-end mb-4">
          <Button onClick={handleUploadContract}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload New Contract
          </Button>
        </div>
      ) : null}

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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewContract(contract.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contract.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSignContract(contract.id)}
                        >
                          <FileSignature className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadContract(contract.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contracts found</p>
            {userRole === 'admin' || userRole === 'brand' ? (
              <Button 
                variant="link" 
                onClick={handleUploadContract}
                className="mt-2"
              >
                Upload your first contract
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Contracts will appear here when they're shared with you
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ContractsList;
