
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { sendContractEmail } from './pdf-editor/pdfEditorApi';
import { Mail, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [errors, setErrors] = useState<{email?: string}>({});
  
  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email address';
    return null;
  };
  
  const handleSendEmail = async () => {
    if (!user) {
      toast.error('You must be logged in to send emails');
      return;
    }
    
    // Validate email
    const emailError = validateEmail(recipientEmail);
    if (emailError) {
      setErrors({...errors, email: emailError});
      return;
    }
    
    setIsSending(true);
    setErrors({});
    
    try {
      const response = await sendContractEmail(
        user.id,
        documentId,
        recipientEmail,
        recipientName || recipientEmail.split('@')[0],
        message,
        subject
      );
      
      toast.success(`Email sent successfully to ${recipientEmail}`, {
        description: "The recipient will receive a link to view and sign the document.",
        duration: 5000,
      });
      
      onOpenChange(false);
      if (onSent) onSent();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Send Document by Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm font-medium">
              Recipient Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: undefined});
                }}
                placeholder="Enter recipient's email address"
                className={cn(
                  "pl-9",
                  errors.email && "border-destructive focus-visible:ring-destructive"
                )}
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.email && (
              <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">
              Recipient Name
            </Label>
            <div className="relative">
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's name (optional)"
                className="pl-9"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="focus-visible:ring-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Enter your message"
              className="resize-none focus-visible:ring-primary"
            />
          </div>
        </div>
        
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending || !recipientEmail}
            className="flex-1 sm:flex-initial"
            variant="gradient"
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
