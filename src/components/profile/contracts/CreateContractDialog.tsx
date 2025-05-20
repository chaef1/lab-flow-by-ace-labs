
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUploading: boolean;
  uploadProgress: number;
  onCreate: () => void;
  contractName: string;
  setContractName: (name: string) => void;
  partyB: string;
  setPartyB: (party: string) => void;
  recipientEmail: string;
  setRecipientEmail: (email: string) => void;
  contractStatus: 'draft' | 'pending' | 'signed' | 'expired';
  setContractStatus: (status: 'draft' | 'pending' | 'signed' | 'expired') => void;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  contractContent: string;
  setContractContent: (content: string) => void;
  getTemplateContent: (template: string, data: any) => string;
  onReset: () => void;
}

export const CreateContractDialog = ({
  open,
  onOpenChange,
  isUploading,
  uploadProgress,
  onCreate,
  contractName,
  setContractName,
  partyB,
  setPartyB,
  recipientEmail,
  setRecipientEmail,
  contractStatus,
  setContractStatus,
  selectedTemplate,
  setSelectedTemplate,
  contractContent,
  setContractContent,
  getTemplateContent,
  onReset
}: CreateContractDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>
            Create a new contract from a template or write your own.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="createContractName">Contract Name*</Label>
            <Input
              id="createContractName"
              placeholder="Enter contract name"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createPartyB">Counterparty*</Label>
            <Input
              id="createPartyB"
              placeholder="Enter counterparty name"
              value={partyB}
              onChange={(e) => setPartyB(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createRecipientEmail">Recipient Email (for sending signature requests)</Label>
            <Input
              id="createRecipientEmail"
              type="email"
              placeholder="Enter recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createContractStatus">Status</Label>
            <Select
              value={contractStatus}
              onValueChange={(value) => setContractStatus(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending Signature</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="templateSelect">Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank Contract</SelectItem>
                <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                <SelectItem value="service">Service Agreement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractContent">Contract Content</Label>
            <Textarea
              id="contractContent"
              placeholder="Enter or modify contract content"
              rows={12}
              value={contractContent || getTemplateContent(selectedTemplate, {
                contractName,
                partyA: 'Your Company',
                partyB,
                date: new Date().toLocaleDateString(),
              })}
              onChange={(e) => setContractContent(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Creating contract...</Label>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              onReset();
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onCreate}
            disabled={isUploading || !contractName || !partyB}
          >
            Create Contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
