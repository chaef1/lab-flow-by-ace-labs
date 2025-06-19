
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface Deliverable {
  id: string;
  type: string;
  name: string;
  description: string;
  budget: string;
  due_date: string;
  platforms?: string[];
  style?: string;
  content_type?: string;
}

interface DeliverablesSectionProps {
  deliverables: Deliverable[];
  onDeliverablesChange: (deliverables: Deliverable[]) => void;
}

const DeliverablesSection = ({ deliverables, onDeliverablesChange }: DeliverablesSectionProps) => {
  const [newDeliverable, setNewDeliverable] = useState<Deliverable>({
    id: "",
    type: "",
    name: "",
    description: "",
    budget: "",
    due_date: "",
    platforms: [],
    style: "",
    content_type: "",
  });

  const addDeliverable = () => {
    if (newDeliverable.name && newDeliverable.type) {
      const deliverableWithId = {
        ...newDeliverable,
        id: Date.now().toString(),
      };
      onDeliverablesChange([...deliverables, deliverableWithId]);
      setNewDeliverable({
        id: "",
        type: "",
        name: "",
        description: "",
        budget: "",
        due_date: "",
        platforms: [],
        style: "",
        content_type: "",
      });
    }
  };

  const removeDeliverable = (id: string) => {
    onDeliverablesChange(deliverables.filter(d => d.id !== id));
  };

  const updateDeliverable = (id: string, field: string, value: any) => {
    onDeliverablesChange(
      deliverables.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      )
    );
  };

  const platforms = ["meta", "tiktok", "linkedin", "youtube", "shorts"];

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const currentPlatforms = newDeliverable.platforms || [];
    if (checked) {
      setNewDeliverable({
        ...newDeliverable,
        platforms: [...currentPlatforms, platform]
      });
    } else {
      setNewDeliverable({
        ...newDeliverable,
        platforms: currentPlatforms.filter(p => p !== platform)
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Deliverable Type</Label>
          <Select
            value={newDeliverable.type}
            onValueChange={(value) => setNewDeliverable({ ...newDeliverable, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video_content">Video Content</SelectItem>
              <SelectItem value="paid_media">Paid Media</SelectItem>
              <SelectItem value="content_creators">Content Creators</SelectItem>
              <SelectItem value="graphic_design">Graphic Design</SelectItem>
              <SelectItem value="animation">Animation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Deliverable Name</Label>
          <Input
            value={newDeliverable.name}
            onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
            placeholder="Enter deliverable name"
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={newDeliverable.description}
          onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
          placeholder="Enter description"
        />
      </div>

      {newDeliverable.type === "video_content" && (
        <div className="space-y-4">
          <div>
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {platforms.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={newDeliverable.platforms?.includes(platform) || false}
                    onCheckedChange={(checked) => handlePlatformChange(platform, checked as boolean)}
                  />
                  <Label htmlFor={platform} className="capitalize">{platform}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Content Type</Label>
            <Select
              value={newDeliverable.content_type}
              onValueChange={(value) => setNewDeliverable({ ...newDeliverable, content_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Style</Label>
            <Input
              value={newDeliverable.style}
              onChange={(e) => setNewDeliverable({ ...newDeliverable, style: e.target.value })}
              placeholder="Enter video style"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Budget</Label>
          <Input
            type="number"
            step="0.01"
            value={newDeliverable.budget}
            onChange={(e) => setNewDeliverable({ ...newDeliverable, budget: e.target.value })}
            placeholder="Enter budget"
          />
        </div>
        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            value={newDeliverable.due_date}
            onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
          />
        </div>
      </div>

      <Button onClick={addDeliverable} disabled={!newDeliverable.name || !newDeliverable.type}>
        <Plus className="mr-2 h-4 w-4" />
        Add Deliverable
      </Button>

      {deliverables.length > 0 && (
        <div className="space-y-2">
          <Label>Added Deliverables</Label>
          {deliverables.map((deliverable) => (
            <Card key={deliverable.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">{deliverable.name}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDeliverable(deliverable.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{deliverable.type} - ${deliverable.budget}</p>
                {deliverable.platforms && deliverable.platforms.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Platforms: {deliverable.platforms.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliverablesSection;
