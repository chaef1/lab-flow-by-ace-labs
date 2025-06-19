
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectForm from "./ProjectForm";

interface CreateProjectDialogProps {
  onProjectCreated?: () => void;
}

const CreateProjectDialog = ({ onProjectCreated }: CreateProjectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onProjectCreated?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a comprehensive project with client, campaign, deliverables, and budget allocation
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <ProjectForm onSubmit={handleClose} onCancel={() => setIsOpen(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
