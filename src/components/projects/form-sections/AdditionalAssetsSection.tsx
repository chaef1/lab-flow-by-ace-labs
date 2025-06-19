
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface AdditionalAsset {
  id: string;
  asset_type: string;
  platform: string;
  dimensions: string;
  due_date: string;
  specifications: string;
}

interface AdditionalAssetsSectionProps {
  additionalAssets: AdditionalAsset[];
  onAssetsChange: (assets: AdditionalAsset[]) => void;
}

const AdditionalAssetsSection = ({ additionalAssets, onAssetsChange }: AdditionalAssetsSectionProps) => {
  const [newAsset, setNewAsset] = useState<AdditionalAsset>({
    id: "",
    asset_type: "",
    platform: "",
    dimensions: "",
    due_date: "",
    specifications: "",
  });

  const assetTypes = [
    { value: "graphic_design", label: "Graphic Design" },
    { value: "animation", label: "Animation" },
  ];

  const platforms = [
    { value: "meta", label: "Meta" },
    { value: "tiktok", label: "TikTok" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
    { value: "shorts", label: "Shorts" },
    { value: "website", label: "Website" },
    { value: "print", label: "Print" },
  ];

  const dimensionOptions = [
    { value: "1080x1080", label: "1080x1080 (Square)" },
    { value: "1920x1080", label: "1920x1080 (Landscape)" },
    { value: "1080x1920", label: "1080x1920 (Portrait/Stories)" },
    { value: "1200x628", label: "1200x628 (Facebook Link)" },
    { value: "1584x396", label: "1584x396 (LinkedIn Banner)" },
    { value: "2560x1440", label: "2560x1440 (YouTube Thumbnail)" },
    { value: "custom", label: "Custom" },
  ];

  const addAsset = () => {
    if (newAsset.asset_type && newAsset.platform) {
      const assetWithId = {
        ...newAsset,
        id: Date.now().toString(),
      };
      onAssetsChange([...additionalAssets, assetWithId]);
      setNewAsset({
        id: "",
        asset_type: "",
        platform: "",
        dimensions: "",
        due_date: "",
        specifications: "",
      });
    }
  };

  const removeAsset = (id: string) => {
    onAssetsChange(additionalAssets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Asset Type</Label>
          <Select
            value={newAsset.asset_type}
            onValueChange={(value) => setNewAsset({ ...newAsset, asset_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Platform</Label>
          <Select
            value={newAsset.platform}
            onValueChange={(value) => setNewAsset({ ...newAsset, platform: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Dimensions</Label>
          <Select
            value={newAsset.dimensions}
            onValueChange={(value) => setNewAsset({ ...newAsset, dimensions: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dimensions" />
            </SelectTrigger>
            <SelectContent>
              {dimensionOptions.map((dimension) => (
                <SelectItem key={dimension.value} value={dimension.value}>
                  {dimension.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newAsset.dimensions === "custom" && (
            <Input
              className="mt-2"
              placeholder="Enter custom dimensions (e.g., 800x600)"
              value={newAsset.dimensions === "custom" ? "" : newAsset.dimensions}
              onChange={(e) => setNewAsset({ ...newAsset, dimensions: e.target.value })}
            />
          )}
        </div>
        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            value={newAsset.due_date}
            onChange={(e) => setNewAsset({ ...newAsset, due_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Specifications</Label>
        <Input
          value={newAsset.specifications}
          onChange={(e) => setNewAsset({ ...newAsset, specifications: e.target.value })}
          placeholder="Enter additional specifications"
        />
      </div>

      <Button 
        onClick={addAsset} 
        disabled={!newAsset.asset_type || !newAsset.platform}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Asset
      </Button>

      {additionalAssets.length > 0 && (
        <div className="space-y-2">
          <Label>Additional Assets</Label>
          {additionalAssets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">
                    {assetTypes.find(t => t.value === asset.asset_type)?.label}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {platforms.find(p => p.value === asset.platform)?.label}
                  {asset.dimensions && ` - ${asset.dimensions}`}
                </p>
                {asset.specifications && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {asset.specifications}
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

export default AdditionalAssetsSection;
