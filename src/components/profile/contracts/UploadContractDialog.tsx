
import { useState } from 'react';
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

interface UploadContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUploading: boolean;
  uploadProgress: number;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  contractName: string;
  setContractName: (name: string) => void;
  partyB: string;
  setPartyB: (party: string) => void;
  recipientEmail: string;
  setRecipientEmail: (email: string) => void;
  contractStatus: 'draft' | 'pending' | 'signed' | 'expired';
  setContractStatus: (status: 'draft' | 'pending' | 'signed' | 'expired') => void;
  onReset: () => void;
}

export const UploadContractDialog = ({
  open,
  onOpenChange,
  isUploading,
  uploadProgress,
  onUpload,
  contractName,
  setContractName,
  partyB,
  setPartyB,
  recipientEmail,
  setRecipientEmail,
  contractStatus,
  setContractStatus,
  onReset
}: UploadContractDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Contract</DialogTitle>
          <DialogDescription>
            Upload a new contract document. Supported formats: PDF, DOC, DOCX.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contractName">Contract Name*</Label>
            <Input
              id="contractName"
              placeholder="Enter contract name"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partyB">Counterparty*</Label>
            <Input
              id="partyB"
              placeholder="Enter counterparty name"
              value={partyB}
              onChange={(e) => setPartyB(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email (for sending signature requests)</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractStatus">Status</Label>
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
            <Label htmlFor="contractFile">Contract File*</Label>
            <Input
              id="contractFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={onUpload}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
