
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  contact_person: string;
  brief: string;
}

interface ClientSectionProps {
  selectedClient: string;
  onClientChange: (clientId: string) => void;
}

const ClientSection = ({ selectedClient, onClientChange }: ClientSectionProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    contact_person: "",
    brief: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } else {
      setClients(data || []);
    }
  };

  const handleCreateClient = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert(newClient)
        .select()
        .single();

      if (error) throw error;

      setClients([...clients, data]);
      onClientChange(data.id);
      setIsCreateDialogOpen(false);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        contact_person: "",
        brief: "",
      });
      toast.success("Client created successfully!");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(`Error creating client: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Client</Label>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Create a new client with their project brief
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newClient.company_name}
                    onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={newClient.contact_person}
                    onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                    placeholder="Enter contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="brief">Project Brief *</Label>
                <Textarea
                  id="brief"
                  value={newClient.brief}
                  onChange={(e) => setNewClient({ ...newClient, brief: e.target.value })}
                  placeholder="Enter the project brief and requirements..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClient} disabled={!newClient.name || !newClient.brief}>
                  Create Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Select value={selectedClient} onValueChange={onClientChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name} {client.company_name && `(${client.company_name})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedClient && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          {clients.find(c => c.id === selectedClient) && (
            <div className="space-y-2">
              <p><strong>Client:</strong> {clients.find(c => c.id === selectedClient)?.name}</p>
              <p><strong>Company:</strong> {clients.find(c => c.id === selectedClient)?.company_name}</p>
              <p><strong>Contact:</strong> {clients.find(c => c.id === selectedClient)?.contact_person}</p>
              <p><strong>Email:</strong> {clients.find(c => c.id === selectedClient)?.email}</p>
              {clients.find(c => c.id === selectedClient)?.brief && (
                <div>
                  <strong>Brief:</strong>
                  <p className="mt-1 text-sm text-muted-foreground">{clients.find(c => c.id === selectedClient)?.brief}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSection;
