import { useState } from "react";
import Dashboard from "@/components/layout/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Upload, 
  Settings, 
  BarChart3, 
  Mail, 
  Target,
  Download,
  Eye
} from "lucide-react";
import { ImportUsersDialog } from "@/components/users/ImportUsersDialog";
import { useTestMailchimp } from "@/hooks/useTestMailchimp";

const MailchimpIntegration = () => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const testMailchimp = useTestMailchimp();

  const stats = [
    { title: "Total Subscribers", value: "1,234", icon: Users, color: "text-blue-600" },
    { title: "Influencers", value: "456", icon: Target, color: "text-pink-600" },
    { title: "Brands", value: "321", icon: BarChart3, color: "text-blue-600" },
    { title: "Agencies", value: "123", icon: Settings, color: "text-orange-600" },
  ];

  const audiences = [
    { name: "audience-influencer", count: 456, description: "Content creators and influencers" },
    { name: "audience-brand", count: 321, description: "Brand representatives and marketers" },
    { name: "audience-agency", count: 123, description: "Marketing agencies and teams" },
    { name: "audience-admin", count: 34, description: "Platform administrators" },
    { name: "audience-creator", count: 89, description: "Content creators and designers" },
  ];

  const recentCampaigns = [
    { name: "Welcome Series", status: "Active", sent: "1,200", opens: "45%", clicks: "12%" },
    { name: "Monthly Newsletter", status: "Sent", sent: "980", opens: "38%", clicks: "8%" },
    { name: "Product Update", status: "Draft", sent: "-", opens: "-", clicks: "-" },
  ];

  return (
    <Dashboard title="Mailchimp Integration" subtitle="Manage your email marketing and audience segments">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="audiences" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audiences">Audience Management</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="audiences" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audience Segments</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage your user segments and tags in Mailchimp
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setImportDialogOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Users
                    </Button>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {audiences.map((audience, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono">
                          {audience.name}
                        </Badge>
                        <div>
                          <p className="font-medium">{audience.count} subscribers</p>
                          <p className="text-sm text-muted-foreground">
                            {audience.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Campaigns</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View and manage your Mailchimp campaigns
                    </p>
                  </div>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.map((campaign, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={campaign.status === 'Active' ? 'default' : 
                                     campaign.status === 'Sent' ? 'secondary' : 'outline'}
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{campaign.sent}</p>
                          <p className="text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{campaign.opens}</p>
                          <p className="text-muted-foreground">Opens</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{campaign.clicks}</p>
                          <p className="text-muted-foreground">Clicks</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure your Mailchimp integration
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Status</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Connected</Badge>
                    <span className="text-sm text-muted-foreground">
                      API key configured and working
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default List</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Primary Audience</Badge>
                    <span className="text-sm text-muted-foreground">
                      New users are added to this list
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-tagging</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Enabled</Badge>
                    <span className="text-sm text-muted-foreground">
                      Users are automatically tagged by role and organization
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => testMailchimp.mutate()}
                      disabled={testMailchimp.isPending}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {testMailchimp.isPending ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure API Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ImportUsersDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />
      </div>
    </Dashboard>
  );
};

export default MailchimpIntegration;