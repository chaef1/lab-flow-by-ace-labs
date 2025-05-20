
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { sendContractEmail } from './pdf-editor/pdfEditorApi';

interface EmailSenderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  documentUrl: string;
  onSent?: () => void;
}

export const EmailSender = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  documentUrl,
  onSent
}: EmailSenderProps) => {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState(`Document for review: ${documentName}`);
  const [message, setMessage] = useState(`Please review the attached document ${documentName} and sign it at your earliest convenience.`);
  const [isSending, setIsSending] = useState(false);
  
  const handleSendEmail = async () => {
    if (!user) {
      toast.error('You must be logged in to send emails');
      return;
    }
    
    if (!recipientEmail) {
      toast.error('Please enter a recipient email address');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Use the enhanced pdfEditorApi function to send the email
      await sendContractEmail(
        user.id,
        documentId,
        recipientEmail,
        recipientName || recipientEmail.split('@')[0],
        message,
        subject
      );
      
      toast.success(`Email sent successfully to ${recipientEmail}`);
      onOpenChange(false);
      if (onSent) onSent();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Document by Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient's email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Enter recipient's name (optional)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Enter your message"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending || !recipientEmail}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
