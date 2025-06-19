
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientSection from "./form-sections/ClientSection";
import CampaignSection from "./form-sections/CampaignSection";
import DeliverablesSection from "./form-sections/DeliverablesSection";
import BudgetSection from "./form-sections/BudgetSection";
import AdditionalAssetsSection from "./form-sections/AdditionalAssetsSection";

interface ProjectFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const ProjectForm = ({ onSubmit, onCancel }: ProjectFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<any[]>([]);
  const [additionalAssets, setAdditionalAssets] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      shoot_date: "",
      status: "conceptualisation",
    },
  });

  const handleSubmit = async (values: any) => {
    if (!selectedClient) {
      toast.error("Please select or create a client");
      return;
    }

    setIsLoading(true);
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: values.title,
          description: values.description,
          due_date: values.due_date || null,
          shoot_date: values.shoot_date || null,
          status: values.status,
          client_id: selectedClient,
          campaign_id: selectedCampaign || null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create deliverables
      if (deliverables.length > 0) {
        const { error: deliverablesError } = await supabase
          .from("deliverables")
          .insert(
            deliverables.map((deliverable) => ({
              ...deliverable,
              project_id: project.id,
            }))
          );

        if (deliverablesError) throw deliverablesError;
      }

      // Create budget allocations
      if (budgetAllocations.length > 0) {
        const { error: budgetError } = await supabase
          .from("budget_allocations")
          .insert(
            budgetAllocations.map((budget) => ({
              ...budget,
              project_id: project.id,
            }))
          );

        if (budgetError) throw budgetError;
      }

      // Create additional assets
      if (additionalAssets.length > 0) {
        const { error: assetsError } = await supabase
          .from("additional_assets")
          .insert(
            additionalAssets.map((asset) => ({
              ...asset,
              project_id: project.id,
            }))
          );

        if (assetsError) throw assetsError;
      }

      toast.success("Project created successfully!");
      onSubmit();
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(`Error creating project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="conceptualisation">Conceptualisation</SelectItem>
                    <SelectItem value="pre-production">Pre-Production</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="post-production">Post-Production</SelectItem>
                    <SelectItem value="submission">Submission</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter project description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shoot_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shoot Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="client">
            <ClientSection
              selectedClient={selectedClient}
              onClientChange={setSelectedClient}
            />
          </TabsContent>
          
          <TabsContent value="campaign">
            <CampaignSection
              selectedClient={selectedClient}
              selectedCampaign={selectedCampaign}
              onCampaignChange={setSelectedCampaign}
            />
          </TabsContent>
          
          <TabsContent value="deliverables">
            <DeliverablesSection
              deliverables={deliverables}
              onDeliverablesChange={setDeliverables}
            />
          </TabsContent>
          
          <TabsContent value="budget">
            <BudgetSection
              budgetAllocations={budgetAllocations}
              onBudgetChange={setBudgetAllocations}
            />
          </TabsContent>
          
          <TabsContent value="assets">
            <AdditionalAssetsSection
              additionalAssets={additionalAssets}
              onAssetsChange={setAdditionalAssets}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
