
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignProject, CampaignElement, campaignElementLabels, generateTasksForElements } from "@/lib/campaign-utils";

interface CreateCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (campaign: CampaignProject) => void;
}

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    campaignName: '',
    elements: [] as CampaignElement[],
    startDate: '',
    endDate: '',
    budget: '',
    campaignOwner: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!formData.campaignName.trim()) newErrors.campaignName = 'Campaign name is required';
    if (formData.elements.length === 0) newErrors.elements = 'At least one campaign element is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) newErrors.budget = 'Valid budget is required';
    if (!formData.campaignOwner.trim()) newErrors.campaignOwner = 'Campaign owner is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const campaignId = `campaign-${Date.now()}`;
    const tasks = generateTasksForElements(formData.elements, campaignId);

    const newCampaign: CampaignProject = {
      id: campaignId,
      clientName: formData.clientName,
      campaignName: formData.campaignName,
      elements: formData.elements,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: parseFloat(formData.budget),
      campaignOwner: formData.campaignOwner,
      status: 'briefed',
      tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSubmit(newCampaign);
    setFormData({
      clientName: '',
      campaignName: '',
      elements: [],
      startDate: '',
      endDate: '',
      budget: '',
      campaignOwner: ''
    });
    setErrors({});
    onClose();
  };

  const handleElementToggle = (element: CampaignElement, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        elements: [...prev.elements, element]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        elements: prev.elements.filter(e => e !== element)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Enter client name"
              className={errors.clientName ? 'border-red-500' : ''}
            />
            {errors.clientName && <p className="text-sm text-red-500">{errors.clientName}</p>}
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={formData.campaignName}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
              placeholder="Enter campaign name"
              className={errors.campaignName ? 'border-red-500' : ''}
            />
            {errors.campaignName && <p className="text-sm text-red-500">{errors.campaignName}</p>}
          </div>

          {/* Campaign Elements */}
          <div className="space-y-3">
            <Label>Campaign Elements</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(campaignElementLabels).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={formData.elements.includes(key as CampaignElement)}
                    onCheckedChange={(checked) => 
                      handleElementToggle(key as CampaignElement, checked as boolean)
                    }
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.elements && <p className="text-sm text-red-500">{errors.elements}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (ZAR)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="0.00"
              className={errors.budget ? 'border-red-500' : ''}
            />
            {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
          </div>

          {/* Campaign Owner */}
          <div className="space-y-2">
            <Label htmlFor="campaignOwner">Campaign Owner</Label>
            <Input
              id="campaignOwner"
              value={formData.campaignOwner}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignOwner: e.target.value }))}
              placeholder="Person responsible for this campaign"
              className={errors.campaignOwner ? 'border-red-500' : ''}
            />
            {errors.campaignOwner && <p className="text-sm text-red-500">{errors.campaignOwner}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
