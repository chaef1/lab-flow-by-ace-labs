import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useImportExistingUsers } from "@/hooks/useMailchimpImport";

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportUsersDialog = ({ open, onOpenChange }: ImportUsersDialogProps) => {
  const [importResults, setImportResults] = useState<any>(null);
  const importMutation = useImportExistingUsers();

  const handleImport = async () => {
    try {
      const results = await importMutation.mutateAsync();
      setImportResults(results);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleClose = () => {
    setImportResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Existing Users to Mailchimp</DialogTitle>
        </DialogHeader>
        
        {!importResults ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will import all existing users from your database to Mailchimp with proper audience tagging:
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">audience-influencer</Badge>
                <span className="text-sm">For influencer users</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">audience-brand</Badge>
                <span className="text-sm">For brand users</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">audience-agency</Badge>
                <span className="text-sm">For agency users</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">audience-admin</Badge>
                <span className="text-sm">For admin users</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">audience-creator</Badge>
                <span className="text-sm">For creator users</span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">What will happen:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• All users will be added to your Mailchimp audience</li>
                <li>• Users will be tagged based on their role and organization</li>
                <li>• Existing users in Mailchimp will have their tags updated</li>
                <li>• Each user type will get appropriate audience tags</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importing..." : "Start Import"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{importResults.totalUsers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{importResults.successCount}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{importResults.errorCount}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Summary by User Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(importResults.summary).map(([role, stats]: [string, any]) => (
                    <div key={role} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">audience-{role}</Badge>
                        <span className="text-sm font-medium capitalize">{role}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">✓ {stats.success + stats.updated}</span>
                        {stats.error > 0 && <span className="text-red-600">✗ {stats.error}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};